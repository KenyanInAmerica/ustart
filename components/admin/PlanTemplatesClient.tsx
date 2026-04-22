"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/Button";
import {
  accentSurfaceClass,
  type ProductAccent,
} from "@/lib/config/productAccents";
import {
  deletePlanTemplate,
  savePlanTemplateOrder,
} from "@/lib/actions/admin/planTemplates";
import {
  PLAN_PHASES,
  PLAN_PHASE_BORDER_CLASSES,
  PLAN_PHASE_LABELS,
  PLAN_PHASE_TEXT_CLASSES,
  type PlanPhase,
  type PlanTaskTemplate,
} from "@/lib/types/plan";
import { PlanTemplateModal } from "@/components/admin/PlanTemplateModal";

interface PlanTemplatesClientProps {
  templates: PlanTaskTemplate[];
}

interface SortablePhaseSectionProps {
  confirmingDeleteId: string | null;
  deleteError: string | null;
  isDeleting: boolean;
  isReordering: boolean;
  onConfirmDelete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (template: PlanTaskTemplate) => void;
  onPhaseDragEnd: (event: DragEndEvent, phase: PlanPhase) => void;
  onResetDelete: () => void;
  phase: PlanPhase;
  templates: PlanTaskTemplate[];
}

function tierAccent(tier: PlanTaskTemplate["tier_required"]): ProductAccent {
  switch (tier) {
    case "explore":
      return "explore";
    case "concierge":
      return "concierge";
    default:
      return "lite";
  }
}

export function formatDaysFromArrival(days: number): string {
  if (days === 0) return "Day of arrival";
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} after arrival`;
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} before arrival`;
}

function groupTemplatesByPhase(
  templates: PlanTaskTemplate[]
): Record<PlanPhase, PlanTaskTemplate[]> {
  return PLAN_PHASES.reduce(
    (groups, phase) => ({
      ...groups,
      [phase]: templates.filter((template) => template.phase === phase),
    }),
    {
      before_arrival: [],
      first_7_days: [],
      settling_in: [],
      ongoing_support: [],
    } satisfies Record<PlanPhase, PlanTaskTemplate[]>
  );
}

function GripHandleIcon() {
  return (
    <svg
      className="h-5 w-5 text-[var(--text-muted)]"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="6" cy="4.5" r="1.2" />
      <circle cx="14" cy="4.5" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
      <circle cx="14" cy="10" r="1.2" />
      <circle cx="6" cy="15.5" r="1.2" />
      <circle cx="14" cy="15.5" r="1.2" />
    </svg>
  );
}

