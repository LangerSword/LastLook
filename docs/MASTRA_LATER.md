# Mastra Later

Mastra (https://mastra.ai) is a TypeScript AI framework that provides:

- **Formal tools** - Structured tool definitions with schemas
- **Workflows** - Orchestration of multi-step AI processes
- **Evals** - Evaluation frameworks for AI outputs
- **Observability** - Built-in tracing and monitoring
- **Deployment** - Easy deployment to various targets

## Why V2 Doesn't Use Mastra Yet

LastLook V2 currently uses a local deterministic tool-based reviewer engine:

```
src/engine/tools/    - Pure functions returning structured data
src/engine/reviewers/ - Composable reviewer agents using allowed tools
src/engine/workflow/  - Deterministic code orchestration
```

This architecture was chosen because:

1. **Stability** - Same input always produces same output
2. **Debugging** - Easy to trace each tool's contribution
3. **No AI dependency** - Core scoring doesn't require LLM
4. **Fast** - Pure JS execution, no API calls needed

## When Mastra Might Be Useful

Mastra could enhance LastLook when:

1. **AI-assisted synthesis** - Using LLMs to explain and synthesize tool outputs
2. **Complex multi-agent workflows** - When simple orchestration isn't enough
3. **Evals framework** - Formal evaluation of AI-assisted improvements
4. **Production observability** - When deploying to production at scale
5. **Agent memory** - Maintaining conversation context across sessions

## Migration Path

If Mastra is added later, the migration would involve:

1. Wrap existing tools as Mastra tools with JSON schemas
2. Convert reviewer agents to Mastra agents
3. Keep deterministic scoring as-is (it's working well)
4. Add LLM-based synthesis as an enhancement layer
5. Keep caching and deterministic fallback logic

## Current State

V2 is feature-complete for deterministic review. AI enhancement is optional.

```
npm run simulate:review    # Prove deterministic behavior
npm run simulate:determinism # Verify same input = same output
```

Mastra will be reconsidered when:
- More complex multi-step AI workflows are needed
- Formal eval framework is required
- Production deployment needs better observability