// Client component for the delete button in the content table row.
// Requires a confirm dialog before calling deleteContentItem.

"use client";

import { useTransition } from "react";
import { deleteContentItem } from "@/lib/actions/admin/content";

interface ContentDeleteButtonProps {
  contentItemId: string;
}

export function ContentDeleteButton({ contentItemId }: ContentDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this content item? This will also remove the file from Storage.")) return;

    startTransition(async () => {
      await deleteContentItem(contentItemId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[13px] text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
