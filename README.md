# LastLook

**The final check before you submit.**

LastLook helps students applying to fellowships, hackathons, internships, startup programs, and grants. Save a lightweight personal memory, paste an application brief, generate tailored answers, and run a final pre-submit check — all in one flow.

> **New here?** Read the [WALKTHROUGH.md](WALKTHROUGH.md) for a step-by-step guide and 2-minute demo instructions.

## Why

Every competitive application gets rushed at the end. Students submit without checking if their video script is long enough, if their project names are explained, or if their fellowship fit is actually specific. LastLook is built for the last 15 minutes before you hit submit.

## Features

- **Memory Panel** — Save your bio, projects, achievements, and tone. Persisted in localStorage.
- **Brief Analyzer** — Paste an application brief. Get explicit requirements, implied criteria, submission risks, and suggested answer angles.
- **Answer Generator** — Generate tailored answers using your memory and brief analysis. Choose tone and target length.
- **LastLook Checker** — Paste your final answer. Get a readiness score (0-100), critical issues, warnings, strong points, and a prioritized fix order.
- **Persistent Dashboard** — Integrated with Supabase Auth to save and review past submission checks across devices.
- **Local Demo Mode** — Works without an account. Falls back to `localStorage` seamlessly.
- **Robust AI Parsing** — Built-in frontend normalization guarantees structured UI components (no raw JSON text leaks).
- **Mock Fallback** — Works without AI API keys for reliable demos.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Cloudflare Pages + Pages Functions
- Supabase (PostgreSQL + Auth)
- AI provider chain: NVIDIA NIM → Cloudflare Workers AI → Mock fallback

## Environment Variables

LastLook uses two sets of environment variables: **Frontend Build Variables** and **Server Runtime Variables**.

### Frontend Build Variables
Set these in your local `.env.local` or your build environment:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Server Runtime Variables & Secrets
Set these in Cloudflare Pages dashboard under **Settings → Environment Variables**:

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `SUPABASE_URL` | For Quotas | — | Matches VITE_SUPABASE_URL |
| `SUPABASE_ANON_KEY` | For Quotas | — | Matches VITE_SUPABASE_ANON_KEY |
| `NVIDIA_API_KEY` | For NIM | — | Treat as a **Secret** |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | — |
| `NVIDIA_MODEL` | No | `meta/llama-3.1-8b-instruct` | — |
| `CLOUDFLARE_ACCOUNT_ID` | For CF AI | — | — |
| `CLOUDFLARE_AI_TOKEN` | For CF AI | — | Treat as a **Secret** |
| `CLOUDFLARE_AI_MODEL` | No | `@cf/meta/llama-3.1-8b-instruct` | — |
| `ADMIN_EMAILS` | No | — | Comma-separated list for quota overrides |

**AI Binding:** If deploying on Cloudflare Pages with a Workers AI binding named `AI`, it will be used automatically (no REST credentials needed).

**Provider order:** NVIDIA NIM → Cloudflare Workers AI → Mock fallback. Without any API keys, the app uses built-in mock responses for demo reliability.

## Supabase Authentication Setup

LastLook uses Supabase to sync review sessions across devices.

Set these in your `.env.local`:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Redirect URLs:** In your Supabase Dashboard under **Authentication → URL Configuration**, set the Site URL and add these Redirect URLs so magic links and password resets work correctly:
- Local: `http://localhost:5173/auth/callback` or `http://localhost:8788/auth/callback`
- Local Reset: `http://localhost:5173/reset-password` or `http://localhost:8788/reset-password`
- Production: `https://YOUR_DOMAIN/auth/callback`
- Production Reset: `https://YOUR_DOMAIN/reset-password`

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full database schema instructions.

## Cloudflare Pages Deployment

1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
4. Add environment variables (see above)
5. Deploy

The `functions/` directory is automatically detected by Cloudflare Pages for serverless API routes.

## Local Development

For frontend-only hot reload (API calls will fail if Wrangler is not running):
```bash
npm install
npm run dev
```

For full app with Cloudflare Pages Functions (Frontend + API):
```bash
npm run pages:dev
```
Then open: `http://localhost:8788`

Do not test API keys through `http://localhost:5173` unless Wrangler is also running on port 8788.

### Local Environment Variables
Local Cloudflare Function secrets should go in `.dev.vars` (this file is gitignored):

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAILS=your@email.com
NVIDIA_API_KEY=your_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_AI_TOKEN=your_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct-fp8-fast
```

## What Was Intentionally Cut

- Application tracker — scope creep
- Resume parser — not the core value
- File uploads — not needed for text-based applications
- Chatbot interface — guided flow is more useful

## Future Work

- Export answers as formatted documents
- History of past checks with score trends
- Collaborative review (share a link for feedback)
- More AI providers (OpenAI, Anthropic)
- Browser extension for inline checking on application forms

## License

MIT
