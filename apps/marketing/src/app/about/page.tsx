import Aboutus from "@/components/about-us";
import { aboutContent } from "@/content/about";

export default async function AboutPage() {
  return <Aboutus content={aboutContent} />;
}
