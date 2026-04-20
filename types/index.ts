export type UserRole = "super_admin" | "organizer" | "participant" | "judge";
export type ContestType = "coding" | "hackathon";
export type ContestStatus = "draft" | "upcoming" | "active" | "ended";
export type ScoringStyle = "acm" | "ioi";
export type ContestVisibility = "public" | "private";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type SubmissionVerdict =
  | "pending"
  | "accepted"
  | "wrong_answer"
  | "tle"
  | "mle"
  | "runtime_error"
  | "compilation_error";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          rating: number;
          role: UserRole;
          country: string | null;
          github_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          rating?: number;
          role?: UserRole;
          country?: string | null;
          github_url?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          rating?: number;
          role?: UserRole;
          country?: string | null;
          github_url?: string | null;
          created_at?: string;
        };
      };
      contests: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          type: ContestType;
          status: ContestStatus;
          scoring_style: ScoringStyle;
          start_time: string;
          end_time: string;
          visibility: ContestVisibility;
          invite_code: string | null;
          freeze_scoreboard_at: string | null;
          organizer_id: string;
          max_participants: number | null;
          banner_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          type: ContestType;
          status?: ContestStatus;
          scoring_style?: ScoringStyle;
          start_time: string;
          end_time: string;
          visibility?: ContestVisibility;
          invite_code?: string | null;
          freeze_scoreboard_at?: string | null;
          organizer_id: string;
          max_participants?: number | null;
          banner_url?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          type?: ContestType;
          status?: ContestStatus;
          scoring_style?: ScoringStyle;
          start_time?: string;
          end_time?: string;
          visibility?: ContestVisibility;
          invite_code?: string | null;
          freeze_scoreboard_at?: string | null;
          organizer_id?: string;
          max_participants?: number | null;
          banner_url?: string | null;
          created_at?: string;
        };
      };
      problems: {
        Row: {
          id: string;
          contest_id: string;
          title: string;
          slug: string;
          statement: string;
          input_format: string | null;
          output_format: string | null;
          constraints: string | null;
          difficulty: ProblemDifficulty;
          time_limit_ms: number;
          memory_limit_mb: number;
          points: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          title: string;
          slug: string;
          statement: string;
          input_format?: string | null;
          output_format?: string | null;
          constraints?: string | null;
          difficulty: ProblemDifficulty;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          points: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          statement?: string;
          input_format?: string | null;
          output_format?: string | null;
          constraints?: string | null;
          difficulty?: ProblemDifficulty;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          points?: number;
          order_index?: number;
          created_at?: string;
        };
      };
      test_cases: {
        Row: {
          id: string;
          problem_id: string;
          input: string;
          expected_output: string;
          is_sample: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          problem_id: string;
          input: string;
          expected_output: string;
          is_sample?: boolean;
          order_index: number;
        };
        Update: {
          input?: string;
          expected_output?: string;
          is_sample?: boolean;
          order_index?: number;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          contest_id: string;
          code: string;
          language: string;
          verdict: SubmissionVerdict;
          time_ms: number | null;
          memory_kb: number | null;
          score: number | null;
          judge0_token: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          contest_id: string;
          code: string;
          language: string;
          verdict?: SubmissionVerdict;
          time_ms?: number | null;
          memory_kb?: number | null;
          score?: number | null;
          judge0_token?: string | null;
          submitted_at?: string;
        };
        Update: {
          code?: string;
          language?: string;
          verdict?: SubmissionVerdict;
          time_ms?: number | null;
          memory_kb?: number | null;
          score?: number | null;
          judge0_token?: string | null;
          submitted_at?: string;
        };
      };
      contest_registrations: {
        Row: {
          id: string;
          contest_id: string;
          user_id: string;
          team_id: string | null;
          registered_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          user_id: string;
          team_id?: string | null;
          registered_at?: string;
        };
        Update: {
          team_id?: string | null;
          registered_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          contest_id: string;
          name: string;
          invite_code: string;
          leader_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          name: string;
          invite_code: string;
          leader_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          invite_code?: string;
          leader_id?: string;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          joined_at?: string;
        };
      };
      hackathon_submissions: {
        Row: {
          id: string;
          team_id: string;
          contest_id: string;
          title: string;
          description: string;
          github_url: string | null;
          demo_url: string | null;
          video_url: string | null;
          tech_stack: string[];
          submitted_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          contest_id: string;
          title: string;
          description: string;
          github_url?: string | null;
          demo_url?: string | null;
          video_url?: string | null;
          tech_stack?: string[];
          submitted_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          github_url?: string | null;
          demo_url?: string | null;
          video_url?: string | null;
          tech_stack?: string[];
          submitted_at?: string;
        };
      };
      scores: {
        Row: {
          id: string;
          hackathon_submission_id: string;
          judge_id: string;
          innovation: number;
          technical: number;
          presentation: number;
          impact: number;
          feedback: string | null;
          scored_at: string;
        };
        Insert: {
          id?: string;
          hackathon_submission_id: string;
          judge_id: string;
          innovation: number;
          technical: number;
          presentation: number;
          impact: number;
          feedback?: string | null;
          scored_at?: string;
        };
        Update: {
          innovation?: number;
          technical?: number;
          presentation?: number;
          impact?: number;
          feedback?: string | null;
          scored_at?: string;
        };
      };
      leaderboard_cache: {
        Row: {
          id: string;
          contest_id: string;
          user_id: string;
          total_score: number;
          problems_solved: number;
          penalty_time: number;
          last_ac_time: string | null;
          rank: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          user_id: string;
          total_score?: number;
          problems_solved?: number;
          penalty_time?: number;
          last_ac_time?: string | null;
          rank?: number | null;
          updated_at?: string;
        };
        Update: {
          total_score?: number;
          problems_solved?: number;
          penalty_time?: number;
          last_ac_time?: string | null;
          rank?: number | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Contest = Database["public"]["Tables"]["contests"]["Row"];
export type Problem = Database["public"]["Tables"]["problems"]["Row"];
export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
