import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const scoreSchema = z.object({
  hackathon_submission_id: z.string().uuid(),
  innovation: z.number().int().min(0).max(10),
  technical: z.number().int().min(0).max(10),
  presentation: z.number().int().min(0).max(10),
  impact: z.number().int().min(0).max(10),
  feedback: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { contestId: string } },
) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: judgeProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (judgeProfile?.role !== "judge") {
    return NextResponse.json({ error: "Judge role required" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = scoreSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;

  const { data: submission } = await supabase
    .from("hackathon_submissions")
    .select("id,contest_id")
    .eq("id", payload.hackathon_submission_id)
    .eq("contest_id", params.contestId)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("scores")
    .upsert(
      {
        hackathon_submission_id: payload.hackathon_submission_id,
        judge_id: user.id,
        innovation: payload.innovation,
        technical: payload.technical,
        presentation: payload.presentation,
        impact: payload.impact,
        feedback: payload.feedback || null,
      },
      { onConflict: "hackathon_submission_id,judge_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, score: data });
}
