// Admin pricing management section — lists all products with inline edit forms.
// Toggling edit on a row reveals the form for that row; all other rows remain read-only.
// Client Component: needed for per-row edit toggle state and form submission.

"use client";

import { useState, useEffect } from "react";
import { updatePricing } from "@/lib/actions/admin/updatePricing";
import type { PricingItem } from "@/lib/config/pricing";

interface Props {
  items: PricingItem[];
}

// Editable form state — name and billing are intentionally excluded (read-only).
interface EditState {
  description: string;
  price: string; // string so the input stays controlled; parsed to number on save
  features: string; // newline-separated — split/joined on load and save
  is_public: boolean;
}

function toEditState(item: PricingItem): EditState {
  return {
    description: item.description ?? "",
    price: String(item.price),
    features: (item.features ?? []).join("\n"),
    is_public: item.is_public,
  };
}

// Single pricing row — either read-only or inline edit form.
function PricingRow({ item }: { item: PricingItem }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>(toEditState(item));
  // Snapshot of form state when editing opens — used to detect unsaved changes.
  const [originalForm, setOriginalForm] = useState<EditState>(toEditState(item));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Save is only enabled when at least one editable field differs from the original.
  const isDirty =
    form.description !== originalForm.description ||
    form.price !== originalForm.price ||
    form.features !== originalForm.features ||
    form.is_public !== originalForm.is_public;

  // Auto-dismiss success messages after 3 seconds.
  useEffect(() => {
    if (message?.ok) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  function startEdit() {
    const initial = toEditState(item);
    setForm(initial);
    setOriginalForm(initial);
    setMessage(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updatePricing(item.id, {
      // Name is intentionally read-only — changing it requires updates across
      // content pages, dashboard labels, and email templates.
      name: item.name,
      // Billing type is intentionally read-only — changing it requires cascading
      // updates to memberships, addons, and Stripe configuration.
      billing: item.billing,
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      // Split by newline, filter empty lines.
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      is_public: form.is_public,
    });
    setSaving(false);
    if (result.success) {
      setMessage({ ok: true, text: "Saved." });
      setEditing(false);
    } else {
      setMessage({ ok: false, text: result.error });
    }
  }

  // Read-only row view.
  if (!editing) {
    return (
      <tr className="border-b border-white/[0.05] last:border-0">
        <td className="py-3 pr-4 font-dm-sans text-sm text-white/80">{item.name}</td>
        <td className="py-3 pr-4 font-dm-sans text-sm text-white/60 tabular-nums">
          ${item.price}
        </td>
        <td className="py-3 pr-4 font-dm-sans text-xs text-white/50 capitalize">
          {item.billing}
        </td>
        <td className="py-3 pr-4">
          <span
            className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
              item.is_public
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/[0.05] text-white/30"
            }`}
          >
            {item.is_public ? "Yes" : "No"}
          </span>
        </td>
        <td className="py-3 text-right">
          {message && (
            <span
              className={`text-xs mr-3 ${message.ok ? "text-emerald-400" : "text-red-400"}`}
            >
              {message.text}
            </span>
          )}
          <button
            onClick={startEdit}
            className="text-xs text-white/40 hover:text-white border border-white/[0.10] hover:border-white/30 px-3 py-1 rounded-lg transition-colors"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  }

  // Inline edit form — spans all columns via a sub-row.
  return (
    <>
      {/* Collapsed read-only row shown during edit for context */}
      <tr className="border-b border-white/[0.03]">
        <td className="py-2 pr-4 font-dm-sans text-sm text-white/40">{item.name}</td>
        <td className="py-2 pr-4 font-dm-sans text-sm text-white/30 tabular-nums">
          ${item.price}
        </td>
        <td className="py-2 pr-4 font-dm-sans text-xs text-white/30">{item.billing}</td>
        <td className="py-2 pr-4" />
        <td className="py-2" />
      </tr>
      <tr className="border-b border-white/[0.07]">
        <td colSpan={5} className="pb-5 pt-2">
          <div className="grid grid-cols-1 gap-3 max-w-lg">
            {/* Name is intentionally read-only — changing it requires updates across
                content pages, dashboard labels, and email templates. */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-white/40 uppercase tracking-wide">Name</span>
              <p className="text-sm text-white/50 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
                {item.name}
              </p>
            </div>

            {/* Description */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-white/40 uppercase tracking-wide">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white/30"
              />
            </label>

            {/* Price + Billing row — billing is read-only */}
            <div className="flex gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-[11px] text-white/40 uppercase tracking-wide">
                  Price ($)
                </span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </label>
              {/* Billing type is intentionally read-only — changing it requires cascading
                  updates to memberships, addons, and Stripe configuration. */}
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[11px] text-white/40 uppercase tracking-wide">
                  Billing
                </span>
                <p className="text-sm text-white/50 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 capitalize">
                  {item.billing}
                </p>
              </div>
            </div>

            {/* Features */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-white/40 uppercase tracking-wide">
                Features (one per line)
              </span>
              <textarea
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                rows={4}
                placeholder="Core content library&#10;PDF resources&#10;..."
                className="bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white/30 placeholder:text-white/20"
              />
            </label>

            {/* Public toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="accent-white"
              />
              <span className="text-sm text-white/60">Show on public pricing page</span>
            </label>

            {/* Stripe fields — read-only; populated in Feature 12 */}
            {/* TODO: populate stripe_product_id and stripe_price_id when Stripe
                integration is complete (Feature 12) */}
            <div className="flex gap-3 opacity-40">
              <div className="flex-1">
                <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">
                  Stripe Product ID
                </p>
                <p className="text-xs text-white/50 font-mono bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
                  {item.stripe_product_id ?? "—"}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">
                  Stripe Price ID
                </p>
                <p className="text-xs text-white/50 font-mono bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
                  {item.stripe_price_id ?? "—"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="text-sm bg-white text-[#05080F] px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {message && !message.ok && (
                <span className="text-xs text-red-400">{message.text}</span>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export function PricingSection({ items }: Props) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5">
      <h2 className="text-[13px] font-medium text-white mb-1">Pricing</h2>
      <p className="text-[13px] text-white/50 mb-5">
        Manage product descriptions, prices, and feature lists. Changes are
        reflected immediately on the public pricing page and the dashboard.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="text-left text-[11px] uppercase tracking-wide text-white/30 pb-2 pr-4 font-normal">
                Name
              </th>
              <th className="text-left text-[11px] uppercase tracking-wide text-white/30 pb-2 pr-4 font-normal">
                Price
              </th>
              <th className="text-left text-[11px] uppercase tracking-wide text-white/30 pb-2 pr-4 font-normal">
                Billing
              </th>
              <th className="text-left text-[11px] uppercase tracking-wide text-white/30 pb-2 pr-4 font-normal">
                Public
              </th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <PricingRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
