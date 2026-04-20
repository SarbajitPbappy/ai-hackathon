import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ContestCardProps = {
  contest: {
    id: string;
    title: string;
    slug: string;
    description: string;
    type: "coding" | "hackathon";
    status: "draft" | "upcoming" | "active" | "ended";
    start_time: string;
    end_time: string;
  };
};

export default function ContestCard({ contest }: ContestCardProps) {
  const startsIn = formatDistanceToNowStrict(new Date(contest.start_time), {
    addSuffix: true,
  });

  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge variant={contest.status === "active" ? "default" : "secondary"} className="capitalize">
          {contest.status}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {contest.type}
        </Badge>
      </div>
      <h3 className="text-lg font-semibold">{contest.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{contest.description}</p>
      <p className="mt-4 text-xs text-muted-foreground">Starts {startsIn}</p>
      <Button asChild className="mt-5 w-full">
        <Link href={`/contests/${contest.slug}`}>Open Contest</Link>
      </Button>
    </article>
  );
}
