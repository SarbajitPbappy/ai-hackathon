import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: { contestId: string } },
) {
  const redis = getRedisClient();
  const supabase = createSupabaseAdminClient();
  const key = `leaderboard:${params.contestId}`;

  let entries: Array<{ userId: string; score: number }> = [];

  try {
    const results = (await redis.zrange(key, 0, 199, {
      rev: true,
      withScores: true,
    })) as Array<{ member: string; score: number }>;

    entries = results.map((entry) => ({
      userId: entry.member,
      score: Number(entry.score),
    }));
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    const { data: cacheRows } = await supabase
      .from("leaderboard_cache")
      .select("contest_id,user_id,total_score,problems_solved,penalty_time,last_ac_time")
      .eq("contest_id", params.contestId)
      .order("total_score", { ascending: false })
      .order("penalty_time", { ascending: true })
      .limit(200);

    const userIds = (cacheRows ?? []).map((row) => row.user_id);
    const { data: users } = userIds.length
      ? await supabase
          .from("users")
          .select("id,username,display_name,country")
          .in("id", userIds)
      : { data: [] };

    const userMap = new Map((users ?? []).map((user: any) => [user.id, user]));

    const fallback = (cacheRows ?? []).map((row: any, index: number) => ({
      rank: index + 1,
      user_id: row.user_id,
      username: userMap.get(row.user_id)?.username ?? "unknown",
      display_name: userMap.get(row.user_id)?.display_name,
      country: userMap.get(row.user_id)?.country,
      total_score: row.total_score,
      problems_solved: row.problems_solved,
      penalty_time: row.penalty_time,
      last_ac_time: row.last_ac_time,
    }));

    return NextResponse.json({ rows: fallback });
  }

  const userIds = entries.map((entry) => entry.userId);
  const [{ data: users }, { data: cacheRows }] = await Promise.all([
    supabase
      .from("users")
      .select("id,username,display_name,country")
      .in("id", userIds),
    supabase
      .from("leaderboard_cache")
      .select("user_id,total_score,problems_solved,penalty_time,last_ac_time")
      .eq("contest_id", params.contestId)
      .in("user_id", userIds),
  ]);

  const userMap = new Map((users ?? []).map((user: any) => [user.id, user]));
  const cacheMap = new Map((cacheRows ?? []).map((row: any) => [row.user_id, row]));

  const rows = entries.map((entry, index) => {
    const cache = cacheMap.get(entry.userId);
    const user = userMap.get(entry.userId);
    return {
      rank: index + 1,
      user_id: entry.userId,
      username: user?.username ?? "unknown",
      display_name: user?.display_name,
      country: user?.country,
      total_score: cache?.total_score ?? 0,
      problems_solved: cache?.problems_solved ?? 0,
      penalty_time: cache?.penalty_time ?? 0,
      last_ac_time: cache?.last_ac_time ?? null,
    };
  });

  return NextResponse.json({ rows });
}
