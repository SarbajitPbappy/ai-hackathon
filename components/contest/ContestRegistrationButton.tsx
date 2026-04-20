"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ContestRegistrationButton({
  contestId,
  registered,
}: {
  contestId: string;
  registered: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onRegister = () => {
    startTransition(async () => {
      const response = await fetch(`/api/contests/${contestId}/register`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to register for contest");
        return;
      }

      toast.success("Registered successfully");
      window.location.reload();
    });
  };

  return (
    <Button onClick={onRegister} disabled={registered || pending}>
      {registered ? "Registered" : pending ? "Registering..." : "Register"}
    </Button>
  );
}
