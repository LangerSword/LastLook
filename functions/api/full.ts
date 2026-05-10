import { callLLM } from '../lib/callLLM';
import { verifyUserWithReason } from '../lib/auth';
import { checkAndLogUsage } from '../lib/usage';
import { buildFullReviewPacket, DeterministicReviewInput, type BriefAnalysis, type GeneratedAnswer } from '../lib/reviewEngine';

interface Env {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  CLOUDFLARE_AI_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_MODEL?: string;
  AI?: any;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ADMIN_EMAILS?: string;
}

interface StageTiming {
  stage: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'fallback' | 'skipped';
  error?: string;
}

const ANALYZE_SYSTEM = `You are an application brief analyzer for student applications.

Given an application brief, analyze it and return a JSON object with these exact fields:
- explicitRequirements: string[] — what the brief explicitly asks for
- impliedCriteria: string[] — what evaluators are likely looking for beyond the stated requirements
- submissionRisks: string[] — common mistakes or things applicants miss
- suggestedAngles: string[] — strategic approaches to answering well
- summary: string — a 1-2 sentence summary of what the evaluator actually wants

Rules:
- Every item must reference the actual brief, not generic application advice.
- Prefer exact nouns, deliverables, constraints, and evaluator language from the brief.
- If the brief mentions a deliverable (video, link, portfolio, form, essay length), include it explicitly.
- Extract hidden requirements only when they are clearly implied by the brief text.
- Do not invent evaluation criteria that are not grounded in the brief.

Return ONLY valid JSON. No markdown, no explanation. Do not wrap the response in json code fences.`;

const GENERATE_SYSTEM = `You are an application answer generator.

Given a user's memory (bio, projects, achievements), a brief analysis, a question, a tone preference, and a target length, generate a tailored answer draft.

Rules:
- Include concrete details from memory, answer library, or brief whenever possible.
- If a project name appears, explain it in one short line the first time it is mentioned.
- Avoid generic claims like "passionate" or "exciting" without evidence.
- Make each sentence carry a unique purpose.
- If a public link is required, include a visible placeholder such as [link] near the first mention.
- Match the target length closely and preserve a human, non-robotic voice.

Return a JSON object with these exact fields:
- draft: string — the generated answer text
- whyItWorks: string[] — 3-5 reasons why this draft is effective
- customize: string[] — 2-3 suggestions for further customization

For target lengths:
- "100 words": ~100 words
- "150 words": ~150 words
- "200 words": ~200 words
- "60-90 sec video": ~145-220 words (speaking pace is ~145 words/minute)

Return ONLY valid JSON. No markdown, no explanation. Do not wrap the response in json code fences.`;

function parseLLMResponse<T>(raw: string, fallback: T): T {
  try {
    const cleanRaw = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
    return JSON.parse(cleanRaw) as T;
  } catch {
    return fallback;
  }
}

function buildFallbackBriefAnalysis(brief: string): BriefAnalysis {
  const explicitRequirements: string[] = [];
  const impliedCriteria: string[] = [];
  const submissionRisks: string[] = [];
  const suggestedAngles: string[] = [];

  if (/link|url|website|portfolio|github/i.test(brief)) {
    explicitRequirements.push('Public link must be included');
    submissionRisks.push('Missing required link can disqualify submission');
  }
  if (/video|pitch|60.*second|90.*second/i.test(brief)) {
    explicitRequirements.push('60-90 second video');
    impliedCriteria.push('Clear verbal delivery');
  }
  if (/why.*fit|fit.*fellowship|why.*this/i.test(brief)) {
    explicitRequirements.push('Explain why this opportunity fits you');
    impliedCriteria.push('Show specific alignment with program values');
  }

  return {
    explicitRequirements,
    impliedCriteria,
    submissionRisks,
    suggestedAngles,
    summary: 'Analyzed fallback: ' + brief.slice(0, 100),
  };
}

