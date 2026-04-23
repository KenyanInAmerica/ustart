import { redirect } from "next/navigation";

export default function ParentHomePage() {
  redirect("/dashboard/parent/plan");
}
