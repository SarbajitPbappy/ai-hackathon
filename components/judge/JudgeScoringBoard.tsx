"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

type SubmissionCard = {
  id: string;
  title: string;
  description: string;
  github_url: string | null;
  demo_url: string | null;
  video_url: string | null;
  team_name: string;
};

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <Label>{label}</Label>
        <span>{value}</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={10}
        step={1}
        onValueChange={(next) => {
          const resolved = Array.isArray(next) ? next[0] : next;
          onChange(resolved ?? value);
        }}
      />
    </div>
  );
}

export default function JudgeScoringBoard({
  contestId,
  submissions,
}: {
  contestId: string;
  submissions: SubmissionCard[];
}) {
  const [pending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, { innovation: number; technical: number; presentation: number; impact: number; feedback: string }>>(
    {},
  );

  const updateScore = (
    submissionId: string,
    key: "innovation" | "technical" | "presentation" | "impact" | "feedback",
    value: number | string,
  ) => {
    setScores((current) => ({
      ...current,
      [submissionId]: {
        innovation: current[submissionId]?.innovation ?? 0,
        technical: current[submissionId]?.technical ?? 0,
        presentation: current[submissionId]?.presentation ?? 0,
        impact: current[submissionId]?.impact ?? 0,
        feedback: current[submissionId]?.feedback ?? "",
        [key]: value,
      },
    }));
  };

  const submitScore = (submissionId: string) => {
    const score = scores[submissionId] ?? {
      innovation: 0,
      technical: 0,
      presentation: 0,
      impact: 0,
      feedback: "",
    };

    startTransition(async () => {
      const response = await fetch(`/api/judge/${contestId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hackathon_submission_id: submissionId,
          ...score,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to save score");
        return;
      }

      toast.success("Score saved");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {submissions.map((submission) => {
        const score = scores[submission.id] ?? {
          innovation: 0,
          technical: 0,
          presentation: 0,
          impact: 0,
          feedback: "",
        };

        return (
          <Card key={submission.id} className="border-border bg-surface">
            <CardHeader>
              <CardTitle>{submission.title}</CardTitle>
              <p className="text-xs text-muted-foreground">Team: {submission.team_name}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-4 text-sm text-muted-foreground">{submission.description}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>GitHub: {submission.github_url ?? "N/A"}</p>
                <p>Demo: {submission.demo_url ?? "N/A"}</p>
                <p>Video: {submission.video_url ?? "N/A"}</p>
              </div>

              <ScoreSlider
                label="Innovation"
                value={score.innovation}
                onChange={(next) => updateScore(submission.id, "innovation", next)}
              />
              <ScoreSlider
                label="Technical"
                value={score.technical}
                onChange={(next) => updateScore(submission.id, "technical", next)}
              />
              <ScoreSlider
                label="Presentation"
                value={score.presentation}
                onChange={(next) => updateScore(submission.id, "presentation", next)}
              />
              <ScoreSlider
                label="Impact"
                value={score.impact}
                onChange={(next) => updateScore(submission.id, "impact", next)}
              />

              <div className="space-y-1">
                <Label>Feedback</Label>
                <Textarea
                  rows={3}
                  value={score.feedback}
                  onChange={(event) => updateScore(submission.id, "feedback", event.target.value)}
                />
              </div>

              <Button type="button" onClick={() => submitScore(submission.id)} disabled={pending}>
                Save Score
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
