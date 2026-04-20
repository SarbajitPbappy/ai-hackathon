type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile: {params.username}</h1>
      <p className="text-muted-foreground">
        Public profile details and contest history will appear here.
      </p>
    </section>
  );
}
