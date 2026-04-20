"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LeaderboardRow from "@/components/leaderboard/LeaderboardRow";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  country: string | null;
  problems_solved: number;
  total_score: number;
  penalty_time: number;
  last_ac_time: string | null;
};

async function fetchLeaderboardRows(contestId: string) {
  const response = await fetch(`/api/leaderboard/${contestId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load leaderboard");
  }

  const payload = (await response.json()) as { rows: LeaderboardEntry[] };
  return payload.rows;
}

export default function LiveLeaderboard({
  contestId,
  currentUserId,
  freezeAt,
}: {
  contestId: string;
  currentUserId?: string;
  freezeAt?: string | null;
}) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const isFrozen = freezeAt ? Date.now() > new Date(freezeAt).getTime() : false;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextRows = await fetchLeaderboardRows(contestId);
        if (active) {
          setRows(nextRows);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("Failed to refresh leaderboard");
          setLoading(false);
        }
      }
    };

    load();

    const channel = supabase
      .channel(`leaderboard:${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboard_cache",
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    const interval = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [contestId, supabase]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {isFrozen ? (
        <div className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
          Scoreboard Frozen
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Solved</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Penalty</TableHead>
              <TableHead>Last AC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No leaderboard entries yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <LeaderboardRow
                  key={row.user_id}
                  row={row}
                  highlight={row.user_id === currentUserId}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
