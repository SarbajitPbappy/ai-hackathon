import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminContestsTable from "@/components/contest/AdminContestsTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminContestsPage() {
  const supabase = createSupabaseServerClient();
  const { data: contests } = await supabase
    .from("contests")
    .select("id,title,status,type,visibility,start_time,end_time")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Contests</h1>
        <Button asChild>
          <Link href="/admin/contests/new">Create Contest</Link>
        </Button>
      </div>
      <AdminContestsTable contests={contests ?? []} />
    </section>
  );
}
