import { PlanTemplatesClient } from "@/components/admin/PlanTemplatesClient";
import { fetchPlanTemplates } from "@/lib/admin/data";

export default async function AdminPlanTemplatesPage() {
  const templates = await fetchPlanTemplates();

  return <PlanTemplatesClient templates={templates} />;
}
