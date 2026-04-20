import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const K_FACTOR = 32;

type LeaderboardEntry = {
  user_id: string;
  total_score: number;
  penalty_time: number;
};

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

function actualScore(entryA: LeaderboardEntry, entryB: LeaderboardEntry) {
  if (entryA.total_score > entryB.total_score) return 1;
  if (entryA.total_score < entryB.total_score) return 0;
  if (entryA.penalty_time < entryB.penalty_time) return 1;
  if (entryA.penalty_time > entryB.penalty_time) return 0;
  return 0.5;
}

export async function applyContestEloRatings(contestId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: leaderboard } = await supabase
    .from("leaderboard_cache")
    .select("user_id,total_score,penalty_time")
    .eq("contest_id", contestId)
    .order("total_score", { ascending: false })
    .order("penalty_time", { ascending: true });

  if (!leaderboard || leaderboard.length < 2) {
    return;
  }

  const userIds = leaderboard.map((entry) => entry.user_id);
  const { data: users } = await supabase.from("users").select("id,rating").in("id", userIds);
  if (!users) {
    return;
  }

  const ratingMap = new Map(users.map((user) => [user.id, user.rating]));
  const updates: Array<{ id: string; rating: number }> = [];

  for (const entry of leaderboard) {
    const currentRating = ratingMap.get(entry.user_id) ?? 1200;
    let delta = 0;

    for (const opponent of leaderboard) {
      if (opponent.user_id === entry.user_id) {
        continue;
      }

      const opponentRating = ratingMap.get(opponent.user_id) ?? 1200;
      const expected = expectedScore(currentRating, opponentRating);
      const actual = actualScore(entry, opponent);
      delta += K_FACTOR * (actual - expected);
    }

    const normalizedDelta = delta / (leaderboard.length - 1);
    updates.push({
      id: entry.user_id,
      rating: Math.max(100, Math.round(currentRating + normalizedDelta)),
    });
  }

  await Promise.all(
    updates.map((update) =>
      supabase.from("users").update({ rating: update.rating }).eq("id", update.id),
    ),
  );
}
