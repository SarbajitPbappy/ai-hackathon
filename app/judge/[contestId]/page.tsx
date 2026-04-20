import { notFound } from "next/navigation";
import JudgeScoringBoard from "@/components/judge/JudgeScoringBoard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function JudgeContestPage({
  params,
}: {
  params: { contestId: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,type")
    .eq("id", params.contestId)
    .single();

  if (!contest || contest.type !== "hackathon") {
    notFound();
  }

  const { data: submissions } = await supabase
    .from("hackathon_submissions")
    .select("id,title,description,github_url,demo_url,video_url,teams(name)")
    .eq("contest_id", contest.id)
    .order("submitted_at", { ascending: false });

  const cards = (submissions ?? []).map((submission) => {
    const teamRelation = Array.isArray(submission.teams) ? submission.teams[0] : submission.teams;
    return {
      id: submission.id,
      title: submission.title,
      description: submission.description,
      github_url: submission.github_url,
      demo_url: submission.demo_url,
      video_url: submission.video_url,
      team_name: teamRelation?.name ?? "Unknown",
    };
  });

  return (
    <section className="space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Judge Panel: {contest.title}</h1>
      <JudgeScoringBoard contestId={contest.id} submissions={cards} />
    </section>
  );
}
