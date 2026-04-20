import { notFound } from "next/navigation";
import HackathonSubmissionForm from "@/components/contest/HackathonSubmissionForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HackathonSubmitPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,type")
    .eq("slug", params.slug)
    .single();

  if (!contest || contest.type !== "hackathon") {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Submit Hackathon Project</h1>
      <p className="text-sm text-muted-foreground">Contest: {contest.title}</p>
      <HackathonSubmissionForm contestId={contest.id} />
    </section>
  );
}
