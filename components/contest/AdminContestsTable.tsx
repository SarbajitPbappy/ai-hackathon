"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteContestAction } from "@/app/(admin)/admin/contests/actions";

type ContestTableRow = {
  id: string;
  title: string;
  status: "draft" | "upcoming" | "active" | "ended";
  type: "coding" | "hackathon";
  visibility: "public" | "private";
  start_time: string;
  end_time: string;
};

const statusVariants: Record<ContestTableRow["status"], "secondary" | "default" | "destructive"> = {
  draft: "secondary",
  upcoming: "secondary",
  active: "default",
  ended: "destructive",
};

export default function AdminContestsTable({ contests }: { contests: ContestTableRow[] }) {
  const [pending, startTransition] = useTransition();

  const onDelete = (contestId: string) => {
    startTransition(async () => {
      const result = await deleteContestAction(contestId);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to delete contest");
        return;
      }
      toast.success("Contest deleted");
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Window</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No contests found.
              </TableCell>
            </TableRow>
          ) : (
            contests.map((contest) => (
              <TableRow key={contest.id}>
                <TableCell className="font-medium">{contest.title}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[contest.status]} className="capitalize">
                    {contest.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{contest.type}</TableCell>
                <TableCell className="capitalize">{contest.visibility}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(contest.start_time), "PPp")} to {format(new Date(contest.end_time), "PPp")}
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/contests/${contest.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/contests/${contest.id}/problems`}>Problems</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(contest.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
