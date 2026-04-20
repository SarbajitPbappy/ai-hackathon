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

## 4. Environment Variables & Where to Find Them

Configure your hosting platform (e.g., Vercel) with the following environment variables.

### Supabase Keys
*Found in: **Project Settings** > **API***

| Variable | Specific Location in Dashboard |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** section |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys** section > `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project API keys** section > `service_role` `secret` (click reveal) |

### Judge0 (RapidAPI) Key
*Found in: **RapidAPI Hub** > **Personal Dashboard***

| Variable | Specific Location in Dashboard |
| :--- | :--- |
| `RAPIDAPI_KEY` | Select **Judge0 CE** > **Endpoints** > Check any header for `X-RapidAPI-Key` |

### Redis (Upstash) Keys
*Found in: **Databases** > [Your DB Name] > **Overview***

| Variable | Specific Location in Dashboard |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | Scroll down to **REST API** section > Copy the URL |
| `UPSTASH_REDIS_REST_TOKEN` | Scroll down to **REST API** section > Copy the Token (Secret) |

### AI (Anthropic) Key
*Found in: **Anthropic Console** > **Settings** > **API Keys***

| Variable | Specific Location in Dashboard |
| :--- | :--- |
| `ANTHROPIC_API_KEY` | Click **Create Key** or copy an existing one |

### Email (Resend) Key
*Found in: **Resend Dashboard** > **API Keys***

| Variable | Specific Location in Dashboard |
| :--- | :--- |
| `RESEND_API_KEY` | Click **Create API Key** > Copy the generated string |

### Application Config
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your production application URL (e.g., `https://your-app.vercel.app`) |

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
