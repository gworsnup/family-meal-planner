
interface MenuItem {
  title: string;
  path: string;
  has_submenu?: boolean;
  sub_menus?: {
    title: string;
    path: string;
    has_inner_submenu?: boolean;
    noBorder?: boolean;
    sub_menus?: { title: string; path: string; }[];
  }[];
  noBorder?: boolean;
}[];

const menu_data: MenuItem[] = [
  {
    title: "Demos",
    has_submenu: true,
    path: "#",
    sub_menus: [
      { title: "Home 01", path: "/" },
      { title: "Home 02", path: "/home-2" },
      { title: "Home 03", path: "/home-3" },
    ],
  },
  { title: "About Us", has_submenu: false, path: "/about-us" },
  {
    title: "Pages",
    has_submenu: true,
    path: "#",
    sub_menus: [
      {
        title: "Team",
        path: "#",
        has_inner_submenu: true,
        noBorder: true,
        sub_menus: [
          { title: "team", path: "/team" },
          { title: "Team Details", path: "/single-team" },
        ],
      },
      {
        title: "Portfolio",
        path: "#",
        has_inner_submenu: true,
        noBorder: true,
        sub_menus: [
          { title: "portfolio", path: "/portfolio" },
          { title: "portfolio Details", path: "/single-portfolio" },
        ],
      },
      {
        title: "Service",
        path: "#",
        has_inner_submenu: true,
        noBorder: true,
        sub_menus: [
          { title: "Service", path: "/service" },
          { title: "Service Details", path: "/single-service" },
        ],
      },
      {
        title: "Utility",
        path: "#",
        has_inner_submenu: true,
        noBorder: true,
        sub_menus: [
          { title: "faq", path: "/faq" },
          { title: "pricing", path: "/pricing" },
          { title: "404", path: "/errors-404" },
        ],
      },
      {
        title: "Account",
        path: "#",
        has_inner_submenu: true,
        noBorder: true,
        sub_menus: [
          { title: "sign up", path: "/sign-up" },
          { title: "sign in", path: "/sign-in" },
          { title: "reset password", path: "/reset-password" },
        ],
      },
    ],
  },
  {
    title: "Blog",
    has_submenu: true,
    path: "#",
    sub_menus: [
      { title: "Blog", path: "/blog" },
      { title: "Blog Details", path: "/single-blog" },
    ],
  },
  { title: "Contact", has_submenu: false, path: "/contact-us" },
];


export default menu_data;