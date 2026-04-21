"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronIcon } from "@/components/ui/ChevronIcon";
import { Button } from "@/components/ui/Button";
import { ACTION_GROUPS } from "@/lib/admin/auditLog";
import { actionBadgeClass } from "@/lib/audit/actionBadge";

const ALL_ACTION_VALUES = ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.value));

interface ActionDropdownProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

function ActionDropdown({ selected, onChange }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const allSelected = ALL_ACTION_VALUES.every((v) => selected.includes(v));

  function toggleAction(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_ACTION_VALUES]);
  }

  const triggerLabel = selected.length === 0 ? "All Actions" : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[160px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2 text-[13px] text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <span className="flex-1 truncate text-left">{triggerLabel}</span>
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-96 w-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
          <div className="sticky top-0 border-b border-[var(--border)] bg-white px-3 py-2.5">
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="py-2">
            {ACTION_GROUPS.map((group) => (
              <div key={group.label} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {group.label}
                </p>
                {group.actions.map((action) => {
                  const checked = selected.includes(action.value);
                  return (
                    <label
                      key={action.value}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(action.value)}
                        className="h-3.5 w-3.5 shrink-0 rounded accent-[var(--accent)]"
                      />
                      <span className="flex-1 text-[12px] text-[var(--text)]">{action.label}</span>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${
                          checked
                            ? actionBadgeClass(action.value)
                            : "border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {action.value.split(".").pop()}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") ?? "");
  const [localFrom, setLocalFrom] = useState(searchParams.get("from") ?? "");
  const [localTo, setLocalTo] = useState(searchParams.get("to") ?? "");
  const [localRole, setLocalRole] = useState(searchParams.get("role") ?? "all");
  const [localActions, setLocalActions] = useState<string[]>(
    searchParams.get("actions")?.split(",").filter(Boolean) ?? []
  );
  const [dateError, setDateError] = useState("");

  const apply = useCallback(() => {
    if (!localFrom || !localTo) {
      setDateError("A date range is required. Please set both a start and end date.");
      return;
    }
    setDateError("");

    const params = new URLSearchParams();
    if (localSearch) params.set("search", localSearch);
    if (localFrom) params.set("from", localFrom);
    if (localTo) params.set("to", localTo);
    if (localRole && localRole !== "all") params.set("role", localRole);
    if (localActions.length > 0) params.set("actions", localActions.join(","));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [localActions, localFrom, localRole, localSearch, localTo, pathname, router]);

  function clearAll() {
    setLocalSearch("");
    setLocalFrom("");
    setLocalTo("");
    setLocalRole("all");
    setLocalActions([]);
    setDateError("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters =
    localSearch || localFrom || localTo || localRole !== "all" || localActions.length > 0;

  return (
    <div className="mb-6 space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
      <input
        type="text"
        placeholder="Search by email, action, or payload…"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-2">
        <ActionDropdown selected={localActions} onChange={setLocalActions} />
        <input
          type="date"
          value={localFrom}
          onChange={(e) => { setLocalFrom(e.target.value); setDateError(""); }}
          className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
        />
        <span className="text-[13px] text-[var(--text-muted)]">to</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => { setLocalTo(e.target.value); setDateError(""); }}
          className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
        />
        <div className="relative">
          <select
            value={localRole}
            onChange={(e) => setLocalRole(e.target.value)}
            className="appearance-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] py-2 pl-3 pr-8 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="all">All actions</option>
            <option value="admin">Admin only</option>
            <option value="user">User only</option>
          </select>
          <ChevronIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      </div>

      {dateError && <p className="text-[12px] text-[var(--destructive)]">{dateError}</p>}

      <div className="flex items-center gap-2">
        <Button type="button" onClick={apply} disabled={isPending} size="sm">
          {isPending ? "Applying…" : "Apply"}
        </Button>
        {hasFilters && !isPending && (
          <Button type="button" onClick={clearAll} variant="ghost" size="sm">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
