import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { userNav, adminNav } from "@/components/dashboard/nav-config";
import type { Session } from "@/lib/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  session: Session;
}

export function DashboardShell({ children, session }: DashboardShellProps) {
  const { user } = session;
  const role = (user as { role?: string }).role;
  const isAdmin = role === "admin";

  const allSections = isAdmin ? [...userNav, ...adminNav] : userNav;

  return (
    <div className="flex min-h-svh bg-background">
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <a href="/" className="font-heading text-lg italic text-sidebar-foreground">
            Meridian
          </a>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav sections={allSections} />
        </div>

        {/* User menu pinned to bottom */}
        <div className="border-t border-sidebar-border p-3">
          <UserMenu
            name={user.name ?? "User"}
            email={user.email}
            image={(user as { image?: string | null }).image}
            role={role}
          />
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          {/* Mobile hamburger + logo */}
          <MobileSidebar sections={allSections} />
          <a
            href="/"
            className="font-heading text-lg italic text-foreground md:hidden"
          >
            Meridian
          </a>

          {/* Breadcrumbs (desktop) */}
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {/* Mobile: show user menu in header too */}
            <div className="md:hidden">
              <UserMenu
                name={user.name ?? "User"}
                email={user.email}
                image={(user as { image?: string | null }).image}
                role={role}
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
