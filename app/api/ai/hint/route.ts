import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeModel } from "@/lib/claude";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const hintSchema = z.object({
  problem_id: z.string().uuid(),
  problem_statement: z.string().min(10),
  last_submission_code: z.string().min(1),
  current_verdict: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = hintSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const aiRateLimit = await consumeRateLimit(`rate:ai:${user.id}:${Math.floor(Date.now() / 3600000)}`, 10, 3600);
  if (!aiRateLimit.allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded (10 per hour)" }, { status: 429 });
  }

  const hintLimit = await consumeRateLimit(`rate:hint:${user.id}:${parsed.data.problem_id}`, 3, 86400);
  if (!hintLimit.allowed) {
    return NextResponse.json({ error: "Hint limit reached for this problem" }, { status: 429 });
  }

  const result = streamText({
    model: getClaudeModel(),
    system:
      "You are a competitive programming tutor. Give a conceptual hint that nudges the student toward the solution WITHOUT revealing the algorithm or code. Max 3 sentences.",
    prompt: [
      `Problem statement:\n${parsed.data.problem_statement}`,
      `Latest verdict: ${parsed.data.current_verdict}`,
      `Latest code:\n${parsed.data.last_submission_code}`,
    ].join("\n\n"),
    maxOutputTokens: 200,
  });

  return result.toTextStreamResponse();
}
