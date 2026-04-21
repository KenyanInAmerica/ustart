import { fetchAdminOverview } from "@/lib/admin/data";

export async function RecentSignupsSection() {
  const { recentSignups } = await fetchAdminOverview();

  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        Recent signups
      </h2>
      {recentSignups.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No recent signups.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">University</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.map((u, i) => (
                <tr
                  key={u.id}
                  className={`${i < recentSignups.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                >
                  <td className="px-4 py-3 text-[13px] text-[var(--text)]">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">{u.email}</td>
                  <td className="px-4 py-3 text-[13px] capitalize text-[var(--text-mid)]">{u.role}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{u.university_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                    {new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
