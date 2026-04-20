import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminContestsPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Contests</h1>
        <Button asChild>
          <Link href="/admin/contests/new">Create Contest</Link>
        </Button>
      </div>
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>No contests yet</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Create your first coding contest or hackathon to begin.
        </CardContent>
      </Card>
    </section>
  );
}
