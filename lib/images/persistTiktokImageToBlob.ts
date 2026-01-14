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

export function isTikTokImageUrl(imageUrl: string) {
  try {
    const hostname = new URL(imageUrl).hostname;
    return isTikTokImageHostname(hostname);
  } catch {
    return false;
  }
}

type PersistResult = {
  didPersist: boolean;
  finalUrl: string;
  isTikTok: boolean;
  blobPath?: string;
};

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
    return { didPersist: false, finalUrl: imageUrl, isTikTok: false };
  }

  const hostname = new URL(imageUrl).hostname.toLowerCase();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      `[RecipeImage] Missing BLOB_READ_WRITE_TOKEN; skipping TikTok image persistence for recipe ${recipeId} (${hostname}).`,
    );
    return { didPersist: false, finalUrl: imageUrl, isTikTok: true };
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
      `[RecipeImage] Failed to fetch TikTok image (HTTP ${response.status}) for recipe ${recipeId} (${hostname}).`,
    );
  }

  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (!contentType || !SUPPORTED_CONTENT_TYPES.has(contentType)) {
    throw new Error(
      `[RecipeImage] Unsupported TikTok image content type (${contentType ?? "unknown"}) for recipe ${recipeId} (${hostname}).`,
    );
  }

  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      console.warn(
        `[RecipeImage] TikTok image too large (${contentLength} bytes); skipping persistence for recipe ${recipeId} (${hostname}).`,
      );
      return { didPersist: false, finalUrl: imageUrl, isTikTok: true };
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    console.warn(
      `[RecipeImage] TikTok image too large (${arrayBuffer.byteLength} bytes); skipping persistence for recipe ${recipeId} (${hostname}).`,
    );
    return { didPersist: false, finalUrl: imageUrl, isTikTok: true };
  }

  const extension = SUPPORTED_CONTENT_TYPES.get(contentType) ?? "jpg";
  const blobPath = `recipes/${slug}/${recipeId}/thumbnail.${extension}`;
  const blob = await put(blobPath, Buffer.from(arrayBuffer), {
    access: "public",
    contentType,
  });

  console.log(
    `[RecipeImage] Persisted TikTok image for recipe ${recipeId} (${hostname}) to ${blobPath}.`,
  );

  return { didPersist: true, finalUrl: blob.url, isTikTok: true, blobPath };
}
