// Client component for the delete button in the content table row.
// Inline two-step confirmation — avoids the browser confirm() dialog and
// aligns with the rest of the admin panel's destructive action pattern.

"use client";

import { useState, useTransition } from "react";
import { deleteContentItem } from "@/lib/actions/admin/content";

interface ContentDeleteButtonProps {
  contentItemId: string;
}

export function ContentDeleteButton({ contentItemId }: ContentDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteContentItem(contentItemId);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[12px] text-white/50">Delete item?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[12px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-[12px] text-white/30 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[13px] text-white/30 hover:text-red-400 transition-colors"
    >
      Delete
    </button>
  );
}
