import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { schemaTypes } from "./schemaTypes";

const projectId = process.env.SANITY_PROJECT_ID ?? "";
const dataset = process.env.SANITY_DATASET ?? "";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-01-01";

export default defineConfig({
  name: "marketing",
  title: "FamilyTable Marketing",
  projectId,
  dataset,
  apiVersion,
  plugins: [deskTool()],
  schema: {
    types: schemaTypes,
  },
});