function SortableTemplateCard({
  confirmingDeleteId,
  deleteError,
  isDeleting,
  isReordering,
  onConfirmDelete,
  onDelete,
  onEdit,
  onResetDelete,
  template,
}: {
  confirmingDeleteId: string | null;
  deleteError: string | null;
  isDeleting: boolean;
  isReordering: boolean;
  onConfirmDelete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (template: PlanTaskTemplate) => void;
  onResetDelete: () => void;
  template: PlanTaskTemplate;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: template.id,
    disabled: !isReordering,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          {isReordering && (
            <div
              {...listeners}
              className="touch-none cursor-grab px-2 pt-1 text-[var(--text-muted)] active:cursor-grabbing"
              aria-label={`Drag ${template.title}`}
              role="button"
              tabIndex={0}
            >
              <GripHandleIcon />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[var(--text)]">
              {template.title}
            </h3>
            {template.description && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {template.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--text-mid)]">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${accentSurfaceClass(
                  tierAccent(template.tier_required)
                )}`}
              >
                {template.tier_required}
              </span>
              <span>{formatDaysFromArrival(template.days_from_arrival)}</span>
            </div>

            {template.content_url && (
              <div className="mt-3 max-w-xl">
                <Link
                  href={template.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                >
                  {template.content_url}
                </Link>
              </div>
            )}

            {deleteError && confirmingDeleteId === template.id && (
              <p className="mt-3 text-sm text-[var(--destructive)]">
                {deleteError}
              </p>
            )}
          </div>
        </div>

        {!isReordering && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {confirmingDeleteId === template.id ? (
              <>
                <span className="self-center text-sm text-[var(--text-mid)]">
                  Are you sure?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onConfirmDelete(template.id)}
                  disabled={isDeleting}
                >
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={onResetDelete}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(template)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(template.id)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SortablePhaseSection({
  confirmingDeleteId,
  deleteError,
  isDeleting,
  isReordering,
  onConfirmDelete,
  onDelete,
  onEdit,
  onPhaseDragEnd,
  onResetDelete,
  phase,
  templates,
}: SortablePhaseSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <section>
      <div className={`mb-4 border-l-4 pl-3 ${PLAN_PHASE_BORDER_CLASSES[phase]}`}>
        <h2 className={`text-lg font-semibold ${PLAN_PHASE_TEXT_CLASSES[phase]}`}>
          {PLAN_PHASE_LABELS[phase]}
        </h2>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => onPhaseDragEnd(event, phase)}
        sensors={sensors}
      >
        <SortableContext
          items={templates.map((template) => template.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {templates.map((template) => (
              <SortableTemplateCard
                key={template.id}
                confirmingDeleteId={confirmingDeleteId}
                deleteError={deleteError}
                isDeleting={isDeleting}
                isReordering={isReordering}
                onConfirmDelete={onConfirmDelete}
                onDelete={onDelete}
                onEdit={onEdit}
                onResetDelete={onResetDelete}
                template={template}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export function PlanTemplatesClient({ templates }: PlanTemplatesClientProps) {
  const [savedTemplates, setSavedTemplates] = useState(templates);
  const [orderedTemplates, setOrderedTemplates] = useState(templates);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<
    PlanTaskTemplate | undefined
  >();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    setSavedTemplates(templates);
    setOrderedTemplates(templates);
  }, [templates]);

  useEffect(() => {
    if (!saveSuccess) return undefined;
    const timer = setTimeout(() => setSaveSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const groupedTemplates = useMemo(
    () => groupTemplatesByPhase(orderedTemplates),
    [orderedTemplates]
  );

  function openCreateModal() {
    setSelectedTemplate(undefined);
    setDeleteError(null);
    setSaveError(null);
    setModalMode("create");
  }

  function openEditModal(template: PlanTaskTemplate) {
    setSelectedTemplate(template);
    setDeleteError(null);
    setSaveError(null);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedTemplate(undefined);
  }

  function handleDelete(id: string) {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deletePlanTemplate(id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }

      setConfirmingDeleteId(null);
    });
  }

  function handleDragEnd(event: DragEndEvent, phase: PlanPhase) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedTemplates((current) => {
      const phaseItems = current.filter((template) => template.phase === phase);
      const otherItems = current.filter((template) => template.phase !== phase);
      const oldIndex = phaseItems.findIndex((template) => template.id === active.id);
      const newIndex = phaseItems.findIndex((template) => template.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return current;

      const reordered = arrayMove(phaseItems, oldIndex, newIndex).map(
        (template, index) => ({
          ...template,
          display_order: index,
        })
      );

      return [...otherItems, ...reordered];
    });
  }

  function enterReordering() {
    setSaveError(null);
    setSaveSuccess(null);
    setConfirmingDeleteId(null);
    setDeleteError(null);
    setOrderedTemplates(savedTemplates);
    setIsReordering(true);
  }

  function cancelReordering() {
    setSaveError(null);
    setSaveSuccess(null);
    setOrderedTemplates(savedTemplates);
    setIsReordering(false);
  }

  function handleSaveOrder() {
    setSaveError(null);
    setSaveSuccess(null);

    startSaveTransition(async () => {
      const updates = PLAN_PHASES.flatMap((phase) =>
        groupedTemplates[phase].map((template, index) => ({
          id: template.id,
          display_order: index,
        }))
      );

      const result = await savePlanTemplateOrder(updates);
      if (!result.success) {
        setSaveError(result.error);
        return;
      }

      setSavedTemplates(orderedTemplates);
      setIsReordering(false);
      setSaveSuccess("Template order saved.");
    });
  }

  return (
    <>
      <div className="max-w-5xl px-8 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
              Plan Templates
            </h1>
            <p className="text-[13px] text-[var(--text-muted)]">
              Manage task templates used to build student plans.
            </p>
            {saveSuccess && (
              <p className="mt-2 text-sm text-[var(--accent)]">{saveSuccess}</p>
            )}
            {saveError && (
              <p className="mt-2 text-sm text-[var(--destructive)]">{saveError}</p>
            )}
          </div>
          {isReordering ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveOrder} loading={isSaving}>
                Save order
              </Button>
              <Button variant="ghost" onClick={cancelReordering}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreateModal}>Add template</Button>
              <Button variant="secondary" onClick={enterReordering}>
                Reorder
              </Button>
            </div>
          )}
        </div>

        {orderedTemplates.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-8">
            <p className="text-sm text-[var(--text-muted)]">
              No templates yet. Add your first template to start building student plans.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {PLAN_PHASES.map((phase) => {
              const phaseTemplates = groupedTemplates[phase];
              if (phaseTemplates.length === 0) return null;

              return (
                <SortablePhaseSection
                  key={phase}
                  confirmingDeleteId={confirmingDeleteId}
                  deleteError={deleteError}
                  isDeleting={isDeleting}
                  isReordering={isReordering}
                  onConfirmDelete={handleDelete}
                  onDelete={(id) => {
                    setDeleteError(null);
                    setConfirmingDeleteId(id);
                  }}
                  onEdit={openEditModal}
                  onPhaseDragEnd={handleDragEnd}
                  onResetDelete={() => {
                    setConfirmingDeleteId(null);
                    setDeleteError(null);
                  }}
                  phase={phase}
                  templates={phaseTemplates}
                />
              );
            })}
          </div>
        )}
      </div>

      {modalMode && (
        <PlanTemplateModal
          mode={modalMode}
          template={selectedTemplate}
          onClose={closeModal}
        />
      )}
    </>
  );
}
