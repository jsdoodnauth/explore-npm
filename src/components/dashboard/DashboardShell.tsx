import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { userNav } from "@/components/dashboard/nav-config";
import type { Session } from "@/lib/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  session: Session;
}

export function DashboardShell({ children, session }: DashboardShellProps) {
  const { user } = session;

  return (
    <div className="flex min-h-svh bg-background">
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <a href="/" className="font-heading text-lg italic text-sidebar-foreground">
            Explore NPM
          </a>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav sections={userNav} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <UserMenu
            name={user.name ?? "User"}
            email={user.email}
            image={(user as { image?: string | null }).image}
          />
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <MobileSidebar sections={userNav} />
          <a
            href="/"
            className="font-heading text-lg italic text-foreground md:hidden"
          >
            Explore NPM
          </a>

          <div className="hidden md:block">
            <Breadcrumbs />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="md:hidden">
              <UserMenu
                name={user.name ?? "User"}
                email={user.email}
                image={(user as { image?: string | null }).image}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
