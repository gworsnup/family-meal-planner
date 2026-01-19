import Link from "next/link"; 
interface BreacrumbProps {
  title?: string;
  page?: string;
}


export default function Breacrumb({ title, page  }: BreacrumbProps) {
  return (
    <div className="azzle-breadcrumb">
      <div className="container">
        <div className="azzle-breadcrumb-content">
          <h1 className="azzle-breadcrumb-title" data-aos="fade-up" data-aos-delay="500">{title}</h1>
          <div className="azzle-breadcrumb-wrapper" data-aos="fade-up" data-aos-delay="700">
            <div className="azzle-breadcrumb-wrap">
              <div className="azzle-breadcrumb-menu">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><img src="assets/images/about/arrow-right.png" alt="" /></li>
                  <li aria-current="page">{page}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
