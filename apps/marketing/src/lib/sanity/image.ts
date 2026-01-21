import { createImageUrlBuilder } from "@sanity/image-url";
import type { ImageUrlBuilderSource } from "@sanity/image-url/lib/types/types";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;

const imageBuilder = projectId && dataset
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export const urlFor = (source: ImageUrlBuilderSource) => {
  if (!imageBuilder) {
    return null;
  }

  return imageBuilder.image(source);
};
