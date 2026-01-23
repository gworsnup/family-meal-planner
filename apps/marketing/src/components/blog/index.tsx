import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import BlogArea from "./BlogArea";

 

type BlogContent = {
  breadcrumb?: { title?: string; page?: string };
  posts?: Partial<{
    imageSrc: string;
    category: string;
    date: string;
    title: string;
    excerpt: string;
    href: string;
  }>[];
  pagination?: string[];
  categories?: string[];
  recentPosts?: Partial<{
    imageSrc: string;
    date: string;
    title: string;
    href: string;
  }>[];
  tags?: string[];
  subscribe?: { title?: string; description?: string };
};

export default function Blog({ content }: { content?: BlogContent }) {
  const breadcrumbTitle = content?.breadcrumb?.title ?? "Our Blog";
  const breadcrumbPage = content?.breadcrumb?.page ?? "Our Blog";

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title={breadcrumbTitle} page={breadcrumbPage} />
          <BlogArea
            content={{
              posts: content?.posts,
              pagination: content?.pagination,
              categories: content?.categories,
              recentPosts: content?.recentPosts,
              tags: content?.tags,
              subscribe: content?.subscribe,
            }}
          />          
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
