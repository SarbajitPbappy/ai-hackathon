import ContestCard from "@/components/contest/ContestCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContestsPageProps = {
  searchParams: {
    status?: "upcoming" | "active" | "ended";
    type?: "coding" | "hackathon";
    search?: string;
  };
};

export default async function ContestsPage({ searchParams }: ContestsPageProps) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("contests")
    .select("id,title,slug,description,type,status,start_time,end_time")
    .eq("visibility", "public")
    .neq("status", "draft")
    .order("start_time", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }

  if (searchParams.search) {
    query = query.ilike("title", `%${searchParams.search}%`);
  }

  const { data: contests } = await query;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Browse Contests</h1>
        <p className="text-sm text-muted-foreground">
          Filter by status and type to find coding rounds and hackathons.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(contests ?? []).map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </div>

      {contests?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          No contests found for the current filters.
        </div>
      ) : null}
    </section>
  );
}
