import "server-only";

import { lookup } from "node:dns/promises";
import { isIP, isIPv4, isIPv6 } from "node:net";

const MAX_URL_LENGTH = 2000;

function isPrivateIPv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

function isPrivateIPv6(address: string) {
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80");
}

export async function validateImportUrl(value: string) {
  const url = value.trim();
  if (!url) throw new Error("URL is required");
  if (url.length > MAX_URL_LENGTH) throw new Error("URL is too long");

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
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname === "0.0.0.0") {
    throw new Error("URL hostname is not allowed");
  }

  if (isIP(hostname)) {
    if ((isIPv4(hostname) && isPrivateIPv4(hostname)) || (isIPv6(hostname) && isPrivateIPv6(hostname))) {
      throw new Error("Private IPs are not allowed");
    }
  } else {
    const records = await lookup(hostname, { all: true });
    const hasPrivate = records.some((record) =>
      record.family === 4 ? isPrivateIPv4(record.address) : record.family === 6 ? isPrivateIPv6(record.address) : false,
    );
    if (hasPrivate) throw new Error("Private IPs are not allowed");
  }

  return url;
}
