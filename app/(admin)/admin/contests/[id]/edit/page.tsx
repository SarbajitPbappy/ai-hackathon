import { notFound } from "next/navigation";
import ContestAdminForm from "@/components/contest/ContestAdminForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EditContestPageProps = {
  params: {
    id: string;
  };
};

export default async function EditContestPage({ params }: EditContestPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: contest } = await supabase.from("contests").select("*").eq("id", params.id).single();

  if (!contest) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Contest</h1>
      <ContestAdminForm mode="edit" contestId={params.id} initialValues={contest} />
    </section>
  );
}
