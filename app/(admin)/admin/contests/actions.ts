"use server";

import { revalidatePath } from "next/cache";
import {
  contestFormSchema,
  problemFormSchema,
  type ContestFormInput,
  type ProblemFormInput,
} from "@/lib/validation/contest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyContestEloRatings } from "@/lib/rating";

type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export async function createContestAction(input: ContestFormInput): Promise<ActionResult> {
  const parsed = contestFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid contest input" };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be logged in." };
  }

  const payload = parsed.data;
  const { data, error } = await supabase
    .from("contests")
    .insert({
      ...payload,
      organizer_id: user.id,
      max_participants: normalizeNullableNumber(payload.max_participants),
      invite_code: payload.invite_code || null,
      freeze_scoreboard_at: payload.freeze_scoreboard_at || null,
      banner_url: payload.banner_url || null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/contests");
  return { ok: true, id: data.id };
}

export async function updateContestAction(
  contestId: string,
  input: ContestFormInput,
): Promise<ActionResult> {
  const parsed = contestFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid contest input" };
  }

  const payload = parsed.data;
  const supabase = createSupabaseServerClient();
  const { data: existingContest } = await supabase
    .from("contests")
    .select("status")
    .eq("id", contestId)
    .single();

  const { error } = await supabase
    .from("contests")
    .update({
      ...payload,
      max_participants: normalizeNullableNumber(payload.max_participants),
      invite_code: payload.invite_code || null,
      freeze_scoreboard_at: payload.freeze_scoreboard_at || null,
      banner_url: payload.banner_url || null,
    })
    .eq("id", contestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (existingContest?.status !== "ended" && payload.status === "ended") {
    await applyContestEloRatings(contestId);
  }

  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${contestId}/edit`);
  return { ok: true, id: contestId };
}

export async function deleteContestAction(contestId: string): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("contests").delete().eq("id", contestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/contests");
  return { ok: true };
}

export async function upsertProblemAction(input: ProblemFormInput): Promise<ActionResult> {
  const parsed = problemFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid problem input" };
  }

  const supabase = createSupabaseServerClient();
  const payload = parsed.data;

  const problemId = payload.id;
  const problemBody = {
    contest_id: payload.contest_id,
    title: payload.title,
    slug: payload.slug,
    statement: payload.statement,
    input_format: payload.input_format || null,
    output_format: payload.output_format || null,
    constraints: payload.constraints || null,
    difficulty: payload.difficulty,
    time_limit_ms: payload.time_limit_ms,
    memory_limit_mb: payload.memory_limit_mb,
    points: payload.points,
    order_index: payload.order_index,
  };

  let id = problemId;

  if (problemId) {
    const { error: updateError } = await supabase.from("problems").update(problemBody).eq("id", problemId);
    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { error: deleteTestCasesError } = await supabase
      .from("test_cases")
      .delete()
      .eq("problem_id", problemId);
    if (deleteTestCasesError) {
      return { ok: false, error: deleteTestCasesError.message };
    }
  } else {
    const { data, error: insertError } = await supabase
      .from("problems")
      .insert(problemBody)
      .select("id")
      .single();

    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    id = data.id;
  }

  const testCasesPayload = payload.test_cases.map((testCase, index) => ({
    problem_id: id,
    input: testCase.input,
    expected_output: testCase.expected_output,
    is_sample: testCase.is_sample,
    order_index: index,
  }));

  const { error: testCasesError } = await supabase.from("test_cases").insert(testCasesPayload);
  if (testCasesError) {
    return { ok: false, error: testCasesError.message };
  }

  revalidatePath(`/admin/contests/${payload.contest_id}/problems`);
  return { ok: true, id };
}

export async function deleteProblemAction(contestId: string, problemId: string): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("problems").delete().eq("id", problemId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/contests/${contestId}/problems`);
  return { ok: true };
}

export async function reorderProblemsAction(
  contestId: string,
  orderedProblemIds: string[],
): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  for (let index = 0; index < orderedProblemIds.length; index += 1) {
    const { error } = await supabase
      .from("problems")
      .update({ order_index: index })
      .eq("id", orderedProblemIds[index]);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/admin/contests/${contestId}/problems`);
  return { ok: true };
}
