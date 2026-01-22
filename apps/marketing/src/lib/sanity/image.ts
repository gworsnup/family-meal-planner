import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;

if (!projectId || !dataset) {
  // Don’t crash import-time in edge cases; throw when used
  // (Next may import this during build even if not used)
  // We'll throw in urlFor.
}

const builder = projectId && dataset
  ? imageUrlBuilder({ projectId, dataset })
  : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error("Sanity image URL builder not configured. Missing SANITY_PROJECT_ID or SANITY_DATASET.");
  }
  return builder.image(source);
}
