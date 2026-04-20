import { NextResponse } from "next/server";
import {
  getJudge0SubmissionStatus,
  submitToJudge0AndWait,
  type Judge0LanguageId,
} from "@/lib/judge0";
import { outputsMatch, refreshLeaderboardForUser } from "@/lib/leaderboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import type { SubmissionVerdict } from "@/types";

function mapJudgeStatusToVerdict(statusId: number): SubmissionVerdict {
  if (statusId === 3) return "accepted";
  if (statusId === 4) return "wrong_answer";
  if (statusId === 5) return "tle";
  if (statusId === 6) return "compilation_error";
  if (statusId === 7 || statusId === 8 || statusId === 9 || statusId === 10 || statusId === 11 || statusId === 12)
    return "runtime_error";
  if (statusId === 13) return "runtime_error";
  return "wrong_answer";
}

function isJudgeStillRunning(statusId: number) {
  return statusId === 1 || statusId === 2;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseRouteHandlerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.verdict !== "pending") {
    return NextResponse.json({ submission });
  }

  const preCheck = await getJudge0SubmissionStatus(submission.judge0_token ?? "").catch(() => null);
  if (!preCheck) {
    return NextResponse.json({ error: "Unable to poll Judge0" }, { status: 502 });
  }

  if (isJudgeStillRunning(preCheck.status.id)) {
    return NextResponse.json({ submission, status: "pending" });
  }

  if (preCheck.status.id === 6 || preCheck.status.id === 11 || preCheck.status.id === 5) {
    const verdict = mapJudgeStatusToVerdict(preCheck.status.id);
    const { data: updatedSubmission } = await admin
      .from("submissions")
      .update({
        verdict,
        score: 0,
        time_ms: preCheck.time ? Number(preCheck.time) * 1000 : null,
        memory_kb: preCheck.memory,
      })
      .eq("id", submission.id)
      .select("*")
      .single();

    return NextResponse.json({ submission: updatedSubmission });
  }

  const [{ data: problem }, { data: contest }, { data: testCases }] = await Promise.all([
    admin
      .from("problems")
      .select("id,points")
      .eq("id", submission.problem_id)
      .single(),
    admin
      .from("contests")
      .select("id,scoring_style")
      .eq("id", submission.contest_id)
      .single(),
    admin
      .from("test_cases")
      .select("id,input,expected_output,is_sample")
      .eq("problem_id", submission.problem_id)
      .eq("is_sample", false)
      .order("order_index", { ascending: true }),
  ]);

  if (!problem || !contest) {
    return NextResponse.json({ error: "Missing problem or contest data" }, { status: 400 });
  }

  const nonSampleCases = testCases ?? [];
  if (nonSampleCases.length === 0) {
    return NextResponse.json(
      { error: "No hidden test cases configured for this problem" },
      { status: 400 },
    );
  }

  let passedTests = 0;
  let peakTimeMs = 0;
  let peakMemoryKb = 0;
  let executionVerdict: SubmissionVerdict = "accepted";

  const languageId = Number(submission.language) as Judge0LanguageId;

  // Use a simple parallel approach for test cases to speed up judging
  const testCasePromises = nonSampleCases.map(async (testCase) => {
    const run = await submitToJudge0AndWait({
      source_code: submission.code,
      language_id: languageId,
      stdin: testCase.input,
      expected_output: testCase.expected_output,
    }).catch(() => null);

    if (!run) {
      return { success: false, verdict: "runtime_error" as SubmissionVerdict, time: 0, memory: 0 };
    }

    if (run.status.id !== 3) {
      return { 
        success: false, 
        verdict: mapJudgeStatusToVerdict(run.status.id), 
        time: Math.round(Number(run.time ?? 0) * 1000), 
        memory: run.memory ?? 0 
      };
    }

    if (!outputsMatch(run.stdout, testCase.expected_output)) {
      return { 
        success: false, 
        verdict: "wrong_answer" as SubmissionVerdict, 
        time: Math.round(Number(run.time ?? 0) * 1000), 
        memory: run.memory ?? 0 
      };
    }

    return { 
      success: true, 
      verdict: "accepted" as SubmissionVerdict, 
      time: Math.round(Number(run.time ?? 0) * 1000), 
      memory: run.memory ?? 0 
    };
  });

  const results = await Promise.all(testCasePromises);

  for (const res of results) {
    peakTimeMs = Math.max(peakTimeMs, res.time);
    peakMemoryKb = Math.max(peakMemoryKb, res.memory);
    if (!res.success) {
      executionVerdict = res.verdict;
      break;
    }
    passedTests += 1;
  }

  const totalTests = nonSampleCases.length;
  let score = 0;
  if (contest.scoring_style === "ioi") {
    score = Math.round((passedTests / totalTests) * (problem.points ?? 0));
    if (passedTests < totalTests && executionVerdict === "accepted") {
      executionVerdict = "wrong_answer";
    }
  } else {
    if (executionVerdict === "accepted" && passedTests === totalTests) {
      score = problem.points ?? 0;
    }
  }

  const { data: updatedSubmission, error: updateError } = await admin
    .from("submissions")
    .update({
      verdict: executionVerdict,
      score,
      time_ms: peakTimeMs,
      memory_kb: peakMemoryKb,
    })
    .eq("id", submission.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (
    executionVerdict === "accepted" ||
    (contest.scoring_style === "ioi" && score > 0)
  ) {
    await refreshLeaderboardForUser(submission.contest_id, submission.user_id);
  }

  return NextResponse.json({ submission: updatedSubmission });
}
