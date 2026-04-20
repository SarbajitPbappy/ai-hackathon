import { notFound } from "next/navigation";
import AdminProblemManager from "@/components/contest/AdminProblemManager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContestProblemsPageProps = {
  params: {
    id: string;
  };
};

export default async function ContestProblemsPage({ params }: ContestProblemsPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: contest } = await supabase
    .from("contests")
    .select("id,title")
    .eq("id", params.id)
    .single();

  if (!contest) {
    notFound();
  }

  const { data: problems } = await supabase
    .from("problems")
    .select("id,contest_id,title,slug,statement,input_format,output_format,constraints,difficulty,time_limit_ms,memory_limit_mb,points,order_index,test_cases(id,input,expected_output,is_sample,order_index)")
    .eq("contest_id", contest.id)
    .order("order_index", { ascending: true });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Problem Manager</h1>
        <p className="text-sm text-muted-foreground">Contest: {contest.title}</p>
      </div>
      <AdminProblemManager contestId={contest.id} initialProblems={problems ?? []} />
    </section>
  );
}
