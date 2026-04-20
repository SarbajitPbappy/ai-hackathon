"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  contestFormSchema,
  type ContestFormInput,
  type ContestFormValues,
} from "@/lib/validation/contest";
import { createContestAction, updateContestAction } from "@/app/(admin)/admin/contests/actions";

type ContestAdminFormProps = {
  mode: "create" | "edit";
  contestId?: string;
  initialValues?: Partial<ContestFormValues>;
};

function datetimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
}

export default function ContestAdminForm({
  mode,
  contestId,
  initialValues,
}: ContestAdminFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContestFormInput>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      type: initialValues?.type ?? "coding",
      status: initialValues?.status ?? "draft",
      scoring_style: initialValues?.scoring_style ?? "acm",
      visibility: initialValues?.visibility ?? "public",
      start_time: datetimeLocalValue(initialValues?.start_time),
      end_time: datetimeLocalValue(initialValues?.end_time),
      max_participants: initialValues?.max_participants ?? null,
      invite_code: initialValues?.invite_code ?? "",
      freeze_scoreboard_at: datetimeLocalValue(initialValues?.freeze_scoreboard_at),
      banner_url: initialValues?.banner_url ?? "",
    },
  });

  const onSubmit = (values: ContestFormInput) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createContestAction(values)
          : await updateContestAction(contestId ?? "", values);

      if (!result.ok) {
        toast.error(result.error ?? "Unable to save contest");
        return;
      }

      toast.success(mode === "create" ? "Contest created" : "Contest updated");
      const targetContestId = result.id ?? contestId;
      if (mode === "create" && targetContestId) {
        router.push(`/admin/contests/${targetContestId}/problems`);
      } else if (contestId) {
        router.push(`/admin/contests/${contestId}/edit`);
      }
      router.refresh();
    });
  };

  const selectedType = watch("type");

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Contest" : "Edit Contest"}</CardTitle>
        <CardDescription>
          Configure schedule, visibility, scoring, and participant limits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" aria-label="Contest title" {...register("title")} />
              {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" aria-label="Contest slug" {...register("slug")} />
              {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              aria-label="Contest description"
              rows={4}
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                defaultValue={watch("type")}
                onValueChange={(value) => setValue("type", value as "coding" | "hackathon")}
              >
                <SelectTrigger aria-label="Contest type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as "draft" | "upcoming" | "active" | "ended")
                }
              >
                <SelectTrigger aria-label="Contest status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                defaultValue={watch("visibility")}
                onValueChange={(value) => setValue("visibility", value as "public" | "private")}
              >
                <SelectTrigger aria-label="Contest visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Scoring Style</Label>
              <Select
                defaultValue={watch("scoring_style")}
                onValueChange={(value) => setValue("scoring_style", value as "acm" | "ioi")}
              >
                <SelectTrigger aria-label="Scoring style">
                  <SelectValue placeholder="Select scoring" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acm">ACM</SelectItem>
                  <SelectItem value="ioi">IOI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="datetime-local" {...register("start_time")} />
              {errors.start_time ? (
                <p className="text-xs text-destructive">{errors.start_time.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="datetime-local" {...register("end_time")} />
              {errors.end_time ? <p className="text-xs text-destructive">{errors.end_time.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants (optional)</Label>
              <Input
                id="max_participants"
                type="number"
                min={1}
                {...register("max_participants", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeze_scoreboard_at">Scoreboard Freeze (optional)</Label>
              <Input id="freeze_scoreboard_at" type="datetime-local" {...register("freeze_scoreboard_at")} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite_code">
                Invite Code {selectedType === "hackathon" ? "(recommended)" : "(optional)"}
              </Label>
              <Input id="invite_code" {...register("invite_code")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner_url">Banner URL (optional)</Label>
              <Input id="banner_url" placeholder="https://..." {...register("banner_url")} />
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Create Contest" : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
