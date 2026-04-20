import Link from "next/link";
import { notFound } from "next/navigation";
import ContestAssistantChat from "@/components/contest/ContestAssistantChat";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const solvedStateLabel = {
  solved: "Solved",
  attempted: "Attempted",
  unsolved: "Unsolved",
} as const;

export default async function ContestProblemsListPage({
  params,
}: {
  params: { slug: string };
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

  const { data: problems } = await supabase
    .from("problems")
    .select("id,title,slug,difficulty,points,order_index")
    .eq("contest_id", contest.id)
    .order("order_index", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = user
    ? await supabase
        .from("submissions")
        .select("problem_id,verdict")
        .eq("contest_id", contest.id)
        .eq("user_id", user.id)
    : { data: [] };

  const statusByProblemId = new Map<string, "solved" | "attempted" | "unsolved">();
  for (const problem of problems ?? []) {
    statusByProblemId.set(problem.id, "unsolved");
  }

  for (const submission of submissions ?? []) {
    if (submission.verdict === "accepted") {
      statusByProblemId.set(submission.problem_id, "solved");
      continue;
    }

    if (statusByProblemId.get(submission.problem_id) !== "solved") {
      statusByProblemId.set(submission.problem_id, "attempted");
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{contest.title} Problems</h1>
          <p className="text-sm text-muted-foreground">Solved, attempted, and unsolved tracking.</p>
        </div>

        <div className="space-y-2">
          {(problems ?? []).map((problem) => {
            const state = statusByProblemId.get(problem.id) ?? "unsolved";
            const icon = state === "solved" ? "OK" : state === "attempted" ? "TRY" : "NEW";

            return (
              <Link
                key={problem.id}
                href={`/contests/${params.slug}/problems/${problem.id}`}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-4 transition hover:border-accent"
              >
                <div>
                  <p className="font-medium">{problem.title}</p>
                  <p className="text-xs text-muted-foreground">{problem.points} points</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {problem.difficulty}
                  </Badge>
                  <Badge
                    className={
                      state === "solved"
                        ? "bg-success/20 text-success"
                        : state === "attempted"
                          ? "bg-warning/20 text-warning"
                          : "bg-secondary"
                    }
                  >
                    {icon} {solvedStateLabel[state]}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>

        {problems?.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Problem set has not been published yet.
          </p>
        ) : null}
      </section>
      <ContestAssistantChat
        context={{
          rules: [
            "Only rules and scoring questions are answered.",
            "No direct hints or full solutions are provided.",
            "Use submission history for feedback loops.",
          ],
          problem_titles: (problems ?? []).map((problem) => problem.title),
          faqs: [
            "Where can I see the leaderboard?",
            "How many attempts can I submit?",
            "What do solved and attempted indicators mean?",
          ],
        }}
      />
    </>
  );
}
