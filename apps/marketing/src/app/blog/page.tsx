import Blog from "@/components/blog";
import { blogContent } from "@/content/blog";

export default async function BlogPage() {
  return <Blog content={blogContent} />;
}
