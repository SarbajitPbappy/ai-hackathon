import { Badge } from "@/components/ui/badge";
import type { SubmissionVerdict } from "@/types";

const verdictStyles: Record<SubmissionVerdict, string> = {
  pending: "bg-warning/20 text-warning",
  accepted: "bg-success/20 text-success",
  wrong_answer: "bg-destructive/20 text-destructive",
  tle: "bg-destructive/20 text-destructive",
  mle: "bg-destructive/20 text-destructive",
  runtime_error: "bg-destructive/20 text-destructive",
  compilation_error: "bg-destructive/20 text-destructive",
};

export default function VerdictBadge({ verdict }: { verdict: SubmissionVerdict }) {
  return (
    <Badge className={`capitalize ${verdictStyles[verdict] ?? ""}`}>
      {verdict.replaceAll("_", " ")}
    </Badge>
  );
}
