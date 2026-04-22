import type { TierId } from "@/lib/config/pricing";

export type PlanPhase =
  | "before_arrival"
  | "first_7_days"
  | "settling_in"
  | "ongoing_support";

export interface PlanTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  phase: PlanPhase;
  days_from_arrival: number;
  content_url: string | null;
  tier_required: TierId;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type PlanTaskStatus = "not_started" | "in_progress" | "completed";

export interface PlanTask {
  id: string;
  title: string;
  description: string | null;
  phase: PlanPhase;
  status: PlanTaskStatus;
  due_date: string | null;
  content_url: string | null;
  display_order: number;
  completed_at: string | null;
}

export interface PlanPhaseGroup {
  phase: PlanPhase;
  label: string;
  color: string;
  tasks: PlanTask[];
  completedCount: number;
  totalCount: number;
}

export interface CreatePlanTemplateData {
  title: string;
  description?: string;
  phase: PlanPhase;
  days_from_arrival: number;
  content_url?: string;
  tier_required: TierId;
}

export type UpdatePlanTemplateData = Partial<CreatePlanTemplateData> & {
  display_order?: number;
};

export const PLAN_PHASES: PlanPhase[] = [
  "before_arrival",
  "first_7_days",
  "settling_in",
  "ongoing_support",
];

export const PLAN_PHASE_LABELS: Record<PlanPhase, string> = {
  before_arrival: "Before Arrival",
  first_7_days: "First 7 Days",
  settling_in: "Settling In",
  ongoing_support: "Ongoing Support",
};

export const PLAN_PHASE_COLORS: Record<PlanPhase, string> = {
  before_arrival: "#4ECBA5",
  first_7_days: "#F5C842",
  settling_in: "#9B8EC4",
  ongoing_support: "#3083DC",
};

export const PLAN_PHASE_BORDER_CLASSES: Record<PlanPhase, string> = {
  before_arrival: "border-[#4ECBA5]",
  first_7_days: "border-[#F5C842]",
  settling_in: "border-[#9B8EC4]",
  ongoing_support: "border-[#3083DC]",
};

export const PLAN_PHASE_TEXT_CLASSES: Record<PlanPhase, string> = {
  before_arrival: "text-[#4ECBA5]",
  first_7_days: "text-yellow-700",
  settling_in: "text-[#9B8EC4]",
  ongoing_support: "text-[#3083DC]",
};

export const PLAN_PHASE_BG_CLASSES: Record<PlanPhase, string> = {
  before_arrival: "bg-[#4ECBA5]",
  first_7_days: "bg-[#F5C842]",
  settling_in: "bg-[#9B8EC4]",
  ongoing_support: "bg-[#3083DC]",
};

export const PLAN_PHASE_BORDER_COLOR_CLASSES: Record<PlanPhase, string> = {
  before_arrival: "border-[#4ECBA5]",
  first_7_days: "border-[#F5C842]",
  settling_in: "border-[#9B8EC4]",
  ongoing_support: "border-[#3083DC]",
};
