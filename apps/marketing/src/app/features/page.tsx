import Service from "@/components/service";
import { featuresContent } from "@/content/features";

export default async function FeaturesPage() {
  return <Service content={featuresContent} />;
}
