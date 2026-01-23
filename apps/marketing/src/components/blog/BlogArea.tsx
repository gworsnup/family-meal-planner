import Link from "next/link";

type BlogPost = {
  imageSrc: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  href: string;
};

type RecentPost = {
  imageSrc: string;
  date: string;
  title: string;
  href: string;
};

type BlogAreaProps = {
  content?: {
    posts?: Partial<BlogPost>[];
    pagination?: string[];
    categories?: string[];
    recentPosts?: Partial<RecentPost>[];
    tags?: string[];
    subscribe?: { title?: string; description?: string };
  };
};

export default function BlogArea({ content }: BlogAreaProps) {
  const defaultPosts: BlogPost[] = [
    {
      imageSrc: "assets/images/blog/blog1.png",
      category: "Marketing",
      date: "June 18, 2025",
      title: "10 ways to supercharge startup with AI integration",
      excerpt:
        "The rapid advancements in AI have paved the way for startups to revolutionize...",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog2.png",
      category: "Business",
      date: "June 16, 2025",
      title: "Testing AI tools to improve product descriptions",
      excerpt:
        "Amazon is currently testing generative artificial intelligence (AI) tools for...",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog3.png",
      category: "Technology",
      date: "June 14, 2025",
      title: "3 best AI businesses to make money with in 2024",
      excerpt:
        "Everyone is buzzing about AI and its potential to revolutionize the business...",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog8.png",
      category: "Solutions",
      date: "June 12, 2025",
      title: "Phrase gives AI-generated content for me at a glance",
      excerpt:
        "While this is incredibly rewarding and has sharpened my editorial skills...",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog9.png",
      category: "Brand",
      date: "June 18, 2025",
      title: "Testing out Stabilization AI's free image editing tool",
      excerpt:
        "Stability AI is the company that created an open-source AI image generator...",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog10.png",
      category: "Business",
      date: "June 22, 2025",
      title: "How to started using AI-based tools as a designer",
      excerpt:
        "Acting on Jakob Nielsen’s stunning prediction of AI being the future...",
      href: "/single-blog",
    },
  ];
  const defaultPagination = ["1", "2", "3"];
  const defaultCategories = [
    "Business",
    "Development",
    "Technology",
    "Creative Director",
    "Uncategorized",
  ];
  const defaultRecentPosts: RecentPost[] = [
    {
      imageSrc: "assets/images/blog/blog1.png",
      date: "June 18, 2024",
      title: "6 profitable AI tech businesses to start",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog2.png",
      date: "June 18, 2024",
      title: "Why i decided to sell my B2B SaaS AI business",
      href: "/single-blog",
    },
    {
      imageSrc: "assets/images/blog/blog3.png",
      date: "June 18, 2024",
      title: "8 AI tools that will your streamline",
      href: "/single-blog",
    },
  ];
  const defaultTags = ["Marketing", "Business", "Solutions", "Studio", "Brand"];

  const posts = defaultPosts.map((post, index) => ({
    ...post,
    ...content?.posts?.[index],
  }));
  const pagination = content?.pagination ?? defaultPagination;
  const categories = content?.categories ?? defaultCategories;
  const recentPosts = defaultRecentPosts.map((post, index) => ({
    ...post,
    ...content?.recentPosts?.[index],
  }));
  const tags = content?.tags ?? defaultTags;
  const subscribeTitle = content?.subscribe?.title ?? "Subscribe";
  const subscribeDescription =
    content?.subscribe?.description ??
    "Subscribe to our newsletter and get the latest news updates lifetime";

  return (
    <div className="section azzle-section-padding6">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <div className="row">
              {posts.map((post, index) => (
                <div key={post.title} className="col-xl-6">
                  <div
                    className="single-post-item"
                    data-aos="fade-up"
                    data-aos-delay={500 + index * 100}
                  >
                    <div className="post-thumbnail">
                      <img src={post.imageSrc} alt="" />
                    </div>
                    <div className="post-content">
                      <div className="post-meta">
                        <div className="post-category">
                          <a href="#">{post.category}</a>
                        </div>
                        <div className="post-date">{post.date}</div>
                      </div>
                      <Link href={post.href}>
                        <h3 className="entry-title">{post.title}</h3>
                      </Link>
                      <p>{post.excerpt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* <!-- navigation --> */}
            <div className="azzle-navigation">
              <nav className="navigation pagination" aria-label="Posts">
                <div className="nav-links">
                  {pagination.map((page, index) =>
                    index === 0 ? (
                      <span key={page} aria-current="page" className="page-numbers current">
                        {page}
                      </span>
                    ) : (
                      <a key={page} className="page-numbers" href="#">
                        {page}
                      </a>
                    ),
                  )}
                  <a className="next page-numbers" href="#">
                    <img src="assets/images/blog/angle.png" alt="" />
                  </a>
                </div>
              </nav>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="right-sidebar" data-aos="fade-up" data-aos-delay="500">
              <div className="widget">
                <div className="wp-block-search__inside-wrapper">
                  <input type="search" placeholder="Type keyword here" className="wp-block-search__input" />
                  <button id="wp-block-search__button" type="submit">
                    <img src="assets/images/blog/search.png" alt="" />
                  </button>
                </div>
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">Categories:</h3>
                <ul>
                  {categories.map((category) => (
                    <li key={category}><a href="#">{category}</a></li>
                  ))}
                </ul>
              </div>
              <div className="widget azzle_recent_posts_Widget">
                <h3 className="wp-block-heading">Recent Posts:</h3>
                {recentPosts.map((post) => (
                  <Link key={post.title} className="post-item" href={post.href}>
                    <div className="post-thumb">
                      <img src={post.imageSrc} alt="" />
                    </div>
                    <div className="post-text">
                      <div className="post-date">{post.date}</div>
                      <p>{post.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">Tags:</h3>
                <div className="wp-block-tag-cloud">
                  {tags.map((tag) => (
                    <a key={tag} href="#">{tag}</a>
                  ))}
                </div>
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">{subscribeTitle}</h3>
                <p>{subscribeDescription}</p>
                <form action="#">
                  <div className="azzle-blog-subscriber">
                    <input type="email" placeholder="Enter your email address" />
                    <button id="azzle-blog-subscribe" type="button">Subscribe Now</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
