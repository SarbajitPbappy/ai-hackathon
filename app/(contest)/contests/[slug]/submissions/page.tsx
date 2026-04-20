import SubmissionList from "@/components/submission/SubmissionList";
import SubmissionDetail from "@/components/submission/SubmissionDetail";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ContestSubmissionsPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,status")
    .eq("slug", params.slug)
    .single();

  if (!contest) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = user
    ? await supabase
        .from("submissions")
        .select("*")
        .eq("contest_id", contest.id)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  const latestSubmission = submissions?.[0];
  const { data: latestProblem } = latestSubmission
    ? await supabase
        .from("problems")
        .select("statement")
        .eq("id", latestSubmission.problem_id)
        .single()
    : { data: null };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">My Submissions</h1>
      <SubmissionList submissions={submissions ?? []} />
      {latestSubmission ? (
        <SubmissionDetail
          submission={latestSubmission}
          problemStatement={latestProblem?.statement}
          contestEnded={contest.status === "ended"}
        />
      ) : null}
    </section>
  );
}
