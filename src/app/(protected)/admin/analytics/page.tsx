import { Suspense } from "react";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import {
  getAnalyticsOverview,
  getAnalyticsSnapshots,
  getSignupsByMonth,
  getSubscriptionStatusBreakdown,
} from "@/lib/admin-queries";
import { AnalyticsContent } from "@/components/admin/AnalyticsContent";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireAdmin(await headers());

  const params = await searchParams;
  const days = Math.min(90, Math.max(7, parseInt(params.days ?? "30", 10) || 30));

  const [overview, snapshots, signupsByMonth, statusBreakdown] = await Promise.all([
    getAnalyticsOverview(),
    getAnalyticsSnapshots(days),
    getSignupsByMonth(),
    getSubscriptionStatusBreakdown(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform metrics and subscription performance.
        </p>
      </div>

      <Suspense fallback={null}>
        <AnalyticsContent
          overview={overview}
          snapshots={snapshots}
          signupsByMonth={signupsByMonth}
          statusBreakdown={statusBreakdown}
          days={days}
        />
      </Suspense>
    </div>
  );
}
