# LastLook

**The final check before you submit.**

LastLook is a readiness workspace for completing important applications — fellowships, hackathons, internships, startup programs, and grants. Save a lightweight personal memory, paste an application brief, generate tailored answers, and run a final pre-submit check.

> **New here?** Read the [WALKTHROUGH.md](WALKTHROUGH.md) for a step-by-step guide and 2-minute demo instructions.

## Why

Every competitive application gets rushed at the end. Students submit without checking if their video script is long enough, if their project names are explained, or if their fellowship fit is actually specific. LastLook is built for the last 15 minutes before you hit submit.

## Features

- **Memory Panel** — Save your bio, projects, achievements, and tone. Persisted in localStorage.
- **Brief Analyzer** — Paste an application brief. Get explicit requirements, implied criteria, submission risks, and suggested answer angles.
- **Answer Generator** — Generate tailored answers using your memory and brief analysis. Choose tone and target length.
- **LastLook Checker** — Paste your final answer. Get a readiness score (0-100), critical issues, warnings, strong points, and a prioritized fix order.
- **Full Application Builder** — Paste multiple questions, generate all answers, build a polished application packet.
- **Application Packet** — Final output combining all answers, readiness score, requirements checklist, and submission readiness.
- **Answer Library** — Save reusable snippets (personal intro, project descriptions, closing lines) for fast answer generation.
- **Link Vault** — Store and manage your project links, GitHub, LinkedIn, portfolio, and more.
- **Deadline Mode** — Get urgency-aware feedback based on time remaining.
- **Smart Rewrite Controls** — Targeted rewriting (shorten, specialize, strengthen fit) without regenerating from scratch.
- **Video Script Mode** — Convert answers into teleprompter-ready scripts with pacing cues.
- **Security Features** — 2FA/MFA support, password strength enforcement, BYOK key storage in session only.
- **Persistent Dashboard** — Integrated with Supabase Auth to save and review past submission checks across devices.
- **Local Demo Mode** — Works without an account. Falls back to `localStorage` seamlessly.
- **Robust AI Parsing** — Built-in frontend normalization guarantees structured UI (no raw JSON leaks).
- **AI Provider Chain** — NVIDIA NIM → Cloudflare Workers AI → Mock fallback for demo reliability.

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
| `CLOUDFLARE_AI_MODEL` | No | `@cf/meta/llama-3.1-8b-instruct-fp8-fast` | — |
| `ADMIN_EMAILS` | No | — | Comma-separated list for quota overrides |

**AI Binding:** If deploying on Cloudflare Pages with a Workers AI binding named `AI`, it will be used automatically (no REST credentials needed).

**Provider order:** NVIDIA NIM → Cloudflare Workers AI → Mock fallback. Without any API keys, the app uses built-in mock responses for demo reliability.

## Supabase Authentication Setup

LastLook uses Supabase for authentication, data sync, and usage limits.

Set these in your `.env.local`:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Redirect URLs
In your Supabase Dashboard under **Authentication → URL Configuration**, set the Site URL and add these Redirect URLs:

#### Auth Callback URLs
- `http://localhost:5173/auth/callback`
- `http://localhost:8788/auth/callback`
- `https://YOUR_PAGES_URL.pages.dev/auth/callback`
- `https://YOUR_CUSTOM_DOMAIN/auth/callback`

#### Password Reset URLs
- `http://localhost:5173/reset-password`
- `http://localhost:8788/reset-password`
- `https://YOUR_PAGES_URL.pages.dev/reset-password`
- `https://YOUR_CUSTOM_DOMAIN/reset-password`

#### MFA Challenge URLs
- `http://localhost:5173/mfa-challenge`
- `http://localhost:8788/mfa-challenge`
- `https://YOUR_PAGES_URL.pages.dev/mfa-challenge`
- `https://YOUR_CUSTOM_DOMAIN/mfa-challenge`

### Security Notifications
Configure email notifications for security events under **Authentication → Emails → Email Templates → Security Notifications**:
- **Password changed** — sent when user updates their password
- **Email address changed** — sent when user changes their email
- **MFA method added** — sent when user enables 2FA/TOTP
- **MFA method removed** — sent when user disables 2FA/TOTP

Enable any or all of these to keep users informed of account security changes.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full database schema instructions.

## Security

LastLook takes security seriously:

- **API Keys Never Stored** — BYOK keys are stored only in browser `sessionStorage`, never sent to LastLook servers, and cleared on sign out.
- **MFA/2FA Support** — Users can enable TOTP authenticator-based 2FA via Settings → Security.
- **Password Strength Enforcement** — All password forms enforce minimum strength (8+ chars, uppercase, lowercase, number, symbol, no common passwords).
- **Security Notifications** — Supabase sends automatic email notifications for password changes, email changes, and MFA changes.
- **Session Management** — Users can sign out everywhere and delete saved data.
- **No Secrets in Code** — All API keys use environment variables, treated as secrets in Cloudflare Pages.

## Review Limits

To prevent abuse, LastLook enforces usage limits:
- **5 full reviews per day** (analyze + generate + check pipeline)
- **15 individual actions per day** (any single AI call)

Authenticated users share these limits across devices. Admin emails bypass limits. Demo mode tracks limits locally.

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
- PDF export — out of scope for launch

## Future Work

- Export answers as formatted documents
- Collaborative review (share a link for feedback)
- More AI providers (OpenAI, Anthropic)
- Browser extension for inline checking on application forms
- Custom branded email templates for security notifications

## License

MIT
