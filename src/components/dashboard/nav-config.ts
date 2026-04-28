export type NavIconKey =
  | "layout-dashboard"
  | "heart"
  | "list"
  | "settings";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconKey;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const userNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
      { label: "Settings", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];
