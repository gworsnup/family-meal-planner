import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import BlogDetailisArea from "./BlogDetailisArea";

 

export default function SingleBlog() {
  return (
     <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Blog Details" page="Blog Details" />
          <BlogDetailisArea />           
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
