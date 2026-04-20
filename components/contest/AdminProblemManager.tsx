"use client";

import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteProblemAction,
  reorderProblemsAction,
  upsertProblemAction,
} from "@/app/(admin)/admin/contests/actions";

type TestCase = {
  id?: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
  order_index: number;
};

type ProblemItem = {
  id: string;
  contest_id: string;
  title: string;
  slug: string;
  statement: string;
  input_format: string | null;
  output_format: string | null;
  constraints: string | null;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  points: number;
  order_index: number;
  test_cases: TestCase[];
};

type ProblemFormState = {
  id?: string;
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  points: number;
  order_index: number;
  test_cases: TestCase[];
};

const emptyTestCase = (order: number): TestCase => ({
  input: "",
  expected_output: "",
  is_sample: false,
  order_index: order,
});

const defaultProblemState: ProblemFormState = {
  title: "",
  slug: "",
  statement: "",
  input_format: "",
  output_format: "",
  constraints: "",
  difficulty: "easy",
  time_limit_ms: 2000,
  memory_limit_mb: 256,
  points: 100,
  order_index: 0,
  test_cases: [emptyTestCase(0)],
};

function SortableProblemRow({
  problem,
  onEdit,
  onDelete,
}: {
  problem: ProblemItem;
  onEdit: (problem: ProblemItem) => void;
  onDelete: (problemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: problem.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 rounded-md border border-border bg-background p-3 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${problem.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{problem.title}</p>
        <p className="text-xs text-muted-foreground">{problem.slug}</p>
      </div>
      <Badge variant="outline" className="capitalize">
        {problem.difficulty}
      </Badge>
      <Badge variant="secondary">{problem.points} pts</Badge>
      <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(problem)}>
        Edit
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(problem.id)}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function AdminProblemManager({
  contestId,
  initialProblems,
}: {
  contestId: string;
  initialProblems: ProblemItem[];
}) {
  const [problems, setProblems] = useState(
    initialProblems.sort((a, b) => a.order_index - b.order_index),
  );
  const [formState, setFormState] = useState<ProblemFormState>(defaultProblemState);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedIds = useMemo(() => problems.map((problem) => problem.id), [problems]);

  const resetForm = (orderIndex: number) => {
    setFormState({
      ...defaultProblemState,
      order_index: orderIndex,
      test_cases: [emptyTestCase(0)],
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setProblems((currentProblems) => {
      const oldIndex = currentProblems.findIndex((problem) => problem.id === active.id);
      const newIndex = currentProblems.findIndex((problem) => problem.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return currentProblems;
      }

      const moved = arrayMove(currentProblems, oldIndex, newIndex).map((problem, index) => ({
        ...problem,
        order_index: index,
      }));

      startTransition(async () => {
        const result = await reorderProblemsAction(
          contestId,
          moved.map((problem) => problem.id),
        );
        if (!result.ok) {
          toast.error(result.error ?? "Unable to reorder problems");
        } else {
          toast.success("Problem order updated");
        }
      });

      return moved;
    });
  };

  const onSaveProblem = () => {
    startTransition(async () => {
      const payload = {
        id: formState.id,
        contest_id: contestId,
        title: formState.title,
        slug: formState.slug,
        statement: formState.statement,
        input_format: formState.input_format,
        output_format: formState.output_format,
        constraints: formState.constraints,
        difficulty: formState.difficulty,
        time_limit_ms: Number(formState.time_limit_ms),
        memory_limit_mb: Number(formState.memory_limit_mb),
        points: Number(formState.points),
        order_index: Number(formState.order_index),
        test_cases: formState.test_cases.map((testCase, index) => ({
          ...testCase,
          order_index: index,
        })),
      };

      const result = await upsertProblemAction(payload);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to save problem");
        return;
      }

      toast.success("Problem saved");
      const nextProblem: ProblemItem = {
        id: result.id ?? formState.id ?? crypto.randomUUID(),
        contest_id: contestId,
        title: formState.title,
        slug: formState.slug,
        statement: formState.statement,
        input_format: formState.input_format,
        output_format: formState.output_format,
        constraints: formState.constraints,
        difficulty: formState.difficulty,
        time_limit_ms: Number(formState.time_limit_ms),
        memory_limit_mb: Number(formState.memory_limit_mb),
        points: Number(formState.points),
        order_index: Number(formState.order_index),
        test_cases: payload.test_cases,
      };

      setProblems((current) => {
        const existingIndex = current.findIndex((problem) => problem.id === nextProblem.id);
        if (existingIndex === -1) {
          const appended = [...current, nextProblem].map((problem, index) => ({
            ...problem,
            order_index: index,
          }));
          return appended;
        }

        const cloned = [...current];
        cloned[existingIndex] = nextProblem;
        return cloned;
      });

      resetForm(problems.length);
    });
  };

  const onDeleteProblem = (problemId: string) => {
    startTransition(async () => {
      const result = await deleteProblemAction(contestId, problemId);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to delete problem");
        return;
      }

      toast.success("Problem deleted");
      setProblems((current) =>
        current
          .filter((problem) => problem.id !== problemId)
          .map((problem, index) => ({ ...problem, order_index: index })),
      );
      if (formState.id === problemId) {
        resetForm(0);
      }
    });
  };

  const onEditProblem = (problem: ProblemItem) => {
    setFormState({
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      statement: problem.statement,
      input_format: problem.input_format ?? "",
      output_format: problem.output_format ?? "",
      constraints: problem.constraints ?? "",
      difficulty: problem.difficulty,
      time_limit_ms: problem.time_limit_ms,
      memory_limit_mb: problem.memory_limit_mb,
      points: problem.points,
      order_index: problem.order_index,
      test_cases: problem.test_cases.length
        ? problem.test_cases
        : [emptyTestCase(0)],
    });
  };

  const onAddSampleTestCase = () => {
    setFormState((current) => ({
      ...current,
      test_cases: [
        ...current.test_cases,
        {
          ...emptyTestCase(current.test_cases.length),
          is_sample: true,
        },
      ],
    }));
  };

  const onAddHiddenTestCase = () => {
    setFormState((current) => ({
      ...current,
      test_cases: [...current.test_cases, emptyTestCase(current.test_cases.length)],
    }));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-lg">Problem Set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={() => resetForm(problems.length)}
            variant="secondary"
            className="w-full"
          >
            <Plus className="mr-2 size-4" />
            Add New Problem
          </Button>

          {problems.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              No problems yet. Add one to start drafting the contest set.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {problems.map((problem) => (
                    <SortableProblemRow
                      key={problem.id}
                      problem={problem}
                      onEdit={onEditProblem}
                      onDelete={onDeleteProblem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-lg">Problem Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="problem-title">Title</Label>
              <Input
                id="problem-title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="problem-slug">Slug</Label>
              <Input
                id="problem-slug"
                value={formState.slug}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </div>
          </div>

          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Statement</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-2">
              <Textarea
                rows={12}
                value={formState.statement}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, statement: event.target.value }))
                }
                placeholder="Write markdown statement here"
              />
            </TabsContent>
            <TabsContent value="preview" className="rounded-md border border-border bg-background p-4">
              <article className="prose prose-invert max-w-none text-sm">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {formState.statement || "No statement yet."}
                </ReactMarkdown>
              </article>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={formState.difficulty}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    difficulty: value as "easy" | "medium" | "hard",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-limit">Time Limit (ms)</Label>
              <Input
                id="time-limit"
                type="number"
                value={formState.time_limit_ms}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    time_limit_ms: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-limit">Memory Limit (MB)</Label>
              <Input
                id="memory-limit"
                type="number"
                value={formState.memory_limit_mb}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    memory_limit_mb: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={formState.points}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, points: Number(event.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="input-format">Input Format</Label>
              <Input
                id="input-format"
                value={formState.input_format}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, input_format: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Input
                id="output-format"
                value={formState.output_format}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, output_format: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={formState.constraints}
              rows={3}
              onChange={(event) =>
                setFormState((current) => ({ ...current, constraints: event.target.value }))
              }
            />
          </div>

          <section className="space-y-3 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Test Cases</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={onAddSampleTestCase}>
                  Add Sample
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={onAddHiddenTestCase}>
                  Add Hidden
                </Button>
              </div>
            </div>

            {formState.test_cases.map((testCase, index) => (
              <div key={`${index}-${testCase.id ?? "new"}`} className="space-y-2 rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Case #{index + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={testCase.is_sample}
                        onChange={(event) =>
                          setFormState((current) => {
                            const updated = [...current.test_cases];
                            updated[index] = {
                              ...updated[index],
                              is_sample: event.target.checked,
                            };
                            return { ...current, test_cases: updated };
                          })
                        }
                      />
                      Sample
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          test_cases: current.test_cases.filter((_, testCaseIndex) => testCaseIndex !== index),
                        }))
                      }
                      disabled={formState.test_cases.length === 1}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Textarea
                    rows={4}
                    placeholder="Input"
                    value={testCase.input}
                    onChange={(event) =>
                      setFormState((current) => {
                        const updated = [...current.test_cases];
                        updated[index] = {
                          ...updated[index],
                          input: event.target.value,
                        };
                        return { ...current, test_cases: updated };
                      })
                    }
                  />
                  <Textarea
                    rows={4}
                    placeholder="Expected output"
                    value={testCase.expected_output}
                    onChange={(event) =>
                      setFormState((current) => {
                        const updated = [...current.test_cases];
                        updated[index] = {
                          ...updated[index],
                          expected_output: event.target.value,
                        };
                        return { ...current, test_cases: updated };
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </section>

          <Button type="button" onClick={onSaveProblem} disabled={pending}>
            {pending ? "Saving..." : formState.id ? "Update Problem" : "Create Problem"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
