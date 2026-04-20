import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  action: z.enum(["create", "join"]),
  name: z.string().min(2).optional(),
  invite_code: z.string().min(4).optional(),
});

function generateInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: registration } = await supabase
    .from("contest_registrations")
    .select("team_id")
    .eq("contest_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration?.team_id) {
    return NextResponse.json({ team: null });
  }

  const [{ data: team }, { data: members }] = await Promise.all([
    supabase
      .from("teams")
      .select("id,name,invite_code,leader_id")
      .eq("id", registration.team_id)
      .single(),
    supabase
      .from("team_members")
      .select("id,user_id,users!team_members_user_id_fkey(username,display_name,avatar_url)")
      .eq("team_id", registration.team_id),
  ]);

  return NextResponse.json({ team, members: members ?? [] });
}

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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { action, name, invite_code } = parsed.data;

  const [{ data: contest }, { data: registration }] = await Promise.all([
    supabase
      .from("contests")
      .select("id,type,max_participants")
      .eq("id", params.id)
      .single(),
    supabase
      .from("contest_registrations")
      .select("id,team_id")
      .eq("contest_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!contest || contest.type !== "hackathon") {
    return NextResponse.json({ error: "Hackathon contest not found" }, { status: 404 });
  }

  if (!registration) {
    return NextResponse.json({ error: "Register for the contest first" }, { status: 403 });
  }

  if (registration.team_id) {
    return NextResponse.json({ error: "You are already in a team" }, { status: 400 });
  }

  if (action === "create") {
    const inviteCode = generateInviteCode();
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        contest_id: contest.id,
        name: name ?? `Team-${inviteCode}`,
        invite_code: inviteCode,
        leader_id: user.id,
      })
      .select("id,name,invite_code,leader_id")
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: teamError?.message ?? "Unable to create team" }, { status: 400 });
    }

    await Promise.all([
      supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
      }),
      supabase
        .from("contest_registrations")
        .update({ team_id: team.id })
        .eq("id", registration.id),
    ]);

    return NextResponse.json({ ok: true, team });
  }

  const { data: targetTeam } = await supabase
    .from("teams")
    .select("id,contest_id,name,invite_code")
    .eq("contest_id", contest.id)
    .eq("invite_code", invite_code ?? "")
    .single();

  if (!targetTeam) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const { count: memberCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", targetTeam.id);

  const maxTeamSize = contest.max_participants ?? 5;
  if ((memberCount ?? 0) >= maxTeamSize) {
    return NextResponse.json({ error: "Team is full" }, { status: 400 });
  }

  const { error: joinError } = await supabase.from("team_members").insert({
    team_id: targetTeam.id,
    user_id: user.id,
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 400 });
  }

  await supabase
    .from("contest_registrations")
    .update({ team_id: targetTeam.id })
    .eq("id", registration.id);

  return NextResponse.json({ ok: true, team: targetTeam });
}
