import ContestAdminForm from "@/components/contest/ContestAdminForm";

export default function NewContestPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New Contest</h1>
      <ContestAdminForm mode="create" />
    </section>
  );
}
