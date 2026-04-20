import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const submissionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  github_url: z.string().url(),
  demo_url: z.string().url(),
  video_url: z.string().url().optional().or(z.literal("")),
  tech_stack: z.array(z.string()).min(1),
  asset_urls: z.array(z.string().url()).optional().default([]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
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

  const [{ data: contest }, { data: registration }] = await Promise.all([
    supabase
      .from("contests")
      .select("id,type,end_time,status")
      .eq("id", params.id)
      .single(),
    supabase
      .from("contest_registrations")
      .select("team_id")
      .eq("contest_id", params.id)
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!contest || contest.type !== "hackathon") {
    return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
  }

  if (!registration?.team_id) {
    return NextResponse.json({ error: "Join a team before submitting" }, { status: 400 });
  }

  if (contest.status !== "active" || Date.now() > new Date(contest.end_time).getTime()) {
    return NextResponse.json({ error: "Submission deadline has passed" }, { status: 400 });
  }

  const payload = parsed.data;
  const assetsMarkdown = payload.asset_urls.length
    ? `\n\n### Assets\n${payload.asset_urls.map((url) => `- ${url}`).join("\n")}`
    : "";

  const { data: submission, error } = await supabase
    .from("hackathon_submissions")
    .upsert(
      {
        team_id: registration.team_id,
        contest_id: contest.id,
        title: payload.title,
        description: `${payload.description}${assetsMarkdown}`,
        github_url: payload.github_url,
        demo_url: payload.demo_url,
        video_url: payload.video_url || null,
        tech_stack: payload.tech_stack,
      },
      {
        onConflict: "team_id,contest_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, submission });
}
