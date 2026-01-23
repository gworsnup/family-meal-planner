import { siteContent } from "@/content/site";

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

const menu_data: MenuItem[] = siteContent.nav;

export default menu_data;
