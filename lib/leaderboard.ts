import { getRedisClient } from "@/lib/redis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SubmissionVerdict } from "@/types";

type UserSubmissionRow = {
  id: string;
  problem_id: string;
  contest_id: string;
  verdict: SubmissionVerdict;
  score: number | null;
  submitted_at: string;
};

type ProblemScoreRow = {
  id: string;
  points: number;
};

type ContestScoreRow = {
  id: string;
  scoring_style: "acm" | "ioi";
  start_time: string;
};

function minutesSinceContestStart(submittedAt: string, contestStart: string) {
  const deltaMs = new Date(submittedAt).getTime() - new Date(contestStart).getTime();
  return Math.max(0, Math.floor(deltaMs / 60000));
}

function normalizeOutput(value: string | null | undefined) {
  return (value ?? "").replace(/\s+$/g, "").replace(/\r\n/g, "\n");
}

export function outputsMatch(actual: string | null | undefined, expected: string | null | undefined) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

function acmCompositeScore(totalScore: number, solved: number, penaltyTime: number) {
  return solved * 1_000_000_000 + totalScore * 1_000_000 - penaltyTime;
}

function ioiCompositeScore(totalScore: number, penaltyTime: number) {
  return totalScore * 1_000_000 - penaltyTime;
}

export async function refreshLeaderboardForUser(contestId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const redis = getRedisClient();

  const [{ data: contest }, { data: submissions }, { data: problems }] = await Promise.all([
    supabase.from("contests").select("id,scoring_style,start_time").eq("id", contestId).single(),
    supabase
      .from("submissions")
      .select("id,problem_id,contest_id,verdict,score,submitted_at")
      .eq("contest_id", contestId)
      .eq("user_id", userId)
      .order("submitted_at", { ascending: true }),
    supabase.from("problems").select("id,points").eq("contest_id", contestId),
  ]);

  if (!contest || !submissions || !problems) {
    return;
  }

  const contestData = contest as ContestScoreRow;
  const submissionsData = submissions as UserSubmissionRow[];
  const problemMap = new Map((problems as ProblemScoreRow[]).map((problem) => [problem.id, problem.points]));

  let totalScore = 0;
  let problemsSolved = 0;
  let penaltyTime = 0;
  let lastAcTime: string | null = null;

  const grouped = new Map<string, UserSubmissionRow[]>();
  for (const submission of submissionsData) {
    const existing = grouped.get(submission.problem_id) ?? [];
    existing.push(submission);
    grouped.set(submission.problem_id, existing);
  }

  if (contestData.scoring_style === "acm") {
    for (const [problemId, problemSubmissions] of grouped.entries()) {
      const firstAccepted = problemSubmissions.find((submission) => submission.verdict === "accepted");
      if (!firstAccepted) {
        continue;
      }

      problemsSolved += 1;
      totalScore += problemMap.get(problemId) ?? 0;

      const wrongAttemptsBeforeAc = problemSubmissions.filter(
        (submission) =>
          submission.submitted_at <= firstAccepted.submitted_at && submission.verdict !== "accepted",
      ).length;

      penaltyTime += wrongAttemptsBeforeAc * 20;
      penaltyTime += minutesSinceContestStart(firstAccepted.submitted_at, contestData.start_time);
      if (!lastAcTime || new Date(firstAccepted.submitted_at).getTime() > new Date(lastAcTime).getTime()) {
        lastAcTime = firstAccepted.submitted_at;
      }
    }
  } else {
    for (const [problemId, problemSubmissions] of grouped.entries()) {
      const bestScore = problemSubmissions.reduce((max, submission) => {
        return Math.max(max, submission.score ?? 0);
      }, 0);

      totalScore += bestScore;
      const fullScore = problemMap.get(problemId) ?? 0;
      if (bestScore >= fullScore && fullScore > 0) {
        problemsSolved += 1;
      }
    }
  }

  const compositeScore =
    contestData.scoring_style === "acm"
      ? acmCompositeScore(totalScore, problemsSolved, penaltyTime)
      : ioiCompositeScore(totalScore, penaltyTime);

  await Promise.all([
    redis.zadd(`leaderboard:${contestId}`, {
      member: userId,
      score: compositeScore,
    }),
    supabase.from("leaderboard_cache").upsert(
      {
        contest_id: contestId,
        user_id: userId,
        total_score: totalScore,
        problems_solved: problemsSolved,
        penalty_time: penaltyTime,
        last_ac_time: lastAcTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contest_id,user_id" },
    ),
  ]);
}