function buildFallbackGeneratedAnswer(answer: string, brief: BriefAnalysis): GeneratedAnswer {
  return {
    draft: answer || '',
    whyItWorks: [
      'Answer provided by user',
      'Includes specific project details from memory',
    ],
    customize: [
      'Add a clear opening sentence stating who you are',
      'Connect your current work to the opportunity',
    ],
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const overallStart = Date.now();
  const timings: StageTiming[] = [];

  function recordTiming(stage: string, startTime: number, status: StageTiming['status'], error?: string) {
    timings.push({
      stage,
      startTime,
      endTime: Date.now(),
      durationMs: Date.now() - startTime,
      status,
      error,
    });
  }

  try {
    const result = await verifyUserWithReason(context.request, context.env);
    
    if (result.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        error: 'supabase_server_not_configured',
        message: 'Server auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (result.error === 'no_token' || result.error === 'invalid_token') {
      return new Response(JSON.stringify({
        error: 'auth_required',
        message: 'Sign in to run a real LastLook review.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const user = result.user;

    const preCheckError = await checkAndLogUsage(user, 'full_review', context.env, 'pending', 'pending');
    if (preCheckError) {
      return preCheckError;
    }

    const body = await context.request.json() as any;

    if (!body.brief || !body.question) {
      return new Response(JSON.stringify({ error: 'brief and question are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const briefText = body.brief as string;
    const question = body.question as string;
    const memory = body.memory || null;
    const programName = body.programName || 'Untitled opportunity';
    const applicationType = (body.applicationType || 'Other') as any;
    const reviewStrictness = body.reviewStrictness || 'Balanced';
    const targetLength = body.targetLength || '150 words';
    const deadline = body.deadline || undefined;
    const userAnswer = body.finalAnswer?.trim() || null;
    const inputHash = body.inputHash || null;
    const seed = inputHash ? parseInt(inputHash.slice(0, 8), 16) % 2147483647 : undefined;

    const deterministicOptions = {
      temperature: 0,
      topP: 1,
      seed,
    };

    let briefAnalysis: BriefAnalysis;
    let generatedAnswer: GeneratedAnswer | null = null;
    let aiError: string | null = null;
    let providerUsed = 'none';
    let fallbackUsed = false;
    let providerResponseTime = 0;

    // Stage 1: parseBrief
    let stageStart = Date.now();
    try {
      const { content, provider, model } = await callLLM(
        [
          { role: 'system', content: ANALYZE_SYSTEM },
          { role: 'user', content: `Analyze this application brief:\n\n${briefText}` },
        ],
        context.env,
        deterministicOptions
      );
      providerUsed = provider;
      providerResponseTime = Date.now() - stageStart;
      console.log(`[parseBrief] provider=${provider}, model=${model}, duration=${providerResponseTime}ms`);
      recordTiming('parseBrief', stageStart, 'completed');
      briefAnalysis = parseLLMResponse<BriefAnalysis>(content, buildFallbackBriefAnalysis(briefText));
    } catch (err) {
      aiError = `Brief analysis failed: ${err}`;
      fallbackUsed = true;
      briefAnalysis = buildFallbackBriefAnalysis(briefText);
      recordTiming('parseBrief', stageStart, 'fallback', String(err));
      console.error('[parseBrief] FALLBACK:', err);
    }

    // Stage 2: generateAnswer (if no user answer provided)
    if (!userAnswer) {
      stageStart = Date.now();
      try {
        const genPrompt = `Memory: ${JSON.stringify(memory || {})}
Brief Analysis: ${JSON.stringify(briefAnalysis)}
Question: ${question}
Program Name: ${programName}
Application Type: ${applicationType}
Review Strictness: ${reviewStrictness}
Tone: ${body.tone || 'Confident'}
Target Length: ${targetLength}
Deadline: ${deadline || 'Not provided'}

Generate a tailored answer draft.`;

        const { content, provider, model } = await callLLM(
          [
            { role: 'system', content: GENERATE_SYSTEM },
            { role: 'user', content: genPrompt },
          ],
          context.env,
          deterministicOptions
        );
        if (providerUsed === 'none') {
          providerUsed = provider;
        }
        providerResponseTime += Date.now() - stageStart;
        console.log(`[generateAnswer] provider=${provider}, model=${model}, duration=${Date.now() - stageStart}ms`);
        recordTiming('generateAnswer', stageStart, 'completed');
        generatedAnswer = parseLLMResponse<GeneratedAnswer>(content, buildFallbackGeneratedAnswer('', briefAnalysis));
      } catch (err) {
        aiError = aiError ? `${aiError}; Generation failed: ${err}` : `Generation failed: ${err}`;
        fallbackUsed = true;
        generatedAnswer = buildFallbackGeneratedAnswer('', briefAnalysis);
        recordTiming('generateAnswer', stageStart, 'fallback', String(err));
        console.error('[generateAnswer] FALLBACK:', err);
      }
    } else {
      recordTiming('generateAnswer', Date.now(), 'skipped');
    }

    // Stage 3: buildFullReviewPacket
    stageStart = Date.now();
    const deterministicInput: DeterministicReviewInput = {
      briefAnalysis,
      answer: userAnswer || generatedAnswer?.draft || '',
      question,
      memory,
      applicationType,
      reviewStrictness,
      programName,
      deadline,
      generatedAnswer,
      targetLength,
    };

    const fullReviewPacket = buildFullReviewPacket(deterministicInput);
    recordTiming('buildFullReviewPacket', stageStart, 'completed');

    if (aiError) {
      fullReviewPacket.readinessReport.warnings.push(`AI enhancement had issues: ${aiError}`);
      fullReviewPacket.readinessReport.warnings.push(`Note: Using deterministic fallback because AI failed.`);
    }

    const wordCount = fullReviewPacket.readinessReport.wordCount;
    const speakingTimeSeconds = fullReviewPacket.readinessReport.speakingTimeSeconds;

    const totalDuration = Date.now() - overallStart;

    console.log(`[FullReview] totalDuration=${totalDuration}ms, provider=${providerUsed}, fallbackUsed=${fallbackUsed}`);

    return new Response(JSON.stringify({
      success: true,
      reviewId: fullReviewPacket.reviewId,
      programName: fullReviewPacket.programName,
      applicationType: fullReviewPacket.applicationType,
      deadlineMode: fullReviewPacket.deadlineMode,
      briefAnalysis: fullReviewPacket.briefAnalysis,
      evidenceBank: fullReviewPacket.evidenceBank,
      requirementCoverage: fullReviewPacket.requirementCoverage,
      reviewerPanel: fullReviewPacket.reviewerPanel,
      readinessReport: fullReviewPacket.readinessReport,
      nextBestEdit: fullReviewPacket.nextBestEdit,
      fixPlan: fullReviewPacket.fixPlan,
      improvedApplication: fullReviewPacket.improvedApplication,
      applicationPacket: fullReviewPacket.applicationPacket,
      generatedAnswer,
      wordCount,
      speakingTimeSeconds,
      debug: {
        engineVersion: 'v2',
        inputHash,
        cacheHit: false,
        providerUsed,
        fallbackUsed,
        temperature: deterministicOptions.temperature,
        topP: deterministicOptions.topP,
        providerResponseTimeMs: providerResponseTime,
        totalDurationMs: totalDuration,
        stagesCompleted: timings.map(t => t.stage),
        timings,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[api/full] internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};