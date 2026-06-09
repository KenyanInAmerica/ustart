"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitDocument } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10_485_760;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type Props = {
  taskId?: string;
  templateId?: string;
  sectionLabel?: string;
  onSuccess?: () => void;
};

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) return "You can upload a maximum of 5 files.";

  const invalidSize = files.find((file) => file.size > MAX_FILE_SIZE);
  if (invalidSize) return `${invalidSize.name} is larger than 10MB.`;

  const invalidType = files.find((file) => !ALLOWED_FILE_TYPES.has(file.type));
  if (invalidType) return `${invalidType.name} is not an accepted file type.`;

  return null;
}

export function DocumentUpload({
  taskId,
  templateId,
  sectionLabel,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => {
      setSuccess(false);
      onSuccess?.();
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [onSuccess, success]);

  function addFiles(nextFiles: File[]) {
    const combined = [...files, ...nextFiles];
    const validationError = validateFiles(combined);
    setError(validationError);
    if (!validationError) setFiles(combined);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function handleSubmit() {
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("taskId", taskId ?? "");
    formData.append("templateId", templateId ?? "");
    formData.append("sectionLabel", sectionLabel ?? "");

    startTransition(async () => {
      const result = await submitDocument(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setFiles([]);
      setError(null);
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[#4ECBA5]/20 bg-[#4ECBA5]/10 p-6 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#4ECBA5] text-white">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">
          Documents submitted successfully
        </p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div>
        <div
          className={[
            "cursor-pointer rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center transition-colors",
            isDragging
              ? "border-[var(--accent)] bg-[var(--bg-subtle)]"
              : "border-[var(--border)] hover:border-[var(--accent)]",
          ].join(" ")}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <svg className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M20 16.5A4.5 4.5 0 0 1 15.5 21h-8a5.5 5.5 0 0 1-.9-10.93A6 6 0 0 1 18 9.5" />
          </svg>
          <p className="mb-1 text-sm font-medium text-[var(--text)]">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            PDF, Word, JPG, PNG, WEBP up to 10MB each. Maximum 5 files.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {error && <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text)]">
          {files.length} file{files.length === 1 ? "" : "s"} selected
        </p>
        <button
          type="button"
          onClick={() => {
            setFiles([]);
            setError(null);
          }}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Cancel
        </button>
      </div>

      <ul className="mb-4 space-y-2">
        {files.map((file) => (
          <li
            key={`${file.name}-${file.size}-${file.lastModified}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--text)]">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {isPending ? "Uploading..." : formatFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setFiles((current) => current.filter((item) => item !== file))}
              className="shrink-0 text-lg leading-none text-[var(--text-muted)] hover:text-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${file.name}`}
            >
              x
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="mb-3 text-sm text-[var(--destructive)]">{error}</p>}

      <div className="flex justify-end gap-2">
        {error && (
          <Button type="button" variant="ghost" onClick={() => setError(null)}>
            Try again
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          loading={isPending}
          disabled={isPending || files.length === 0}
        >
          Upload {files.length} file{files.length === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
