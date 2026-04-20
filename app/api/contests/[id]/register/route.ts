import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: contest } = await supabase
    .from("contests")
    .select("id,visibility,invite_code")
    .eq("id", params.id)
    .single();

  if (!contest) {
    return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("contest_registrations")
    .select("id")
    .eq("contest_id", contest.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already_registered: true });
  }

  const { error } = await supabase.from("contest_registrations").insert({
    contest_id: contest.id,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
