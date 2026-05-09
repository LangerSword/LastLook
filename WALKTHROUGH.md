# WALKTHROUGH — LastLook

> For evaluators, judges, and anyone reviewing the project.

---

## What LastLook Is

LastLook is a pre-submit checker for student applications — fellowships, hackathons, internships, and grants.

**The problem:** Students rush their final submissions. Project names go unexplained, video scripts are too short, and "why this program" answers stay generic. These are fixable mistakes that cost real opportunities.

**The solution:** A focused, four-step workflow:

1. **Save your memory** — bio, projects, achievements, preferred tone
2. **Analyze the brief** — extract what evaluators actually want
3. **Generate a tailored answer** — personalized to your profile
4. **Run a final check** — readiness score, critical issues, fix order

**Review Limits:** To prevent abuse, free authenticated users are limited to 5 full reviews or 15 individual actions per day. Unauthenticated users can only run the built-in sample demo.

No login required for the demo. Open the URL and start.

---

## Try It Right Now

### Option A: Live demo (fastest)

If deployed, open the URL and click **▶ Load Sample Demo**. Everything fills automatically. Skip to the [Demo Script](#demo-script-under-2-minutes) below.

### Option B: Run locally

```bash
git clone <repo-url> && cd lastlook
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend loads immediately, but API calls will fail.

For full app with Cloudflare Pages Functions (Frontend + API), start Wrangler:

```bash
npm run pages:dev
```

Open `http://localhost:8788`. The app will use Cloudflare Pages local dev and your API calls will work.

Local environment variables should go in `.dev.vars` (this file is gitignored):

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAILS=you@example.com
NVIDIA_API_KEY=your_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_AI_TOKEN=your_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct-fp8-fast
```

Without Wrangler running, the frontend app still loads but API calls will fail with a connection error. With Wrangler running but no keys set, API calls will use mock responses.

---

## How Memory Works

Memory is the user's reusable profile — name, bio, projects, achievements, and preferred writing tone.

- **Stored in browser localStorage** under the key `lastlook_memory`
- **Auto-loads on page refresh** — no re-entry needed
- **No account, no database, no cloud sync** — intentionally simple for the MVP
- **Export/Import** — users can download their memory as JSON and load it on another device
- The UI clearly states: *"Your memory is stored locally on this device. No account needed."*

**Why localStorage?** For a challenge demo, it eliminates signup friction entirely. A user opens the live URL, saves their profile, and the core loop works across page refreshes. The trade-off (device-specific) is stated in the UI and acceptable for the use case.

---

## The Core Flow (Step by Step)

### 1. Save Memory

Fill in your profile or click **Load Sample Profile** to use the built-in demo data. Click **Save Memory**. The status badge confirms: *"Saved locally in this browser."*

The answer generator uses this memory to personalize drafts — it's not just stored, it's actively used.

### 2. Analyze Brief

Paste an application prompt. Click **🔍 Analyze Brief**. The API returns:

| Output | Purpose |
|--------|---------|
| Explicit requirements | What the brief literally asks for |
| Implied criteria | What evaluators actually look for beyond the stated ask |
| Submission risks | Common mistakes applicants make |
| Suggested angles | Strategic approaches to answering well |
| Summary | What the evaluator wants in 1-2 sentences |

### 3. Generate Answer

Enter the question, choose tone (Confident / Warm / Technical / Founder-like / Concise) and target length (100-200 words or 60-90 sec video). Click **✨ Generate Answer**.

The generator combines your memory + brief analysis + question to produce:
- A personalized draft (auto-fills the checker below)
- "Why It Works" — reasons the draft is effective
- "Customize" — suggestions for further editing

### 4. Run LastLook (Step-by-Step)

Your draft (or any pasted answer) goes into the checker. Click **🔍 Run LastLook**. Output:

| Output | Example |
|--------|---------|
| Readiness score | 42/100 |
| Status | "Not ready" (0-59), "Needs fixes" (60-79), "Ready with minor edits" (80+) |
| Critical issues | Too short for video, projects unexplained, generic fit |
| Warnings | Weak identity, missing link requirement |
| Strong points | Mentions real projects, establishes context |
| Fix order | Prioritized list of what to fix first |
| Word count | 38 words |
| Speaking time | ~16s at 145 wpm |

### 5. "Run Full LastLook" (All-in-One Mode)

Instead of going step-by-step, users can click **✨ Run full LastLook** at the top of the workspace. This automatically sequences:
1. Reading brief
2. Drafting tailored answer
3. Checking readiness
4. Building a unified **Final Dashboard**

The Final Dashboard presents a single, beautifully laid out report combining the score, top fix, next action, fix order, and explicitly extracted brief requirements in one view.

The sample demo intentionally uses a **weak answer** so the checker has something meaningful to flag.

---

## AI Provider Fallback

The backend uses a 3-tier provider chain — the frontend never knows which one responds:

```
1. NVIDIA NIM       → if NVIDIA_API_KEY is configured
2. Cloudflare Workers AI → if AI binding or CF credentials are configured
3. Mock fallback    → always available, realistic demo responses
```

**Why mock?** Demo reliability. If an API key expires or a service is down during judging, the app still works end-to-end with realistic, pre-built responses.

**Health check:**

```bash
curl https://your-domain/api/health
```

```json
{
  "ok": true,
  "providers": {
    "nvidia": "configured",
    "cloudflareWorkersAI": "missing",
    "mock": "available"
  },
  "supabaseServer": "configured",
  "limits": {
    "fullReviewsPerDay": 5,
    "individualActionsPerDay": 15
  }
}
```

---

## Deployment (Cloudflare Pages)

```bash
npm run build   # → outputs to dist/
```

In Cloudflare Pages dashboard:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `NVIDIA_API_KEY` (optional), `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_TOKEN` (optional)

The `functions/` directory is auto-detected for serverless API routes. No extra config.

### Environment Variables

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `SUPABASE_URL` | User verification & quota | Yes (if tracking limits) |
| `SUPABASE_ANON_KEY` | User verification & quota | Yes (if tracking limits) |
| `ADMIN_EMAILS` | Override quotas | Optional |
| `NVIDIA_API_KEY` | NVIDIA NIM API | Optional (Tier 1) |
| `NVIDIA_BASE_URL` | Custom endpoint | No — default: `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | Model override | No — default: `meta/llama-3.1-8b-instruct` |
| `CLOUDFLARE_ACCOUNT_ID` | CF Workers AI REST | Optional (Tier 2) |
| `CLOUDFLARE_AI_TOKEN` | CF Workers AI REST | Optional (Tier 2) |
| `CLOUDFLARE_AI_MODEL` | CF AI model | No — default: `@cf/meta/llama-3.1-8b-instruct` |

**None are required.** Without any keys, mock responses handle the full demo.

### Supabase Authentication (Optional)

LastLook can run without a database (Demo Mode), but if you configure Supabase (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`), you must also configure its redirect URLs in the Supabase dashboard under **Authentication → URL Configuration**:

**Site URL:**
- Local: `http://localhost:8788` (or `http://localhost:5173`)
- Production: `https://YOUR_DOMAIN`

**Redirect URLs:**
- `http://localhost:8788/auth/callback`
- `http://localhost:5173/auth/callback`
- `https://YOUR_DOMAIN/auth/callback`
- `https://YOUR_PAGES_DEV_URL/auth/callback`
- `http://localhost:8788/reset-password`
- `http://localhost:5173/reset-password`
- `https://YOUR_DOMAIN/reset-password`
- `https://YOUR_PAGES_DEV_URL/reset-password`

---

## Demo Script (Under 2 Minutes)

Use this script when presenting LastLook to evaluators:

**Setup (5s):** Open the app. Point out the tagline: *"The final check before you submit."*

**Load demo (5s):** Click **▶ Load Sample Demo**. All fields fill automatically — profile, brief, question, and a deliberately weak answer.

**Show memory (10s):** Scroll to the Memory panel. Point out the saved profile and the helper text: *"Stored locally, no account needed."*

**Analyze & Generate (15s):** You can do this step-by-step using the buttons in each card, which shows how the engine works under the hood.

**Run Full LastLook (30s):** Alternatively, click **✨ Run full LastLook** at the top. The app sequences the entire pipeline automatically and drops you into the **Final Dashboard**. Point out the score (42/100 — "Not ready"), critical issues, and fix order in the beautiful bento layout.

**Explain (30s):** *"The sample answer is intentionally weak. LastLook caught that it's too short for a 60-second video, project names aren't explained, and the fellowship fit is generic. This is the kind of feedback students need in the last 15 minutes before they submit."*

**Architecture (15s):** *"Built with React, TypeScript, and Cloudflare Pages. AI provider chain: NVIDIA NIM, Cloudflare Workers AI fallback, mock for demo reliability. No database, no login — localStorage for memory, serverless functions for AI."*

**Total: ~2 minutes.**
