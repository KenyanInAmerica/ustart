"use client";

// Filter bar for the audit log.
// All inputs update local component state — no query fires until the user
// clicks Apply. Clear All resets all state and immediately navigates to the
// unfiltered view. URL search params are updated only on Apply so links are
// shareable and bookmarkable.

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ACTION_GROUPS } from "@/lib/admin/auditLog";
import { actionBadgeClass } from "@/lib/audit/actionBadge";

// Flat list of all action values — used for select-all logic.
const ALL_ACTION_VALUES = ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.value));

// ── Action dropdown ────────────────────────────────────────────────────────────

interface ActionDropdownProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

function ActionDropdown({ selected, onChange }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
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
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
    // Dropdown stays open — user can continue selecting.
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_ACTION_VALUES]);
  }

  const triggerLabel =
    selected.length === 0 ? "All Actions" : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#0C1220] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-white/70 hover:border-white/20 focus:outline-none focus:border-white/20 transition-colors min-w-[140px]"
      >
        <span className="flex-1 text-left truncate">{triggerLabel}</span>
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-[#0C1220] border border-white/[0.10] rounded-xl shadow-2xl max-h-96 overflow-y-auto">
          {/* Select all / Deselect all */}
          <div className="sticky top-0 bg-[#0C1220] border-b border-white/[0.07] px-3 py-2.5">
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] text-white/50 hover:text-white transition-colors"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Grouped sections */}
          <div className="py-2">
            {ACTION_GROUPS.map((group) => (
              <div key={group.label} className="mb-1">
                {/* Section header — non-interactive */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-white/30">
                  {group.label}
                </p>
                {group.actions.map((action) => {
                  const checked = selected.includes(action.value);
                  return (
                    <label
                      key={action.value}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(action.value)}
                        className="w-3.5 h-3.5 rounded accent-white/80 shrink-0 cursor-pointer"
                      />
                      <span className="text-[12px] text-white/70 flex-1">{action.label}</span>
                      {/* Small badge showing the raw action string */}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                          checked
                            ? actionBadgeClass(action.value)
                            : "border-white/[0.07] text-white/25"
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

// ── Main filter bar ────────────────────────────────────────────────────────────

export function AuditLogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state — initialised from URL on mount so a shared link pre-fills the UI.
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") ?? "");
  const [localFrom, setLocalFrom] = useState(searchParams.get("from") ?? "");
  const [localTo, setLocalTo] = useState(searchParams.get("to") ?? "");
  const [localRole, setLocalRole] = useState(searchParams.get("role") ?? "all");
  const [localActions, setLocalActions] = useState<string[]>(
    searchParams.get("actions")?.split(",").filter(Boolean) ?? []
  );
  // Shown when date range is incomplete or missing.
  const [dateError, setDateError] = useState("");

  // Builds URL params from current local state and navigates.
  // Wrapped in startTransition so isPending is true while Next.js fetches the new page.
  const apply = useCallback(() => {
    // Date range is required — the table can grow large enough that an unscoped
    // query would be slow and unhelpful once the product has been live for months.
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
    // Reset pagination when filter set changes.
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [router, pathname, localSearch, localFrom, localTo, localRole, localActions]);

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
    <div className="space-y-3 mb-6">
      {/* Row 1: full-width text search — most general, placed prominently */}
      <input
        type="text"
        placeholder="Search by email, action, or payload…"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
        className="w-full bg-[#0C1220] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
      />

      {/* Row 2: targeted filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Action type dropdown */}
        <ActionDropdown selected={localActions} onChange={setLocalActions} />

        {/* Date range */}
        <input
          type="date"
          value={localFrom}
          onChange={(e) => { setLocalFrom(e.target.value); setDateError(""); }}
          className="bg-[#0C1220] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-white/70 focus:outline-none focus:border-white/20"
        />
        <span className="text-white/30 text-[13px]">to</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => { setLocalTo(e.target.value); setDateError(""); }}
          className="bg-[#0C1220] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-white/70 focus:outline-none focus:border-white/20"
        />

        {/* Role filter — appearance-none hides the native arrow; custom chevron is positioned absolutely */}
        <div className="relative">
          <select
            value={localRole}
            onChange={(e) => setLocalRole(e.target.value)}
            className="appearance-none bg-[#0C1220] border border-white/[0.07] rounded-lg pl-3 pr-8 py-2 text-[13px] text-white/70 focus:outline-none focus:border-white/20"
          >
            <option value="all">All actions</option>
            <option value="admin">Admin only</option>
            <option value="user">User only</option>
          </select>
          {/* Custom chevron — pointer-events-none so clicks pass through to the select */}
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Date validation error */}
      {dateError && (
        <p className="text-[12px] text-red-400/80">{dateError}</p>
      )}

      {/* Row 3: Apply / Clear All — spinner appears inside Apply while navigation is pending */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#05080F] text-[13px] font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-60"
        >
          {isPending && (
            <svg
              className="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          Apply
        </button>
        {hasFilters && !isPending && (
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2 text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
