# CodeArena Deployment Walkthrough

This guide provides a step-by-step walkthrough for deploying the **CodeArena** platform to a production environment. CodeArena is a robust coding contest platform built with Next.js, Supabase, and Judge0.

## 1. Supabase Project Setup

### Create a New Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once the project is ready, navigate to the **SQL Editor**.
3. Copy the contents of `supabase/migrations/202604200001_initial_schema.sql` and run it in the editor. This will set up the tables, enums, triggers, and RLS policies.

### Configure Authentication
1. Go to **Authentication** > **Providers**.
2. Enable **Email/Password** (disabled by default in some regions).
3. If you want social login, enable **GitHub** and provide your client credentials.
4. Set the **Site URL** and **Redirect URLs** in **Authentication** > **URL Configuration** to your production domain (e.g., `https://your-app.vercel.app`).

### Set Admin Role
By default, the trigger `handle_new_user` assigns the `'participant'` role. To create an admin:
```sql
UPDATE public.users SET role = 'super_admin' WHERE username = 'your_username';
```

---

## 2. Judge0 API Setup (RapidAPI)

CodeArena uses **Judge0 CE** for code execution via RapidAPI.

1. Create an account on [RapidAPI](https://rapidapi.com/).
2. Subscribe to the [Judge0 CE API](https://rapidapi.com/judge0-official/api/judge0-ce).
3. Copy your **X-RapidAPI-Key** from the API playground. This will be your `RAPIDAPI_KEY` env var.

---

## 3. Upstash Redis Setup

Redis is used for rate-limiting submissions and caching the leaderboard.

1. Sign up for [Upstash](https://upstash.com/).
2. Create a new **Redis** database (Global or Regional).
3. In the database dashboard, find the **REST API** section.
4. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 4. Environment Variables

Create a project on **Vercel** and add the following environment variables. You can find these in the project settings of each service.

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (Secret) |
| `RAPIDAPI_KEY` | Your RapidAPI key for Judge0 |
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis REST Token (Secret) |
| `NEXT_PUBLIC_APP_URL` | Your production application URL |

---

## 5. Vercel Deployment

1. Connect your GitHub repository to Vercel.
2. Select the repository and click **Deploy**.
3. **IMPORTANT**: If your contests have many test cases, you may need a **Pro** plan on Vercel to increase the serverless function timeout (standard is 10s).
    - If you are on the hobby plan, I have optimized the judging logic to run test cases in parallel, which should handle most standard problems.

---

## 6. Verification

Once deployed:
1. Register a new user and log in.
2. Navigate to `/admin` (after setting your role to `super_admin` in SQL).
3. Create a new contest and add a simple "Addition" problem.
4. Add test cases (e.g., `1 2` -> `3`).
5. Submit code and verify the verdict updates from `pending` to `accepted`.

> [!TIP]
> Always check the **Browser Console** and **Vercel Logs** if submissions stay in `pending` for too long, as this usually indicates an API key misconfiguration.
