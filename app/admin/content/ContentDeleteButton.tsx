// Client component for the delete button in the content table row.
// Inline two-step confirmation — avoids the browser confirm() dialog and
// aligns with the rest of the admin panel's destructive action pattern.

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
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
        <span className="text-[12px] text-[var(--text-muted)]">Delete item?</span>
        <Button
          onClick={handleDelete}
          disabled={isPending}
          variant="destructive"
          size="sm"
        >
          {isPending ? "Deleting…" : "Yes"}
        </Button>
        <Button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <Button
      onClick={() => setConfirming(true)}
      variant="destructive"
      size="sm"
    >
      Delete
    </Button>
  );
}
