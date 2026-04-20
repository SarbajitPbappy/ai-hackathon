import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

type ProblemStatementProps = {
  statement: string;
  inputFormat?: string | null;
  outputFormat?: string | null;
  constraints?: string | null;
  samples: Array<{ id: string; input: string; expected_output: string }>;
};

export default function ProblemStatement({
  statement,
  inputFormat,
  outputFormat,
  constraints,
  samples,
}: ProblemStatementProps) {
  return (
    <article className="space-y-5 rounded-lg border border-border bg-surface p-4">
      <div className="prose prose-invert max-w-none text-sm">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{statement}</ReactMarkdown>
      </div>
      {inputFormat ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Input Format</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{inputFormat}</p>
        </section>
      ) : null}
      {outputFormat ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Output Format</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{outputFormat}</p>
        </section>
      ) : null}
      {constraints ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Constraints</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{constraints}</p>
        </section>
      ) : null}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Sample Test Cases</h3>
        {samples.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sample cases available.</p>
        ) : (
          samples.map((sample, index) => (
            <div key={sample.id} className="rounded-md border border-border bg-background p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Sample {index + 1}</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold">Input</p>
                  <pre className="overflow-x-auto rounded bg-surface p-2 font-mono text-xs">{sample.input}</pre>
                </div>
                <div>
                  <p className="text-xs font-semibold">Expected Output</p>
                  <pre className="overflow-x-auto rounded bg-surface p-2 font-mono text-xs">
                    {sample.expected_output}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </article>
  );
}
