import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Contests Joined</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Problems Solved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Current Rating</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">1200</CardContent>
        </Card>
      </div>
    </section>
  );
}
