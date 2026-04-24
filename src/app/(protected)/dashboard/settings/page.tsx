import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { PasswordForm } from "@/components/dashboard/PasswordForm";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <div className="sm:w-64 shrink-0">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card p-5 max-w-lg">
        {children}
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await requireSession(await headers());
  const { user } = session;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account preferences.</p>
      </div>

      <Section
        title="Profile"
        description="Update your display name visible across the platform."
      >
        <ProfileForm name={user.name ?? ""} email={user.email} />
      </Section>

      <div className="border-t border-border" />

      <Section
        title="Password"
        description="Change your login password. You'll stay signed in on this device."
      >
        <PasswordForm />
      </Section>
    </div>
  );
}
