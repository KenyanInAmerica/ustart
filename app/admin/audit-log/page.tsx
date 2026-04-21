// Admin audit log page — read-only view of all auditable actions in the system.
// Pagination and filters are URL search params so links are shareable.

import Link from "next/link";
import { fetchAuditLog, PAGE_SIZE } from "@/lib/admin/auditLog";
import type { AuditLogFilters } from "@/lib/admin/auditLog";
import { AuditLogFilters as FiltersBar } from "./AuditLogFilters";
import { actionBadgeClass } from "@/lib/audit/actionBadge";
import { PayloadCell } from "./PayloadCell";

interface PageProps {
  searchParams: {
    page?: string;
    actions?: string;
    user?: string;
    search?: string;
    from?: string;
    to?: string;
    role?: string;
  };
}

// Formats an ISO timestamp as a readable date + time string.
function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const filters: AuditLogFilters = {
    actions: searchParams.actions?.split(",").filter(Boolean),
    user: searchParams.user || undefined,
    search: searchParams.search || undefined,
    from: searchParams.from || undefined,
    to: searchParams.to || undefined,
    role: (searchParams.role as AuditLogFilters["role"]) || "all",
  };

  // Date range is required before we run a potentially expensive full-table query.
  const hasDateRange = !!(filters.from && filters.to);

  const { rows, total } = hasDateRange
    ? await fetchAuditLog(page, filters)
    : { rows: [], total: 0 };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build pagination href preserving current filters.
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (searchParams.actions) params.set("actions", searchParams.actions);
    if (searchParams.user) params.set("user", searchParams.user);
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    if (searchParams.role && searchParams.role !== "all") params.set("role", searchParams.role);
    params.set("page", String(p));
    return `/admin/audit-log?${params.toString()}`;
  }

  return (
    <div className="px-8 py-8 max-w-7xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Audit Log
      </h1>
      <p className="mb-6 text-[13px] text-[var(--text-muted)]">
        {hasDateRange
          ? `${total} event${total !== 1 ? "s" : ""}${total > 0 && totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`
          : "Set a date range to load results"}
      </p>

      {/* Client component — handles all filter interaction */}
      <FiltersBar />

      {!hasDateRange ? (
        <div className="py-16 text-center text-[14px] text-[var(--text-muted)]">
          Set a date range to load results. You can also filter by action type, role, or search by email or action.
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[var(--text-muted)]">
          No audit log entries match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--bg-subtle)]">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Payload</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { date, time } = formatDate(row.created_at);
                const target = row.target_email ?? row.target_id ?? null;
                return (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-[var(--bg-subtle)]"
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-[var(--text)]">{date}</span>
                      <br />
                      <span className="text-[11px] text-[var(--text-muted)]">{time}</span>
                    </td>

                    {/* Actor */}
                    <td className="max-w-[180px] truncate px-4 py-3 text-[var(--text-mid)]">
                      {row.actor_email ?? (
                        <span className="italic text-[var(--text-muted)]">system</span>
                      )}
                    </td>

                    {/* Action badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded border ${actionBadgeClass(row.action)}`}
                      >
                        {row.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="max-w-[180px] truncate px-4 py-3 text-[var(--text-muted)]">
                      {target ?? <span className="text-[var(--text-muted)]">—</span>}
                    </td>

                    {/* Payload */}
                    <td className="px-4 py-3">
                      <PayloadCell payload={row.payload} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center gap-2">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-[13px] text-[var(--text-mid)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
            >
              ← Prev
            </Link>
          )}
          <span className="px-2 text-[13px] text-[var(--text-muted)]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={pageHref(page + 1)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-[13px] text-[var(--text-mid)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
