import { z } from "zod";

export const contestFormSchema = z
  .object({
    title: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    description: z.string().min(10),
    type: z.enum(["coding", "hackathon"]),
    status: z.enum(["draft", "upcoming", "active", "ended"]),
    scoring_style: z.enum(["acm", "ioi"]),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    visibility: z.enum(["public", "private"]),
    max_participants: z.union([z.number().int().positive(), z.nan(), z.null()]).optional(),
    invite_code: z.string().optional(),
    freeze_scoreboard_at: z.string().optional(),
    banner_url: z.string().url().optional().or(z.literal("")),
  })
  .refine((value) => new Date(value.end_time).getTime() > new Date(value.start_time).getTime(), {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const testCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string().min(1, "Input is required"),
  expected_output: z.string().min(1, "Expected output is required"),
  is_sample: z.boolean().default(false),
  order_index: z.number().int().nonnegative(),
});

export const problemFormSchema = z.object({
  id: z.string().optional(),
  contest_id: z.string().uuid(),
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  statement: z.string().min(10),
  input_format: z.string().optional(),
  output_format: z.string().optional(),
  constraints: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  time_limit_ms: z.number().int().positive(),
  memory_limit_mb: z.number().int().positive(),
  points: z.number().int().positive(),
  order_index: z.number().int().nonnegative(),
  test_cases: z.array(testCaseSchema).min(1, "At least one test case is required before publish"),
});

export type ContestFormInput = z.input<typeof contestFormSchema>;
export type ContestFormValues = z.output<typeof contestFormSchema>;
export type ProblemFormInput = z.input<typeof problemFormSchema>;
export type ProblemFormValues = z.output<typeof problemFormSchema>;
