import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const { data: submissions } = await supabase
    .from("hackathon_submissions")
    .select("id,title,teams(name),scores(innovation,technical,presentation,impact)")
    .order("submitted_at", { ascending: false });

  const rows = (submissions ?? []).map((submission) => {
    const scoreRows = submission.scores ?? [];
    const teamRelation = Array.isArray(submission.teams) ? submission.teams[0] : submission.teams;
    const count = scoreRows.length || 1;
    const total = scoreRows.reduce((acc, score) => {
      return acc + score.innovation + score.technical + score.presentation + score.impact;
    }, 0);
    return {
      id: submission.id,
      title: submission.title,
      team_name: teamRelation?.name ?? "Unknown",
      judges: scoreRows.length,
      avg_score: Math.round((total / count) * 100) / 100,
    };
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Judge Count</TableHead>
              <TableHead>Avg Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No scored submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.team_name}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.judges}</TableCell>
                  <TableCell>{row.avg_score}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
