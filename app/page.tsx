import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#20315f_0%,#0f1117_55%)]" />
      <div className="absolute left-10 top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-16 right-10 h-44 w-44 rounded-full bg-success/20 blur-3xl" />
      <section className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur md:p-12">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-accent">CodeArena</p>
        <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
          Competitive coding and hackathons in one arena.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Next.js 14, Supabase, Redis, Judge0, and Claude-powered scaffolding is now set
          up. We are ready to continue implementation step-by-step.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contests"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground transition hover:opacity-90"
          >
            Explore Contests
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-background px-5 py-2.5 font-medium transition hover:border-accent"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
