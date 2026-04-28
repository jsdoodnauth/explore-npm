"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  List,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection, NavIconKey } from "@/components/dashboard/nav-config";

const ICONS: Record<NavIconKey, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "heart": Heart,
  "list": List,
  "settings": Settings,
};

interface SidebarNavProps {
  sections: NavSection[];
  onNavigate?: () => void;
}

export function SidebarNav({ sections, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
