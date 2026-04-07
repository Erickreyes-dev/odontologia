import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { getPlanById } from "../actions";
import { PlanDetailView } from "../components/PlanDetailView";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({
 params }: PlanDetailPageProps) {
  void dynamic;
  await requireActiveSubscription();
  const { id } = await params;
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_planes_tratamiento")) {
    return <NoAcceso />;
  }

  const plan = await getPlanById(id);

  if (!plan) {
    redirect("/planes-tratamiento");
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ClipboardList}
        description="Detalle del plan de tratamiento y seguimientos."
        screenName="Detalle del Plan"
      />
      <PlanDetailView plan={plan} />
    </div>
  );
}
