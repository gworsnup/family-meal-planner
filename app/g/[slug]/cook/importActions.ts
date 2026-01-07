"use server";

import { cookies, headers } from "next/headers";
import { lookup } from "node:dns/promises";
import { isIP, isIPv4, isIPv6 } from "node:net";
import { prisma } from "@/lib/db";

const MAX_URL_LENGTH = 2000;

function isPrivateIPv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isPrivateIPv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

async function assertSafeUrl(url: string) {
  if (!url) throw new Error("URL is required");
  if (url.length > MAX_URL_LENGTH) {
    throw new Error("URL is too long");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must be http or https");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("URL hostname is not allowed");
  }

  if (isIP(hostname)) {
    if (isIPv4(hostname) && isPrivateIPv4(hostname)) {
      throw new Error("Private IPs are not allowed");
    }
    if (isIPv6(hostname) && isPrivateIPv6(hostname)) {
      throw new Error("Private IPs are not allowed");
    }
  } else {
    const records = await lookup(hostname, { all: true });
    const hasPrivate = records.some((record) => {
      if (record.family === 4) return isPrivateIPv4(record.address);
      if (record.family === 6) return isPrivateIPv6(record.address);
      return false;
    });
    if (hasPrivate) {
      throw new Error("Private IPs are not allowed");
    }
  }
}

async function getBaseUrl() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function startRecipeImport(slug: string, url: string) {
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    throw new Error("Unauthorized");
  }

  const cleanedUrl = url.trim();
  await assertSafeUrl(cleanedUrl);

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const recipe = await prisma.recipe.create({
    data: {
      workspaceId: workspace.id,
      title: "Importing…",
      sourceUrl: cleanedUrl,
      isDraft: true,
    },
    select: { id: true },
  });

  const recipeImport = await prisma.recipeImport.create({
    data: {
      workspaceId: workspace.id,
      recipeId: recipe.id,
      sourceUrl: cleanedUrl,
      status: "queued",
    },
    select: { id: true },
  });

  const origin = await getBaseUrl();
  void fetch(`${origin}/api/import/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ importId: recipeImport.id }),
  }).catch(() => null);

  return { recipeId: recipe.id, importId: recipeImport.id };
}
