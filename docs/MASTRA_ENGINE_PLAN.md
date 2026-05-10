# Mastra Engine Plan — LastLook V2

## Decision: Mastra runs as a standalone Node.js service

The `functions/mastra/` directory conflicted with Cloudflare Pages' build system. Moved to `/mastra-engine/` as a standalone service.

Architecture:

```
Frontend (React) → Cloudflare Pages Functions → Mastra Engine (Node.js)
     │
     └──► /api/review/full    (Cloudflare Pages — gateway only)
                │
                └──► (optional) Mastra Engine service for AI stages
                           │ OR
                           └──► Direct to CF AI
```

The Cloudflare Pages Function (`functions/api/review/full.ts`) remains the primary review endpoint. When `NVIDIA_API_KEY` is available, it can optionally call the Mastra engine for staged AI review.

## Directory Structure

```
mastra-engine/                    # Standalone Node.js service
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # Export workflow runner + helpers
    ├── schemas/index.ts         # All Zod schemas
    ├── tools/                   # 11 deterministic tools
    ├── agents/                 # 11 AI agents (each own model call)
    ├── workflows/
    │   └── fullReviewWorkflow.ts  # 18-stage orchestrator
    ├── lib/
    │   ├── llm.ts              # LLM wrapper (NVIDIA/mock)
    │   └── hash.ts             # SHA-256 hashing
    └── simulate.ts             # Test simulation

functions/api/review/full.ts    # Cloudflare Pages Function
```

## Simulation

```bash
npm run simulate:review    # Runs the Mastra engine with test fixture
```

## Result Modes

| Mode | When |
|------|------|
| `ai_full` | Full AI workflow completed |
| `deterministic_fallback` | AI failed, fallback used |
| `mock_demo` | Mock mode (no API key) |
| `cached` | Cache hit |

## Deployment

- Cloudflare Pages: `npm run build && npx wrangler pages deploy dist`
- Mastra Engine: `cd mastra-engine && npm install && npm run simulate`