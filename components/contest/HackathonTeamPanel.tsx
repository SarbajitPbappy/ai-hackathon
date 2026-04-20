"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TeamPayload = {
  id: string;
  name: string;
  invite_code: string;
  leader_id: string;
};

type TeamMemberPayload = {
  id: string;
  user_id: string;
  users: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function HackathonTeamPanel({
  contestId,
  contestSlug,
}: {
  contestId: string;
  contestSlug: string;
}) {
  const [team, setTeam] = useState<TeamPayload | null>(null);
  const [members, setMembers] = useState<TeamMemberPayload[]>([]);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pending, startTransition] = useTransition();

  const inviteLink = useMemo(() => {
    if (!team?.invite_code) {
      return "";
    }
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/contests/${contestSlug}?invite=${team.invite_code}`;
  }, [contestSlug, team?.invite_code]);

  const loadTeam = useCallback(async () => {
    const response = await fetch(`/api/contests/${contestId}/teams`, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { team: TeamPayload | null; members: TeamMemberPayload[] }
      | null;

    if (response.ok && payload) {
      setTeam(payload.team);
      setMembers(payload.members ?? []);
    }
  }, [contestId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const createTeam = () => {
    startTransition(async () => {
      const response = await fetch(`/api/contests/${contestId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: teamName,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to create team");
        return;
      }

      toast.success("Team created");
      await loadTeam();
    });
  };

  const joinTeam = () => {
    startTransition(async () => {
      const response = await fetch(`/api/contests/${contestId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          invite_code: joinCode,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to join team");
        return;
      }

      toast.success("Joined team");
      await loadTeam();
    });
  };

  const copyInvite = async () => {
    if (!inviteLink) {
      return;
    }
    await navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied");
  };

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-4 text-accent" />
          Hackathon Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {team ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-background p-3">
              <p className="font-medium">{team.name}</p>
              <p className="text-xs text-muted-foreground">Invite code: {team.invite_code}</p>
              <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={copyInvite}>
                <Copy className="mr-2 size-4" />
                Copy Invite Link
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <div key={member.id} className="rounded-md border border-border bg-background p-3">
                  <p className="text-sm font-medium">
                    {member.users?.display_name ?? member.users?.username ?? "Team Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">@{member.users?.username ?? "unknown"}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Create Team</p>
              <Input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Team name"
              />
              <Button type="button" onClick={createTeam} disabled={pending}>
                Create Team
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Join Team with Code</p>
              <Input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Invite code"
              />
              <Button type="button" variant="secondary" onClick={joinTeam} disabled={pending}>
                Join Team
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
