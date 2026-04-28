"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import type { NavSection } from "@/components/dashboard/nav-config";

interface MobileSidebarProps {
  sections: NavSection[];
}

export function MobileSidebar({ sections }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <a href="/" className="font-heading text-lg italic text-sidebar-foreground">
            Explore NPM
          </a>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav sections={sections} onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  );
}
