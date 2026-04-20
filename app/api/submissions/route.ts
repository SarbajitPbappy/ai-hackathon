import { NextResponse } from "next/server";
import { z } from "zod";
import { JUDGE0_LANGUAGE_MAP, submitToJudge0 } from "@/lib/judge0";
import { getRedisClient } from "@/lib/redis";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const submissionSchema = z.object({
  code: z.string().min(1),
  language_id: z.number().int(),
  problem_id: z.string().uuid(),
  contest_id: z.string().uuid(),
});

function isContestActive(startTime: string, endTime: string) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return now >= start && now <= end;
}

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = submissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { code, language_id, problem_id, contest_id } = parsed.data;

  if (!(language_id in JUDGE0_LANGUAGE_MAP)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const redis = getRedisClient();
  const rateLimitKey = `rate:submissions:${user.id}:${Math.floor(Date.now() / 60000)}`;
  const submissionsInMinute = await redis.incr(rateLimitKey);
  if (submissionsInMinute === 1) {
    await redis.expire(rateLimitKey, 60);
  }
  if (submissionsInMinute > 5) {
    return NextResponse.json({ error: "Rate limit exceeded (max 5 per minute)" }, { status: 429 });
  }

  const [{ data: contest }, { data: registration }, { data: problem }] = await Promise.all([
    supabase
      .from("contests")
      .select("id,status,start_time,end_time")
      .eq("id", contest_id)
      .single(),
    supabase
      .from("contest_registrations")
      .select("id")
      .eq("contest_id", contest_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("problems")
      .select("id")
      .eq("id", problem_id)
      .eq("contest_id", contest_id)
      .single(),
  ]);

  if (!contest || !problem) {
    return NextResponse.json({ error: "Contest or problem not found" }, { status: 404 });
  }

  if (!registration) {
    return NextResponse.json({ error: "You are not registered for this contest" }, { status: 403 });
  }

  if (contest.status !== "active" || !isContestActive(contest.start_time, contest.end_time)) {
    return NextResponse.json({ error: "Contest is not active" }, { status: 400 });
  }

  const judgeSubmission = await submitToJudge0({
    source_code: code,
    language_id,
  }).catch((error) => {
    return { error: error instanceof Error ? error.message : "Judge0 submission failed" };
  });

  if ("error" in judgeSubmission) {
    return NextResponse.json({ error: judgeSubmission.error }, { status: 502 });
  }

  const { data: submission, error: submissionInsertError } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      problem_id,
      contest_id,
      code,
      language: String(language_id),
      verdict: "pending",
      score: 0,
      judge0_token: judgeSubmission.token,
    })
    .select("*")
    .single();

  if (submissionInsertError) {
    return NextResponse.json({ error: submissionInsertError.message }, { status: 400 });
  }

  return NextResponse.json({
    submission_id: submission.id,
    submission,
  });
}
