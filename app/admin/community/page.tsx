// Admin community page — lists all students who have agreed to community rules.
// Includes a CSV export button for the WhatsApp group admin workflow.

import { fetchCommunityMembers } from "@/lib/admin/data";
import { CommunityExportButton } from "@/components/admin/CommunityExportButton";

export default async function AdminCommunityPage() {
  const members = await fetchCommunityMembers();

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
            Community
          </h1>
          <p className="text-[13px] text-white/40">
            {members.length} member{members.length !== 1 ? "s" : ""} have agreed to community rules
          </p>
        </div>
        <CommunityExportButton members={members} />
      </div>

      {members.length === 0 ? (
        <p className="text-[13px] text-white/30">No community members yet.</p>
      ) : (
        <div className="border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">University</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Agreed</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  className={i < members.length - 1 ? "border-b border-white/[0.05]" : ""}
                >
                  <td className="px-4 py-3 text-[13px] text-white/80">{m.email}</td>
                  <td className="px-4 py-3 text-[13px] text-white/60">
                    {[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/50">{m.university_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-white/50">{m.phone_number ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-white/40">
                    {new Date(m.agreed_at).toLocaleDateString("en-US", {
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
