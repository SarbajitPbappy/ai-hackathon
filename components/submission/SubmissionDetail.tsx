"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";
import VerdictBadge from "@/components/contest/VerdictBadge";
import { Button } from "@/components/ui/button";
import type { Submission } from "@/types";

export default function SubmissionDetail({
  submission,
  problemStatement,
  contestEnded = false,
}: {
  submission: Submission;
  problemStatement?: string;
  contestEnded?: boolean;
}) {
  const [reviewMarkdown, setReviewMarkdown] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const onReview = () => {
    if (!problemStatement) {
      toast.error("Problem statement is unavailable for review.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/ai/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem_statement: problemStatement,
          code: submission.code,
          verdict: submission.verdict,
          language: submission.language,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; markdown?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to generate review");
        return;
      }

      setReviewMarkdown(payload?.markdown ?? "");
    });
  };

  return (
    <article className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Submission Detail</h3>
        <VerdictBadge verdict={submission.verdict} />
      </header>
      <dl className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Language</dt>
          <dd>{submission.language}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Execution Time</dt>
          <dd>{submission.time_ms ?? "-"} ms</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Memory</dt>
          <dd>{submission.memory_kb ?? "-"} KB</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Score</dt>
          <dd>{submission.score ?? "-"}</dd>
        </div>
      </dl>
      {contestEnded ? (
        <Button onClick={onReview} disabled={pending}>
          {pending ? "Reviewing..." : "AI Code Review"}
        </Button>
      ) : null}
      {reviewMarkdown ? (
        <div className="prose prose-invert max-w-none rounded-md border border-border bg-background p-3 text-sm">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{reviewMarkdown}</ReactMarkdown>
        </div>
      ) : null}
      <pre className="overflow-x-auto rounded bg-background p-3 font-mono text-xs">{submission.code}</pre>
    </article>
  );
}
