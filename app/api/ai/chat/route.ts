import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeModel } from "@/lib/claude";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const chatSchema = z.object({
  prompt: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  context: z.object({
    rules: z.array(z.string()).default([]),
    problem_titles: z.array(z.string()).default([]),
    faqs: z.array(z.string()).default([]),
  }),
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
  const parsed = chatSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const aiRateLimit = await consumeRateLimit(`rate:ai:${user.id}:${Math.floor(Date.now() / 3600000)}`, 10, 3600);
  if (!aiRateLimit.allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded (10 per hour)" }, { status: 429 });
  }

  const contextText = [
    `Rules: ${parsed.data.context.rules.join("; ")}`,
    `Problem titles: ${parsed.data.context.problem_titles.join("; ")}`,
    `FAQs: ${parsed.data.context.faqs.join("; ")}`,
  ].join("\n");

  const historyText = parsed.data.history
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const result = streamText({
    model: getClaudeModel(),
    system:
      "You are a helpful contest assistant. Answer questions about contest rules, how scoring works, and general guidance. Do NOT answer questions about problem solutions or hints. Keep answers under 100 words.",
    prompt: [
      `Context:\n${contextText}`,
      historyText ? `History:\n${historyText}` : "",
      `User question:\n${parsed.data.prompt}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    maxOutputTokens: 220,
  });

  return result.toTextStreamResponse();
}
