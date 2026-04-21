// Admin users page — paginated table of all users with a slide-out management panel.
// Search and pagination are handled via URL search params for deep-linkability.
// Individual PDF assignments are managed in the Content section, not here.

import { fetchAdminUsers } from "@/lib/admin/data";
import { UsersTable } from "./UsersTable";

interface PageProps {
  searchParams: { page?: string; q?: string };
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const search = searchParams.q ?? "";

  const { users, total } = await fetchAdminUsers(page, search);
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Users
      </h1>
      <p className="mb-6 text-[13px] text-[var(--text-muted)]">
        {total} total user{total !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      <UsersTable
        users={users}
        page={page}
        totalPages={totalPages}
        search={search}
      />
    </div>
  );
}
