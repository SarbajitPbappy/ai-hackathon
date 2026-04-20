import { notFound } from "next/navigation";
import ContestAssistantChat from "@/components/contest/ContestAssistantChat";
import ProblemWorkspace from "@/components/contest/ProblemWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ContestProblemPage({
  params,
}: {
  params: { slug: string; pid: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: contest } = await supabase
    .from("contests")
    .select("id,title")
    .eq("slug", params.slug)
    .single();

  if (!contest) {
    notFound();
  }

  const { data: problem } = await supabase
    .from("problems")
    .select(
      "id,contest_id,title,statement,input_format,output_format,constraints,test_cases(id,input,expected_output,is_sample)",
    )
    .eq("contest_id", contest.id)
    .eq("id", params.pid)
    .single();

  if (!problem) {
    notFound();
  }

  const { data: allProblemTitles } = await supabase
    .from("problems")
    .select("title")
    .eq("contest_id", contest.id)
    .order("order_index", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = user
    ? await supabase
        .from("submissions")
        .select("*")
        .eq("contest_id", contest.id)
        .eq("problem_id", problem.id)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  return (
    <>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{problem.title}</h1>
          <p className="text-sm text-muted-foreground">Contest: {contest.title}</p>
        </div>
        <ProblemWorkspace
          problem={{
            ...problem,
            test_cases: (problem.test_cases ?? []).filter((testCase) => testCase.is_sample),
          }}
          initialSubmissions={submissions ?? []}
        />
      </section>
      <ContestAssistantChat
        context={{
          rules: [
            "Do not ask for direct solutions.",
            "Clarifications are allowed for rules and logistics.",
            "Respect contest integrity and submission fairness.",
          ],
          problem_titles: (allProblemTitles ?? []).map((item) => item.title),
          faqs: [
            "How is ACM/IOI scoring computed?",
            "When does the scoreboard freeze?",
            "Where can I find my submissions?",
          ],
        }}
      />
    </>
  );
}
