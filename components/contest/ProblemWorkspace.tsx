"use client";

import { useMemo, useState, useTransition } from "react";
import { useCompletion } from "@ai-sdk/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSelector, { SUPPORTED_LANGUAGES, type SupportedLanguageId } from "@/components/editor/LanguageSelector";
import CodeEditor from "@/components/editor/CodeEditor";
import ProblemStatement from "@/components/contest/ProblemStatement";
import SubmissionList from "@/components/submission/SubmissionList";
import type { Submission } from "@/types";

const STARTER_CODE: Record<SupportedLanguageId, string> = {
  54: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  return 0;\n}\n",
  71: "def solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
  62: "import java.io.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n  }\n}\n",
  63: "function solve(input) {\n  return '';\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\nprocess.stdout.write(String(solve(input)));\n",
  60: "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println()\n}\n",
  73: "fn main() {\n}\n",
};

type ProblemWorkspaceProps = {
  problem: {
    id: string;
    contest_id: string;
    statement: string;
    input_format: string | null;
    output_format: string | null;
    constraints: string | null;
    test_cases: Array<{ id: string; input: string; expected_output: string }>;
  };
  initialSubmissions: Submission[];
};

export default function ProblemWorkspace({ problem, initialSubmissions }: ProblemWorkspaceProps) {
  const [language, setLanguage] = useState<SupportedLanguageId>(71);
  const [code, setCode] = useState<string>(STARTER_CODE[71]);
  const [pending, startTransition] = useTransition();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [showHintPanel, setShowHintPanel] = useState(false);
  const { completion, complete, isLoading: hintLoading } = useCompletion({
    api: "/api/ai/hint",
    streamProtocol: "text",
  });

  const monacoLanguage = useMemo(
    () => SUPPORTED_LANGUAGES.find((item) => item.id === language)?.monaco ?? "plaintext",
    [language],
  );

  const onLanguageChange = (nextLanguage: SupportedLanguageId) => {
    setLanguage(nextLanguage);
    if (code.trim() === "" || Object.values(STARTER_CODE).includes(code)) {
      setCode(STARTER_CODE[nextLanguage]);
    }
  };

  const onRunSamples = () => {
    toast.info("Sample runs are enabled after Judge0 APIs are configured in Step 6.");
  };

  const onSubmit = () => {
    startTransition(async () => {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language_id: language,
          problem_id: problem.id,
          contest_id: problem.contest_id,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; submission?: Submission; submission_id?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Submission failed");
        return;
      }

      toast.success("Submission queued");
      if (payload?.submission_id && payload?.submission) {
        const pendingSubmission = payload.submission as Submission;
        setSubmissions((current) => [pendingSubmission, ...current]);

        const poll = async () => {
          const statusResponse = await fetch(`/api/submissions/${payload.submission_id}/status`, {
            cache: "no-store",
          });

          if (!statusResponse.ok) {
            return false;
          }

          const statusPayload = (await statusResponse.json().catch(() => null)) as
            | { submission?: Submission; status?: string }
            | null;
          if (!statusPayload?.submission) {
            return false;
          }

          setSubmissions((current) =>
            current.map((submission) =>
              submission.id === statusPayload.submission?.id
                ? statusPayload.submission
                : submission,
            ),
          );

          return statusPayload.status !== "pending" && statusPayload.submission.verdict !== "pending";
        };

        for (let attempt = 0; attempt < 12; attempt += 1) {
          const completed = await poll();
          if (completed) {
            break;
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 1500);
          });
        }
      }
    });
  };

  const latestFailedSubmission = submissions.find(
    (submission) =>
      submission.verdict !== "accepted" && submission.verdict !== "pending",
  );

  const onGetHint = async () => {
    if (!latestFailedSubmission) {
      return;
    }

    setShowHintPanel(true);
    await complete("hint", {
      body: {
        problem_id: problem.id,
        problem_statement: problem.statement,
        last_submission_code: latestFailedSubmission.code,
        current_verdict: latestFailedSubmission.verdict,
      },
    });
  };

  const statementPanel = (
    <ProblemStatement
      statement={problem.statement}
      inputFormat={problem.input_format}
      outputFormat={problem.output_format}
      constraints={problem.constraints}
      samples={problem.test_cases}
    />
  );

  const editorPanel = (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LanguageSelector value={language} onChange={onLanguageChange} />
        <div className="flex gap-2">
          {latestFailedSubmission ? (
            <Button variant="secondary" onClick={onGetHint} disabled={hintLoading}>
              {hintLoading ? "Getting Hint..." : "Get AI Hint"}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onRunSamples}>
            Run Samples
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
      <CodeEditor value={code} onChange={setCode} language={monacoLanguage} />
      {showHintPanel ? (
        <section className="rounded-md border border-accent/40 bg-accent/10 p-3">
          <h4 className="mb-2 text-sm font-semibold text-accent">AI Hint</h4>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {completion || "Generating hint..."}
          </p>
        </section>
      ) : null}
      <section>
        <h3 className="mb-2 text-sm font-semibold">Submission History</h3>
        <SubmissionList submissions={submissions} />
      </section>
    </section>
  );

  return (
    <>
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        {statementPanel}
        {editorPanel}
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="statement">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statement">Statement</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="statement">{statementPanel}</TabsContent>
          <TabsContent value="editor">{editorPanel}</TabsContent>
          <TabsContent value="submissions" className="rounded-lg border border-border bg-surface p-4">
            <SubmissionList submissions={submissions} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
