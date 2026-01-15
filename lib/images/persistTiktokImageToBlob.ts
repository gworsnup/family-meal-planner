import "server-only";

import { put } from "@vercel/blob";

const SUPPORTED_CONTENT_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isTikTokImageHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized.endsWith("tiktokcdn.com")) return true;
  if (normalized.endsWith("tiktokcdn-us.com")) return true;
  if (normalized.endsWith("muscdn.com")) return true;
  return /(^|\.)p16-.*\.tiktokcdn-.*\.com$/i.test(normalized);
}

function isInstagramImageHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized.endsWith("cdninstagram.com")) return true;
  if (normalized.endsWith("fbcdn.net")) return true;
  if (normalized.endsWith("instagram.com")) return true;
  return false;
}

export function isTikTokImageUrl(imageUrl: string) {
  try {
    const hostname = new URL(imageUrl).hostname;
    return isTikTokImageHostname(hostname);
  } catch {
    return false;
  }
}

export function isInstagramImageUrl(imageUrl: string) {
  try {
    const hostname = new URL(imageUrl).hostname;
    return isInstagramImageHostname(hostname);
  } catch {
    return false;
  }
}

type PersistResult = {
  didPersist: boolean;
  finalUrl: string;
  source: "tiktok" | "instagram" | null;
  blobPath?: string;
};

type PersistRequest = {
  imageUrl: string;
  recipeId: string;
  slug: string;
  source: "tiktok" | "instagram";
};

async function persistSocialImageToBlob({
  imageUrl,
  recipeId,
  slug,
  source,
}: PersistRequest): Promise<PersistResult> {
  const hostname = new URL(imageUrl).hostname.toLowerCase();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      `[RecipeImage] Missing BLOB_READ_WRITE_TOKEN; skipping ${source} image persistence for recipe ${recipeId} (${hostname}).`,
    );
    return { didPersist: false, finalUrl: imageUrl, source };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(imageUrl, {
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(
      `[RecipeImage] Failed to fetch ${source} image (HTTP ${response.status}) for recipe ${recipeId} (${hostname}).`,
    );
  }

  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (!contentType || !SUPPORTED_CONTENT_TYPES.has(contentType)) {
    throw new Error(
      `[RecipeImage] Unsupported ${source} image content type (${contentType ?? "unknown"}) for recipe ${recipeId} (${hostname}).`,
    );
  }

  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      console.warn(
        `[RecipeImage] ${source} image too large (${contentLength} bytes); skipping persistence for recipe ${recipeId} (${hostname}).`,
      );
      return { didPersist: false, finalUrl: imageUrl, source };
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    console.warn(
      `[RecipeImage] ${source} image too large (${arrayBuffer.byteLength} bytes); skipping persistence for recipe ${recipeId} (${hostname}).`,
    );
    return { didPersist: false, finalUrl: imageUrl, source };
  }

  const extension = SUPPORTED_CONTENT_TYPES.get(contentType) ?? "jpg";
  const blobPath = `recipes/${slug}/${recipeId}/thumbnail.${extension}`;
  const blob = await put(blobPath, Buffer.from(arrayBuffer), {
    access: "public",
    contentType,
  });

  console.log(
    `[RecipeImage] Persisted ${source} image for recipe ${recipeId} (${hostname}) to ${blobPath}.`,
  );

  return { didPersist: true, finalUrl: blob.url, source, blobPath };
}

export async function persistTiktokImageToBlob({
  imageUrl,
  recipeId,
  slug,
}: {
  imageUrl: string;
  recipeId: string;
  slug: string;
}): Promise<PersistResult> {
  if (!isTikTokImageUrl(imageUrl)) {
    return { didPersist: false, finalUrl: imageUrl, source: null };
  }

  return persistSocialImageToBlob({
    imageUrl,
    recipeId,
    slug,
    source: "tiktok",
  });
}

export async function persistInstagramImageToBlob({
  imageUrl,
  recipeId,
  slug,
}: {
  imageUrl: string;
  recipeId: string;
  slug: string;
}): Promise<PersistResult> {
  if (!isInstagramImageUrl(imageUrl)) {
    return { didPersist: false, finalUrl: imageUrl, source: null };
  }

  return persistSocialImageToBlob({
    imageUrl,
    recipeId,
    slug,
    source: "instagram",
  });
}
