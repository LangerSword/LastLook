export interface LLMConfig {
  provider: 'nvidia' | 'cloudflare' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  seed?: number;
}

export interface LLMResult {
  content: string;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function callLLM(
  messages: LLMMessage[],
  config: LLMConfig,
  options: LLMOptions = {}
): Promise<LLMResult> {
  const { temperature = 0, maxTokens = 1024, topP = 1, seed } = options;
  const start = Date.now();

  if (config.provider === 'mock' || !config.apiKey) {
    return { ...mockLLM(messages), durationMs: Date.now() - start, success: true };
  }

  if (config.provider === 'nvidia' && config.apiKey) {
    try {
      const baseUrl = config.baseUrl || 'https://integrate.api.nvidia.com/v1';
      const model = config.model || 'meta/llama-3.1-8b-instruct';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature, top_p: topP, seed, max_tokens: maxTokens }),
      });
      if (res.ok) {
        const data = await res.json() as any;
        const content = data.choices?.[0]?.message?.content || '';
        return { content, provider: 'nvidia', model, durationMs: Date.now() - start, success: true };
      }
    } catch (err) {
      return { content: '', provider: 'nvidia', model: config.model || 'unknown', durationMs: Date.now() - start, success: false, error: String(err) };
    }
  }

  return { ...mockLLM(messages), durationMs: Date.now() - start, success: true };
}

