import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingChart from "@/components/dashboard/RatingChart";
import SubmissionList from "@/components/submission/SubmissionList";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
        </CardHeader>
        <CardContent>
          Please <Link href="/login" className="text-accent underline">sign in</Link> to view your dashboard.
        </CardContent>
      </Card>
    );
  }

  const [{ data: profile }, { count: contestsParticipated }, { data: acceptedSubmissions }, { data: recentSubmissions }, { data: leaderboardHistory }] = await Promise.all([
    supabase.from("users").select("id,username,rating").eq("id", user.id).single(),
    supabase
      .from("contest_registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("submissions")
      .select("problem_id")
      .eq("user_id", user.id)
      .eq("verdict", "accepted"),
    supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(8),
    supabase
      .from("leaderboard_cache")
      .select("contest_id,total_score,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: true })
      .limit(12),
  ]);

  const solvedProblems = new Set((acceptedSubmissions ?? []).map((row) => row.problem_id)).size;

  const ratingData = (leaderboardHistory ?? []).length
    ? (leaderboardHistory ?? []).map((row, index) => ({
        label: `R${index + 1}`,
        rating: (profile?.rating ?? 1200) + Math.round((row.total_score ?? 0) / 1000),
      }))
    : [{ label: "Now", rating: profile?.rating ?? 1200 }];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Current Rating</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{profile?.rating ?? 1200}</CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Contests Participated</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{contestsParticipated ?? 0}</CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Problems Solved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{solvedProblems}</CardContent>
        </Card>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Rating Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <RatingChart data={ratingData} />
        </CardContent>
      </Card>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionList submissions={recentSubmissions ?? []} />
        </CardContent>
      </Card>
    </section>
  );
}
