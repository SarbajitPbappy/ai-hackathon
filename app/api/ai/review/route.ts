import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeModel } from "@/lib/claude";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  problem_statement: z.string().min(10),
  code: z.string().min(1),
  verdict: z.string(),
  language: z.string(),
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
  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const aiRateLimit = await consumeRateLimit(`rate:ai:${user.id}:${Math.floor(Date.now() / 3600000)}`, 10, 3600);
  if (!aiRateLimit.allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded (10 per hour)" }, { status: 429 });
  }

  const result = await generateText({
    model: getClaudeModel(),
    system:
      "You are a senior competitive programmer. Review the submitted code. Cover: correctness, time/space complexity, code style, and suggest one better approach if it exists. Be specific and concise.",
    prompt: [
      `Language: ${parsed.data.language}`,
      `Verdict: ${parsed.data.verdict}`,
      `Problem statement:\n${parsed.data.problem_statement}`,
      `Code:\n${parsed.data.code}`,
    ].join("\n\n"),
    maxOutputTokens: 600,
  });

  return NextResponse.json({ markdown: result.text });
}