function mockLLM(messages: LLMMessage[]): Omit<LLMResult, 'durationMs' | 'success'> {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const userMsg = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  const sysMsg = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');

  if (userMsg.includes('Brief:') || sysMsg.includes('brief analyzer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        explicitRequirements: [
          "60-90 second intro video",
          "Tell us about yourself and what you're building",
          "Explain why this fellowship is a good fit",
          "Ensure the link is publicly accessible",
        ],
        impliedCriteria: [
          "Clarity of communication and builder identity",
          "Genuine passion for building, not just credentials",
          "Specific alignment with fellowship values",
        ],
        submissionRisks: [
          "Video too short or too long for 60-90 second window",
          "Project names mentioned without explanation",
          "Generic fellowship fit statement without specifics",
          "Missing publicly accessible link",
        ],
        suggestedAngles: [
          "Lead with a concrete builder identity",
          "Explain each project in one sentence",
          "Connect your work to the fellowship's specific focus",
        ],
        summary: "Short intro video asking for builder identity, current projects, and fellowship fit. Evaluators want specific, human responses.",
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('requirement coverage reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 38,
        verdict: "Multiple requirements not addressed",
        specificFindings: [
          "The answer is only ~50 words (~21 seconds) — far too short for a 60-90 second video",
          "AgentMesh and Regenera are named but not explained — evaluators won't know what they do",
          "No publicly accessible link is included despite brief requiring it",
          "The fellowship fit is generic ('I want to learn from smart people') instead of specific",
        ],
        fixes: [
          "Expand to 145-220 words for the 60-90 second window",
          "Add a one-sentence explanation for each named project",
          "Include the required public link near the opening",
          "Replace generic fit with specific alignment between your current work and fellowship goals",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('opportunity fit reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 35,
        verdict: "Fit reads generic rather than specific",
        specificFindings: [
          "The answer says 'interested in AI and systems' — passive language instead of active building",
          "No specific connection between the fellowship's focus and the applicant's current trajectory",
          "The phrase 'I like making useful tools' could appear in any application",
          "No mention of what the fellowship specifically offers that matches the applicant's goals",
        ],
        fixes: [
          "Replace 'interested in' with 'I build' to show active builder identity",
          "Add one sentence connecting AI infrastructure work to the fellowship's specific offerings",
          "Name a specific aspect of the fellowship that aligns with current projects",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('clarity and structure reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 40,
        verdict: "Answer is too short for meaningful structure assessment",
        specificFindings: [
          "The answer has only a few sentences — insufficient for a 60-90 second video",
          "No clear opening hook to establish who the applicant is",
          "Projects are listed but not explained",
          "No natural flow from identity to projects to fit",
        ],
        fixes: [
          "Add a strong opening sentence: 'I'm [name], and I build AI infrastructure tools'",
          "Explain each project by what it does, not just its name",
          "End with a clear statement of fellowship fit",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('evidence reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 30,
        verdict: "Claims are not backed by concrete evidence",
        specificFindings: [
          "AgentMesh is named but its purpose is not explained",
          "Regenera is mentioned without describing what forensic recovery means",
          "No metrics, user counts, or outcomes mentioned for any project",
          "The builder identity claim has no supporting evidence",
        ],
        fixes: [
          "Add one sentence explaining AgentMesh: 'AgentMesh helps AI agents use APIs and MCPs instead of brittle browser clicking'",
          "Add one sentence for Regenera: 'Regenera reconstructs deleted data from leftover traces and metadata'",
          "Include at least one concrete outcome or metric",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('length and format reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 15,
        verdict: "Length is severely below target for 60-90 second video",
        specificFindings: [
          "Current: ~50 words (~21 seconds at 145 wpm)",
          "Target: 145-220 words (60-90 seconds at 145 wpm)",
          "Answer is approximately 29% of the minimum target length",
        ],
        fixes: [
          "Expand by 100-170 words",
          "Add one-sentence explanations for each project",
          "Include the required public link",
          "Add a specific fellowship-fit sentence",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('voice and tone reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 55,
        verdict: "Voice sounds human but lacks builder confidence",
        specificFindings: [
          "The phrase 'interested in AI and systems' is passive — consider 'I build AI and systems tools'",
          "The answer lacks the confident, direct builder tone matching saved preference",
          "No personal perspective or specific insight is shared",
        ],
        fixes: [
          "Change 'interested in' to 'I build'",
          "Add one specific detail that only this applicant could share",
          "Match the saved preferred tone: 'confident, direct, builder-like'",
        ],
      }),
    };
  }

  if (userMsg.includes('Context:') && sysMsg.includes('risk reviewer')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        score: 28,
        verdict: "High submission risk due to missing requirements",
        specificFindings: [
          "MISSING: Required public link — brief explicitly asks for this",
          "MISSING: Sufficient length for 60-90 second video",
          "MISSING: Project explanations for named projects",
          "RISK: Generic fit statement could disqualify on specific alignment evaluation",
        ],
        fixes: [
          "URGENT: Add the required public link",
          "Expand length to meet 60-90 second target",
          "Add project explanations on first mention",
          "Replace generic fit with specific alignment",
        ],
      }),
    };
  }

  if (sysMsg.includes('next-best-edit advisor')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        title: "Explain AgentMesh in one sentence",
        reason: "AgentMesh is the first project named but the evaluator has no idea what it does. This is the highest-impact fix because it simultaneously demonstrates active building, fills length, and shows specificity.",
        suggestedText: "Change 'I'm building Regenera and AgentMesh' to 'I'm building Regenera, a forensic recovery system that reconstructs deleted data from traces, and AgentMesh, infrastructure that helps AI agents use APIs and MCPs instead of brittle browser automation.'",
      }),
    };
  }

  if (sysMsg.includes('fix plan advisor')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify([
        { step: 1, title: "Add the required public link", why: "The brief explicitly requires a publicly accessible link. Omitting it can disqualify the submission.", effort: "1 min", impact: "high", suggestedText: "Paste the link near the opening sentence: https://..." },
        { step: 2, title: "Explain AgentMesh in one sentence", why: 'AgentMesh is named but the evaluator does not know what it does. One sentence about helping AI agents use APIs and MCPs makes it concrete.', effort: "1 min", impact: "high", suggestedText: 'Change to: "AgentMesh — infrastructure that helps AI agents use APIs, MCPs, and machine-readable workflows instead of brittle browser clicking."' },
        { step: 3, title: "Explain Regenera in one sentence", why: "Regenera is named but unexplained. One sentence about forensic data recovery makes it real.", effort: "1 min", impact: "high", suggestedText: 'Change to: "Regenera — a forensic recovery system that reconstructs deleted data from leftover traces and metadata."' },
        { step: 4, title: "Replace generic fit statement", why: '"I want to learn from smart people and build faster" applies to any fellowship. Connect your current AI infrastructure work to the fellowship\'s specific value.', effort: "2 min", impact: "medium", suggestedText: "Replace with: 'This fellowship fits my work because I want to go from working prototypes to production tools that other builders actually use.'" },
        { step: 5, title: "Expand to 145-220 words", why: "Current ~50 words is too short for 60-90 second video. Adding project explanations fills length naturally.", effort: "2 min", impact: "medium", suggestedText: "Expand by adding project explanations and one concrete outcome or metric." },
      ]),
    };
  }

  if (sysMsg.includes('improved answer generator')) {
    return {
      provider: 'mock',
      model: 'mock',
      content: JSON.stringify({
        originalAnswer: "I'm Lakshaya, a 19-year-old builder interested in AI and systems. I'm building Regenera and AgentMesh, and I like making useful tools. This fellowship seems exciting because I want to learn from smart people and build faster. [Add link]",
        improvedAnswer: "I'm Lakshaya, a 19-year-old builder who thinks the best way to understand systems is to build them from scratch.\n\nRight now I'm working on three projects that sit at the intersection of AI infrastructure and practical tools. Regenera is a forensic recovery system — it reconstructs deleted data by analyzing leftover traces and metadata, which taught me how file systems work under the hood. AgentMesh is infrastructure for AI agents — I'm building the APIs, MCPs, and machine-readable workflows that let agents collaborate without brittle browser automation. NetSieve is a real-time network intrusion detection system with a cryptographic audit trail.\n\nThe thread connecting everything I build: tools that solve real problems through systems thinking. This fellowship fits because I want to go from working prototypes to production tools that other builders actually use, and I want to do that alongside people who hold a high bar for shipping. Link: https://your-public-link.com",
        whatChanged: [
          "Added strong opening sentence establishing builder identity",
          "Explained Regenera in one sentence (forensic recovery system)",
          "Explained AgentMesh in one sentence (AI agent infrastructure via APIs/MCPs)",
          "Mentioned NetSieve with its cryptographic audit trail",
          "Replaced generic fit with specific alignment: 'prototypes to production tools'",
          "Added required public link",
          "Expanded from ~50 to ~190 words (fits 60-90 second target)",
        ],
        whyItIsBetter: [
          "Each project is now explained on first mention — evaluators can follow along",
          "The connecting thread ('tools that solve real problems through systems thinking') gives coherence",
          "Fellowship fit is specific: 'prototypes to production tools' and 'high bar for shipping'",
          "Length fits the 60-90 second window for verbal delivery",
          "Builder identity is active ('I think', 'I'm building') not passive ('interested in')",
        ],
        wordCount: 190,
        speakingTimeSeconds: 79,
      }),
    };
  }

  return { provider: 'mock', model: 'mock', content: JSON.stringify({ error: 'unknown request type' }) };
}

export function getProviderStatus(config: LLMConfig): Record<string, string> {
  return {
    nvidia: config.provider === 'nvidia' && config.apiKey ? 'configured' : 'missing',
    mock: 'available',
  };
}