import Link from "next/link";
import type { NotionChildPage } from "@/lib/notion/types";

interface NotionSidebarProps {
  modules: NotionChildPage[];
  currentSlug: string;
  tier: string;
  tierLabel: string;
  backHref?: string;
  backLabel?: string;
  moduleBasePath?: string;
}

export function NotionSidebar({
  modules,
  currentSlug,
  tier,
  tierLabel,
  backHref,
  backLabel,
  moduleBasePath,
}: NotionSidebarProps) {
  const resolvedBackHref = backHref ?? "/dashboard/content";
  const resolvedBackLabel = backLabel ?? "← My Content";
  const resolvedModuleBase = moduleBasePath ?? `/dashboard/content/${tier}`;

  const navItems = modules.map((mod) => {
    const isActive = mod.slug === currentSlug;
    return (
      <Link
        key={mod.id}
        href={`${resolvedModuleBase}/${mod.slug}`}
        className={
          isActive
            ? "block bg-[var(--accent)]/10 text-[var(--accent)] font-semibold rounded-[var(--radius-sm)] px-3 py-2 text-sm"
            : "block text-[var(--text-mid)] px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] rounded-[var(--radius-sm)]"
        }
      >
        {mod.title}
      </Link>
    );
  });

  return (
    <>
      {/* Desktop sidebar — hidden below 860px */}
      <aside className="hidden min-[860px]:flex flex-col w-64 flex-shrink-0 bg-[var(--bg-card)] border-r border-[var(--border)] p-4 min-h-full overflow-y-auto">
        <Link
          href={resolvedBackHref}
          className="text-[var(--text-muted)] text-sm mb-4 inline-block hover:text-[var(--text)]"
        >
          {resolvedBackLabel}
        </Link>

        <p className="font-semibold text-[var(--text)] mb-1 text-sm">{tierLabel}</p>
        <p className="text-[var(--text-muted)] text-xs mb-4">
          0 of {modules.length} module{modules.length !== 1 ? "s" : ""}
        </p>

        <nav className="flex flex-col gap-0.5">{navItems}</nav>
      </aside>

      {/* Mobile top dropdown — hidden at 860px+ */}
      <details className="min-[860px]:hidden mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-sm)]">
        <summary className="px-4 py-3 cursor-pointer font-medium text-[var(--text)] flex items-center justify-between list-none text-sm">
          <span>
            {tierLabel} — Modules ({modules.length})
          </span>
          <span className="text-[var(--text-muted)]">▾</span>
        </summary>
        <nav className="p-2 border-t border-[var(--border)] flex flex-col gap-0.5">
          {navItems}
        </nav>
      </details>
    </>
  );
}
