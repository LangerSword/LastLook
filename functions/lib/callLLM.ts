interface Env {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  CLOUDFLARE_AI_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_MODEL?: string;
  AI?: any; // Cloudflare Workers AI binding
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function callLLM(
  messages: Message[],
  env: Env,
  options: LLMOptions = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 1024 } = options;

  // --- Provider 1: NVIDIA NIM ---
  if (env.NVIDIA_API_KEY) {
    try {
      console.log('[callLLM] Trying NVIDIA NIM...');
      const baseUrl = env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
      const model = env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json() as any;
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          console.log('[callLLM] NVIDIA NIM responded successfully.');
          return content;
        }
      }
      console.error('[callLLM] NVIDIA NIM error:', res.status, await res.text().catch(() => ''));
    } catch (err) {
      console.error('[callLLM] NVIDIA NIM failed:', err);
    }
  }

  // --- Provider 2: Cloudflare Workers AI ---
  // Option A: AI binding (preferred when deployed on CF Pages/Workers)
  if (env.AI) {
    try {
      console.log('[callLLM] Trying Cloudflare Workers AI (binding)...');
      const model = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
      const result = await env.AI.run(model, {
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      const content = result?.response || result?.result?.response || '';
      if (content) {
        console.log('[callLLM] Cloudflare Workers AI (binding) responded successfully.');
        return content;
      }
    } catch (err) {
      console.error('[callLLM] Cloudflare Workers AI (binding) failed:', err);
      try {
        console.log('[callLLM] Trying Cloudflare secondary fallback (binding)...');
        const fallbackModel = '@cf/meta/llama-3.1-8b-instruct';
        const fallbackResult = await env.AI.run(fallbackModel, {
          messages,
          temperature,
          max_tokens: maxTokens,
        });
        const content = fallbackResult?.response || fallbackResult?.result?.response || '';
        if (content) {
          console.log('[callLLM] Cloudflare Workers AI secondary fallback (binding) responded successfully.');
          return content;
        }
      } catch (fallbackErr) {
        console.error('[callLLM] Cloudflare Workers AI secondary fallback (binding) failed:', fallbackErr);
      }
    }
  } else if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AI_TOKEN) {
    // Option B: Cloudflare Workers AI via REST API (only if no AI binding exists)
    try {
      console.log('[callLLM] Trying Cloudflare Workers AI (REST API)...');
      const model = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
      const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CLOUDFLARE_AI_TOKEN}`,
        },
        body: JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json() as any;
        const content = data.result?.response || '';
        if (content) {
          console.log('[callLLM] Cloudflare Workers AI (REST) responded successfully.');
          return content;
        }
      } else {
        console.error('[callLLM] Cloudflare Workers AI (REST) error:', res.status, await res.text().catch(() => ''));
        throw new Error('Cloudflare REST failed');
      }
    } catch (err) {
      console.error('[callLLM] Cloudflare Workers AI (REST) failed:', err);
      try {
        console.log('[callLLM] Trying Cloudflare secondary fallback (REST API)...');
        const fallbackModel = '@cf/meta/llama-3.1-8b-instruct';
        const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${fallbackModel}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.CLOUDFLARE_AI_TOKEN}`,
          },
          body: JSON.stringify({
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (res.ok) {
          const data = await res.json() as any;
          const content = data.result?.response || '';
          if (content) {
            console.log('[callLLM] Cloudflare Workers AI secondary fallback (REST) responded successfully.');
            return content;
          }
        } else {
          console.error('[callLLM] Cloudflare Workers AI secondary fallback (REST) error:', res.status, await res.text().catch(() => ''));
        }
      } catch (fallbackErr) {
        console.error('[callLLM] Cloudflare Workers AI secondary fallback (REST) failed:', fallbackErr);
      }
    }
  }

  // --- Provider 3: Mock fallback ---
  console.log('[callLLM] Using mock fallback.');
  return mockLLM(messages);
}

/**
 * Returns provider status for the health endpoint.
 */
export function getProviderStatus(env: Env) {
  return {
    nvidia: env.NVIDIA_API_KEY ? 'configured' as const : 'missing' as const,
    cloudflareBinding: env.AI ? 'configured' as const : 'missing' as const,
    cloudflareRest: (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AI_TOKEN) ? 'configured' as const : 'missing' as const,
    mock: 'available' as const,
  };
}

