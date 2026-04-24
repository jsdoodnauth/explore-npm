import { AlertTriangle, Clock } from "lucide-react";
import type { AdminSubscription } from "@/lib/admin-queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function SubscriptionRow({ sub }: { sub: AdminSubscription }) {
  return (
    <a
      href={`/admin/users/${sub.user_id}`}
      className="flex items-center justify-between py-2.5 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{sub.user_name}</p>
        <p className="text-xs text-muted-foreground truncate">{sub.user_email}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
        {formatDate(sub.current_period_end)}
      </span>
    </a>
  );
}

interface Props {
  renewals: AdminSubscription[];
  failedPayments: AdminSubscription[];
}

export function SubscriptionAlerts({ renewals, failedPayments }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Upcoming renewals */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Renewing in 7 days</h2>
          {renewals.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{renewals.length}</span>
          )}
        </div>
        {renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renewals in the next 7 days.</p>
        ) : (
          <div className="divide-y divide-border">
            {renewals.map((sub) => (
              <SubscriptionRow key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>

      {/* Failed payments */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-medium text-foreground">Failed payments</h2>
          {failedPayments.length > 0 && (
            <span className="ml-auto text-xs font-medium text-destructive">{failedPayments.length}</span>
          )}
        </div>
        {failedPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No failed payments.</p>
        ) : (
          <div className="divide-y divide-border">
            {failedPayments.map((sub) => (
              <a
                key={sub.id}
                href={`/admin/users/${sub.user_id}`}
                className="flex items-center justify-between py-2.5 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{sub.user_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub.user_email}</p>
                </div>
                <span className="text-xs font-medium text-destructive whitespace-nowrap ml-4 capitalize">
                  {sub.status.replace(/_/g, " ")}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
