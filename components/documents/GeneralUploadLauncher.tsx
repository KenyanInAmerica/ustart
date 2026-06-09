"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GeneralUploadModal } from "@/components/documents/GeneralUploadModal";

type Props = {
  initialOpen?: boolean;
  taskId?: string;
  sectionLabel?: string;
};

export function GeneralUploadLauncher({
  initialOpen = false,
  taskId,
  sectionLabel = "General",
}: Props) {
  const [isOpen, setIsOpen] = useState(() => initialOpen);

  useEffect(() => {
    if (initialOpen) setIsOpen(true);
  }, [initialOpen, taskId, sectionLabel]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        Upload a document
      </Button>
      <GeneralUploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        taskId={taskId}
        sectionLabel={sectionLabel}
      />
    </>
  );
}