function mockLLM(messages: Message[]): string {
  const lastMsg = messages[messages.length - 1]?.content || '';

  if (lastMsg.includes('analyze') || lastMsg.includes('brief')) {
    return JSON.stringify({
      explicitRequirements: [
        "60-90 second intro video",
        "Tell about yourself and what you're building",
        "Explain why the fellowship is a good fit",
        "Ensure link is publicly accessible"
      ],
      impliedCriteria: [
        "Clarity of communication and presentation skills",
        "Genuine passion for building, not just credentials",
        "Specific alignment with fellowship values",
        "Self-awareness about growth areas"
      ],
      submissionRisks: [
        "Video too short or too long for 60-90 second window",
        "Mentioning project names without explaining what they do",
        "Generic fellowship fit statement without specifics",
        "Forgetting to make the link publicly accessible"
      ],
      suggestedAngles: [
        "Lead with a concrete builder identity and specific projects",
        "Show the thread connecting your projects to a larger mission",
        "Explain what you'd build or learn during the fellowship specifically",
        "End with a clear, memorable statement of intent"
      ],
      summary: "This brief asks for a short video introduction. The evaluator wants to see who you are as a builder, what excites you right now, and genuine fellowship-specific fit — not a resume recitation."
    });
  }

  if (lastMsg.includes('generate') || lastMsg.includes('draft')) {
    return JSON.stringify({
      draft: "I'm Lakshaya, a 19-year-old builder who thinks the best way to understand systems is to build them from scratch.\n\nRight now, I'm working on three projects that sit at the intersection of AI infrastructure and practical tools. Regenera is a forensic recovery system — it reconstructs deleted data by analyzing leftover traces and metadata, which taught me how file systems actually work under the hood. AgentMesh is infrastructure for AI agents — I'm building the connectors, APIs, and machine-readable workflows that let agents actually collaborate. And NetSieve is a real-time intrusion detection system with a cryptographic audit trail.\n\nThe common thread is that I like building tools that solve real problems — not wrappers, not demos, but systems that work. This fellowship feels like the right fit because I want to be around other builders who ship. I learn fastest by building alongside people who hold a high bar, and I want to take my projects from working prototypes to tools other people actually use.",
      whyItWorks: [
        "Opens with a clear builder identity, not a credential list",
        "Each project is explained by what it does, not just named",
        "Shows a connecting thread across all projects",
        "Fellowship fit is specific: 'builders who ship' and 'prototype to product'",
        "Appropriate length for 60-90 second spoken delivery"
      ],
      customize: [
        "Add a specific fellowship program name or value to strengthen fit",
        "Mention a specific mentor or alum you'd want to work with",
        "Adjust technical depth based on audience (more/less detail on Regenera/AgentMesh)"
      ]
    });
  }

  if (lastMsg.includes('check') || lastMsg.includes('review') || lastMsg.includes('score')) {
    return JSON.stringify({
      score: 42,
      status: "Not ready",
      criticalIssues: [
        "Too short for 60-90 second video (current: ~15 seconds at speaking pace)",
        "Project names (Regenera, AgentMesh) mentioned but not explained — evaluator won't know what they are",
        "No fellowship-specific fit — 'learn from smart people' is generic and applies to any program"
      ],
      warnings: [
        "Weak builder identity — 'interested in AI and systems' is passive, not active",
        "Missing a clear connecting thread between projects",
        "No mention of publicly accessible link requirement from the brief",
        "'Build faster' is vague — faster at what?"
      ],
      strongPoints: [
        "Mentions concrete project names (shows real work exists)",
        "Age establishes context as an early-career builder"
      ],
      fixOrder: [
        "Expand to 145-220 words for 60-90 second target",
        "Add 1-sentence explanation for each project",
        "Replace generic fellowship fit with specific program alignment",
        "Strengthen opening identity from 'interested in' to 'I build'",
        "Address the publicly accessible link requirement"
      ]
    });
  }

  return JSON.stringify({ error: "Unknown request type" });
}
