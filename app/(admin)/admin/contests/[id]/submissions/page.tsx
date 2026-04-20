import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminHackathonSubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,type")
    .eq("id", params.id)
    .single();

  if (!contest || contest.type !== "hackathon") {
    notFound();
  }

  const { data: submissions } = await supabase
    .from("hackathon_submissions")
    .select("id,title,description,github_url,demo_url,video_url,tech_stack,teams(name)")
    .eq("contest_id", contest.id)
    .order("submitted_at", { ascending: false });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Hackathon Submissions</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(submissions ?? []).map((submission) => {
          const teamRelation = Array.isArray(submission.teams) ? submission.teams[0] : submission.teams;
          return (
            <article key={submission.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-2 text-xs text-muted-foreground">Team: {teamRelation?.name ?? "Unknown"}</p>
              <h2 className="text-lg font-semibold">{submission.title}</h2>
              <div className="prose prose-invert mt-3 max-w-none text-sm">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{submission.description}</ReactMarkdown>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(submission.tech_stack ?? []).map((tech: string) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p>GitHub: {submission.github_url}</p>
                <p>Demo: {submission.demo_url}</p>
                <p>Video: {submission.video_url ?? "N/A"}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
