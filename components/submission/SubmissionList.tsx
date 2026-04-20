import { formatDistanceToNowStrict } from "date-fns";
import VerdictBadge from "@/components/contest/VerdictBadge";
import type { Submission } from "@/types";

export default function SubmissionList({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) {
    return <p className="text-sm text-muted-foreground">No submissions yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
        >
          <div>
            <p className="text-sm font-medium">{submission.language}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNowStrict(new Date(submission.submitted_at), { addSuffix: true })}
            </p>
          </div>
          <VerdictBadge verdict={submission.verdict} />
        </li>
      ))}
    </ul>
  );
}
