interface MenuItem {
  title: string;
  path: string;
  has_submenu?: boolean;
  sub_menus?: {
    title: string;
    path: string;
    has_inner_submenu?: boolean;
    noBorder?: boolean;
    sub_menus?: { title: string; path: string }[];
  }[];
  noBorder?: boolean;
}

const menu_data: MenuItem[] = [
  { title: "Features", path: "/features" },
  { title: "Pricing", path: "/pricing" },
  { title: "Blog", path: "/blog" },
  { title: "About", path: "/about" },
  { title: "Contact", path: "/contact" },
];

export default menu_data;
