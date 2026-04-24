export type NavIconKey =
  | "layout-dashboard"
  | "credit-card"
  | "users"
  | "settings"
  | "shield-check"
  | "bar-chart-3"
  | "flag"
  | "receipt";

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
      { label: "Billing", href: "/dashboard/billing", icon: "credit-card" },
      { label: "Settings", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    title: "Admin",
    items: [
      { label: "Overview", href: "/admin", icon: "shield-check" },
      { label: "Users", href: "/admin/users", icon: "users" },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: "receipt" },
      { label: "Analytics", href: "/admin/analytics", icon: "bar-chart-3" },
      { label: "Feature Flags", href: "/admin/flags", icon: "flag" },
    ],
  },
];
