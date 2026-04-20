import Link from "next/link";
import { notFound } from "next/navigation";
import ContestRegistrationButton from "@/components/contest/ContestRegistrationButton";
import ContestAssistantChat from "@/components/contest/ContestAssistantChat";
import ContestTimer from "@/components/contest/ContestTimer";
import HackathonTeamPanel from "@/components/contest/HackathonTeamPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContestLandingPageProps = {
  params: {
    slug: string;
  };
};

export default async function ContestLandingPage({ params }: ContestLandingPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: contest } = await supabase
    .from("contests")
    .select(
      "id,title,description,type,status,start_time,end_time,visibility,organizer_id,users!contests_organizer_id_fkey(username,display_name,country)",
    )
    .eq("slug", params.slug)
    .single();

  if (!contest) {
    notFound();
  }
  const organizerRelation = Array.isArray(contest.users) ? contest.users[0] : contest.users;

  const { data: problemTitles } = await supabase
    .from("problems")
    .select("title")
    .eq("contest_id", contest.id)
    .order("order_index", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registered = false;
  if (user) {
    const { data: registration } = await supabase
      .from("contest_registrations")
      .select("id")
      .eq("contest_id", contest.id)
      .eq("user_id", user.id)
      .maybeSingle();
    registered = Boolean(registration);
  }

  return (
    <>
      <section className="space-y-5">
        <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="capitalize">{contest.status}</Badge>
          <Badge variant="outline" className="capitalize">
            {contest.type}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold">{contest.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{contest.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <ContestRegistrationButton contestId={contest.id} registered={registered} />
          <Button asChild variant="secondary">
            <Link href={`/contests/${params.slug}/problems`}>View Problems</Link>
          </Button>
          {contest.type === "hackathon" ? (
            <Button asChild variant="secondary">
              <Link href={`/contests/${params.slug}/submit`}>Project Submission</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/contests/${params.slug}/leaderboard`}>Leaderboard</Link>
          </Button>
        </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-lg font-semibold">Rules</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Use one account only. Teaming is allowed only in hackathon format.</li>
              <li>Submissions are judged against hidden and sample test cases.</li>
              <li>Clarification requests are handled through contest announcements.</li>
            </ul>
          </div>
          <div className="space-y-4">
            <ContestTimer startTime={contest.start_time} endTime={contest.end_time} />
            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-sm text-muted-foreground">Organizer</p>
              <p className="mt-1 text-sm">
                {organizerRelation?.display_name ?? organizerRelation?.username ?? "Unknown organizer"}
              </p>
            </div>
            {contest.type === "hackathon" && registered ? (
              <HackathonTeamPanel contestId={contest.id} contestSlug={params.slug} />
            ) : null}
          </div>
        </div>
      </section>
      <ContestAssistantChat
        context={{
          rules: [
            "One account per participant.",
            "No problem solution sharing during live rounds.",
            "All judge decisions are final.",
          ],
          problem_titles: (problemTitles ?? []).map((problem) => problem.title),
          faqs: [
            "How does scoring work?",
            "How can I register or join a team?",
            "What happens when scoreboard is frozen?",
          ],
        }}
      />
    </>
  );
}
