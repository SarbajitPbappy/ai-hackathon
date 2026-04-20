import { notFound } from "next/navigation";
import LiveLeaderboard from "@/components/leaderboard/LiveLeaderboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ContestLeaderboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,freeze_scoreboard_at")
    .eq("slug", params.slug)
    .single();

  if (!contest) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{contest.title} Leaderboard</h1>
      <LiveLeaderboard
        contestId={contest.id}
        currentUserId={user?.id}
        freezeAt={contest.freeze_scoreboard_at}
      />
    </section>
  );
}
