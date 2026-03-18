// Client component for the users table — owns the panel open state.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminUser } from "@/types/admin";
import { UserPanel } from "@/components/admin/UserPanel";

interface UsersTableProps {
  users: AdminUser[];
  page: number;
  totalPages: number;
  search: string;
}

export function UsersTable({
  users,
  page,
  totalPages,
  search,
}: UsersTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  // Controlled input so Reset can clear the text in addition to the URL param.
  const [inputValue, setInputValue] = useState(search);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(`/admin/users?q=${encodeURIComponent(inputValue.trim())}&page=1`);
  }

  function handleReset() {
    setInputValue("");
    router.push("/admin/users");
  }

  function formatTier(tier: string | null) {
    if (!tier) return "—";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  const hasSearch = search.trim().length > 0;

  return (
    <>
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          name="q"
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search by email or name…"
          className="w-72 bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-white/[0.08] text-white text-[13px] rounded-lg hover:bg-white/[0.12] transition-colors"
        >
          Search
        </button>
        {/* Reset button — only visible when a search is active */}
        {hasSearch && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-[13px] text-white/50 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/20 transition-colors"
          >
            Reset
          </button>
        )}
      </form>

      {/* Table */}
      {users.length === 0 ? (
        <p className="text-[13px] text-white/30">No users found.</p>
      ) : (
        <>
          <div className="border border-white/[0.07] rounded-xl overflow-hidden mb-5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Add-ons</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const addons = [
                    user.has_explore && "Explore",
                    user.has_concierge && "Concierge",
                    user.has_parent_seat && "Parent Pack",
                  ].filter(Boolean);

                  return (
                    <tr
                      key={user.id}
                      className={`${i < users.length - 1 ? "border-b border-white/[0.05]" : ""} hover:bg-white/[0.02] transition-colors`}
                    >
                      <td className="px-4 py-3 text-[13px] text-white/80">{user.email}</td>
                      <td className="px-4 py-3 text-[13px] text-white/60">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-white/70">{formatTier(user.membership_tier)}</td>
                      <td className="px-4 py-3 text-[13px] text-white/50">
                        {addons.length > 0 ? addons.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-[13px] text-white/40 hover:text-white transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/admin/users?q=${encodeURIComponent(search)}&page=${page - 1}`)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-[13px] text-white/50 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[13px] text-white/40">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => router.push(`/admin/users?q=${encodeURIComponent(search)}&page=${page + 1}`)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-[13px] text-white/50 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Slide-out panel */}
      {selectedUser && (
        <UserPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
