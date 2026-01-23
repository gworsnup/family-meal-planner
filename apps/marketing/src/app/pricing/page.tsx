import Pricing from "@/components/pricing";
import { pricingContent } from "@/content/pricing";

export default async function PricingPage() {
  return <Pricing content={pricingContent} />;
}
