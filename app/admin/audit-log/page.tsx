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
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Audit Log
      </h1>
      <p className="text-[13px] text-white/40 mb-6">
        {hasDateRange
          ? `${total} event${total !== 1 ? "s" : ""}${total > 0 && totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`
          : "Set a date range to load results"}
      </p>

      {/* Client component — handles all filter interaction */}
      <FiltersBar />

      {!hasDateRange ? (
        <div className="text-center py-16 text-white/30 text-[14px]">
          Set a date range to load results. You can also filter by action type, role, or search by email or action.
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-[14px]">
          No audit log entries match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left py-2.5 pr-4 font-medium text-white/40 whitespace-nowrap">Timestamp</th>
                <th className="text-left py-2.5 pr-4 font-medium text-white/40">Actor</th>
                <th className="text-left py-2.5 pr-4 font-medium text-white/40">Action</th>
                <th className="text-left py-2.5 pr-4 font-medium text-white/40">Target</th>
                <th className="text-left py-2.5 font-medium text-white/40">Payload</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { date, time } = formatDate(row.created_at);
                const target = row.target_email ?? row.target_id ?? null;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors align-top"
                  >
                    {/* Timestamp */}
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="text-white/70">{date}</span>
                      <br />
                      <span className="text-white/30 text-[11px]">{time}</span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 pr-4 text-white/60 max-w-[180px] truncate">
                      {row.actor_email ?? (
                        <span className="text-white/25 italic">system</span>
                      )}
                    </td>

                    {/* Action badge */}
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded border ${actionBadgeClass(row.action)}`}
                      >
                        {row.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3 pr-4 text-white/50 max-w-[180px] truncate">
                      {target ?? <span className="text-white/20">—</span>}
                    </td>

                    {/* Payload */}
                    <td className="py-3">
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
        <div className="flex items-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white border border-white/[0.07] rounded-lg hover:border-white/20 transition-colors"
            >
              ← Prev
            </Link>
          )}
          <span className="text-[13px] text-white/30 px-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={pageHref(page + 1)}
              className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white border border-white/[0.07] rounded-lg hover:border-white/20 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
