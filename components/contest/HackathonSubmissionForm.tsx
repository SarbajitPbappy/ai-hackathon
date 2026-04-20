"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HackathonSubmissionForm({
  contestId,
}: {
  contestId: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const addTech = () => {
    const normalized = techStackInput.trim();
    if (!normalized || techStack.includes(normalized)) {
      return;
    }
    setTechStack((current) => [...current, normalized]);
    setTechStackInput("");
  };

  const removeTech = (value: string) => {
    setTechStack((current) => current.filter((item) => item !== value));
  };

  const onSubmit = () => {
    startTransition(async () => {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const path = `${contestId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error } = await supabase.storage.from("hackathon-assets").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

        if (error) {
          toast.error(`Upload failed for ${file.name}: ${error.message}`);
          return;
        }

        const { data } = supabase.storage.from("hackathon-assets").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const response = await fetch(`/api/contests/${contestId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          github_url: githubUrl,
          demo_url: demoUrl,
          video_url: videoUrl,
          tech_stack: techStack,
          asset_urls: uploadedUrls,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to submit project");
        return;
      }

      toast.success("Project submission saved");
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea
          id="description"
          rows={7}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="github">GitHub URL</Label>
          <Input id="github" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo">Demo URL</Label>
          <Input id="demo" value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Video URL (optional)</Label>
        <Input id="video" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Tech Stack</Label>
        <div className="flex gap-2">
          <Input
            value={techStackInput}
            onChange={(event) => setTechStackInput(event.target.value)}
            placeholder="Add tech tag"
          />
          <Button type="button" variant="secondary" onClick={addTech}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTech(tag)}
              className="rounded bg-accent/20 px-2 py-1 text-xs text-accent"
            >
              {tag} x
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="files">Screenshots / Images</Label>
        <Input
          id="files"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      </div>

      <Button onClick={onSubmit} disabled={pending}>
        {pending ? "Submitting..." : "Submit Project"}
      </Button>
    </div>
  );
}
