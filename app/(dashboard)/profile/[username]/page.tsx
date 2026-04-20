import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SubmissionHeatmap from "@/components/profile/SubmissionHeatmap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const serverClient = createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const {
    data: { user: currentUser },
  } = await serverClient.auth.getUser();

  let username = params.username;
  if (username === "me" && currentUser) {
    const { data: me } = await adminClient
      .from("users")
      .select("username")
      .eq("id", currentUser.id)
      .single();
    username = me?.username ?? params.username;
  }

  const { data: profile } = await adminClient
    .from("users")
    .select("id,username,display_name,avatar_url,bio,rating,country,github_url")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const [{ data: registrations }, { data: contests }, { data: leaderboard }, { data: submissionDates }] =
    await Promise.all([
      adminClient
        .from("contest_registrations")
        .select("contest_id,registered_at")
        .eq("user_id", profile.id)
        .order("registered_at", { ascending: false }),
      adminClient
        .from("contests")
        .select("id,title,slug,status,end_time")
        .order("end_time", { ascending: false }),
      adminClient
        .from("leaderboard_cache")
        .select("contest_id,total_score,rank")
        .eq("user_id", profile.id),
      adminClient
        .from("submissions")
        .select("submitted_at")
        .eq("user_id", profile.id),
    ]);

  const contestMap = new Map((contests ?? []).map((contest) => [contest.id, contest]));
  const leaderboardMap = new Map((leaderboard ?? []).map((row) => [row.contest_id, row]));

  const contestHistory = (registrations ?? [])
    .map((registration) => {
      const contest = contestMap.get(registration.contest_id);
      const standing = leaderboardMap.get(registration.contest_id);
      if (!contest) {
        return null;
      }
      return {
        contest,
        standing,
        registered_at: registration.registered_at,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const submissionsByDate = new Map<string, number>();
  for (const submission of submissionDates ?? []) {
    const key = submission.submitted_at.slice(0, 10);
    submissionsByDate.set(key, (submissionsByDate.get(key) ?? 0) + 1);
  }

  const heatmapData = Array.from(submissionsByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <section className="space-y-5">
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="size-20 border border-border">
              <AvatarImage src={profile.avatar_url ?? ""} alt={profile.username} />
              <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{profile.display_name ?? profile.username}</CardTitle>
                <Badge>@{profile.username}</Badge>
                <Badge variant="secondary">Rating {profile.rating}</Badge>
              </div>
              {profile.bio ? <p className="max-w-3xl text-sm text-muted-foreground">{profile.bio}</p> : null}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Country: {profile.country ?? "N/A"}</span>
                <span>GitHub: {profile.github_url ?? "N/A"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Submission Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Contest History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contestHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No contests joined yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  contestHistory.map((entry) => (
                    <TableRow key={entry.contest.id}>
                      <TableCell>{entry.contest.title}</TableCell>
                      <TableCell className="capitalize">{entry.contest.status}</TableCell>
                      <TableCell>{entry.standing?.total_score ?? "-"}</TableCell>
                      <TableCell>{entry.standing?.rank ?? "-"}</TableCell>
                      <TableCell>{format(new Date(entry.registered_at), "PP")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
