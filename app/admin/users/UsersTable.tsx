"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminUser } from "@/types/admin";
import { UserPanel } from "@/components/admin/UserPanel";
import { DeleteUserModal } from "@/components/admin/DeleteUserModal";
import { Button } from "@/components/ui/Button";
import { reactivateUser } from "@/lib/actions/admin/users";

interface UsersTableProps {
  users: AdminUser[];
  page: number;
  totalPages: number;
  search: string;
}

function formatTier(tier: string | null): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function statusBadge(user: AdminUser): string {
  if (!user.is_active) return "bg-[#E54B4B]/10 text-[#E54B4B] border border-[#E54B4B]/20";
  if (user.is_admin) return "bg-[#3083DC]/10 text-[#3083DC] border border-[#3083DC]/20";
  return "bg-[#4ECBA5]/10 text-[#4ECBA5] border border-[#4ECBA5]/20";
}

function statusLabel(user: AdminUser): string {
  if (!user.is_active) return "Inactive";
  if (user.is_admin) return "Admin";
  return "Active";
}

export function UsersTable({ users, page, totalPages, search }: UsersTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [inputValue, setInputValue] = useState(search);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [, startReactivate] = useTransition();

  function handleReactivate(userId: string) {
    setReactivatingId(userId);
    setReactivateError(null);
    startReactivate(async () => {
      const result = await reactivateUser(userId);
      setReactivatingId(null);
      if (!result.success) {
        setReactivateError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(`/admin/users?q=${encodeURIComponent(inputValue.trim())}&page=1`);
  }

  function handleReset() {
    setInputValue("");
    router.push("/admin/users");
  }

  function handleDeleted() {
    setDeleteTarget(null);
    router.refresh();
  }

  const hasSearch = search.trim().length > 0;

  return (
    <>
      <form onSubmit={handleSearch} className="mb-5 flex gap-2">
        <input
          name="q"
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search by email or name…"
          className="w-72 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <Button type="submit" variant="primary" size="sm">Search</Button>
        {hasSearch && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </form>

      {users.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No users found.</p>
      ) : (
        <>
          <div className="mb-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Add-ons</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const addons = [
                    user.has_parent_seat && "Parent Pack",
                  ].filter(Boolean);

                  return (
                    <tr
                      key={user.id}
                      className={`${i < users.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                    >
                      <td className="px-4 py-3 text-[13px] text-[var(--text)]">{user.email}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(user)}`}>
                          {statusLabel(user)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">{formatTier(user.membership_tier)}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                        {addons.length > 0 ? addons.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!user.is_active && (
                            <Button
                              onClick={() => handleReactivate(user.id)}
                              disabled={reactivatingId === user.id}
                              size="sm"
                            >
                              {reactivatingId === user.id ? "Reactivating…" : "Reactivate"}
                            </Button>
                          )}
                          {!user.is_admin && (
                            <Button
                              onClick={() => setDeleteTarget(user)}
                              variant="destructive"
                              size="sm"
                            >
                              {user.is_active ? "Delete" : "Erase"}
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedUser(user)}
                            variant="secondary"
                            size="sm"
                          >
                            Manage
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/admin/users?q=${encodeURIComponent(search)}&page=${page - 1}`)}
                disabled={page <= 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-[13px] text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => router.push(`/admin/users?q=${encodeURIComponent(search)}&page=${page + 1}`)}
                disabled={page >= totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {reactivateError && (
        <p className="mt-3 text-[13px] text-[var(--destructive)]" role="alert">
          {reactivateError}
        </p>
      )}

      {selectedUser && (
        <UserPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
