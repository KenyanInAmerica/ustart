"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { updatePricing } from "@/lib/actions/admin/updatePricing";
import type { PricingItem } from "@/lib/config/pricing";

interface Props {
  items: PricingItem[];
}

interface EditState {
  description: string;
  price: string;
  features: string;
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

function PricingRow({ item }: { item: PricingItem }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>(toEditState(item));
  const [originalForm, setOriginalForm] = useState<EditState>(toEditState(item));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isDirty =
    form.description !== originalForm.description ||
    form.price !== originalForm.price ||
    form.features !== originalForm.features ||
    form.is_public !== originalForm.is_public;

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
      name: item.name,
      billing: item.billing,
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
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

  if (!editing) {
    return (
      <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]">
        <td className="py-3 pr-4 text-sm text-[var(--text)]">{item.name}</td>
        <td className="py-3 pr-4 text-sm tabular-nums text-[var(--text-mid)]">${item.price}</td>
        <td className="py-3 pr-4 text-xs capitalize text-[var(--text-muted)]">{item.billing}</td>
        <td className="py-3 pr-4">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              item.is_public
                ? "bg-[#4ECBA5]/10 text-[#4ECBA5]"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
            }`}
          >
            {item.is_public ? "Yes" : "No"}
          </span>
        </td>
        <td className="py-3 text-right">
          {message && (
            <span className={`mr-3 text-xs ${message.ok ? "text-emerald-600" : "text-[var(--destructive)]"}`}>
              {message.text}
            </span>
          )}
          <Button onClick={startEdit} variant="secondary" size="sm">
            Edit
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="border-b border-[var(--border)]">
        <td className="py-2 pr-4 text-sm text-[var(--text-muted)]">{item.name}</td>
        <td className="py-2 pr-4 text-sm tabular-nums text-[var(--text-muted)]">${item.price}</td>
        <td className="py-2 pr-4 text-xs text-[var(--text-muted)]">{item.billing}</td>
        <td className="py-2 pr-4" />
        <td className="py-2" />
      </tr>
      <tr className="border-b border-[var(--border)]">
        <td colSpan={5} className="pb-5 pt-2">
          <div className="grid max-w-lg grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Name</span>
              <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-mid)]">
                {item.name}
              </p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              />
            </label>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Price ($)</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Billing</span>
                <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm capitalize text-[var(--text-mid)]">
                  {item.billing}
                </p>
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Features (one per line)</span>
              <textarea
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                rows={4}
                placeholder="Core content library&#10;PDF resources&#10;..."
                className="resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 select-none text-sm text-[var(--text-mid)]">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="accent-[var(--accent)]"
              />
              Show on public pricing page
            </label>

            <div className="flex gap-3 opacity-70">
              <div className="flex-1">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Stripe Product ID</p>
                <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
                  {item.stripe_product_id ?? "—"}
                </p>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Stripe Price ID</p>
                <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
                  {item.stripe_price_id ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSave} disabled={saving || !isDirty} size="sm">
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={cancelEdit} disabled={saving} variant="ghost" size="sm">
                Cancel
              </Button>
              {message && !message.ok && (
                <span className="text-xs text-[var(--destructive)]">{message.text}</span>
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
      <h2 className="mb-1 text-[13px] font-medium text-[var(--text)]">Pricing</h2>
      <p className="mb-5 text-[13px] text-[var(--text-muted)]">
        Manage product descriptions, prices, and feature lists. Changes are reflected immediately on the public pricing page and the dashboard.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Name</th>
              <th className="pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Price</th>
              <th className="pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Billing</th>
              <th className="pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Public</th>
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
