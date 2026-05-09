import { verifyUserWithReason } from '../../lib/auth';
import { checkAndLogUsage } from '../../lib/usage';
import { buildFullReviewPacket, DeterministicReviewInput, type BriefAnalysis, type GeneratedAnswer } from '../../lib/reviewEngine';
import { callLLM } from '../../lib/callLLM';

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

const ANALYZE_SYSTEM = `You are an application brief analyzer for student applications.

Given an application brief, analyze it and return a JSON object with these exact fields:
- explicitRequirements: string[] — what the brief explicitly asks for
- impliedCriteria: string[] — what evaluators are likely looking for beyond the stated requirements
- submissionRisks: string[] — common mistakes or things applicants miss

Return ONLY valid JSON. No markdown, no explanation.`;

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
  }

  return {
    explicitRequirements: explicitRequirements as any,
    impliedCriteria: impliedCriteria as any,
    submissionRisks: submissionRisks as any,
    suggestedAngles: [],
    summary: 'Analyzed: ' + brief.slice(0, 80),
  };
}

function buildFallbackGeneratedAnswer(answer: string, brief: BriefAnalysis): GeneratedAnswer {
  return {
    draft: answer || '',
    whyItWorks: ['Answer provided by user'],
    customize: ['Add a clear opening sentence'],
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const result = await verifyUserWithReason(context.request, context.env);
    
    if (result.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        error: 'supabase_server_not_configured',
        message: 'Server auth is not configured.'
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
    if (preCheckError) return preCheckError;

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

    let briefAnalysis: BriefAnalysis;
    let generatedAnswer: GeneratedAnswer | null = null;
    let aiError: string | null = null;

    try {
      const { content } = await callLLM([
        { role: 'system', content: ANALYZE_SYSTEM },
        { role: 'user', content: `Analyze:\n${briefText}` },
      ], context.env);
      briefAnalysis = parseLLMResponse<BriefAnalysis>(content, buildFallbackBriefAnalysis(briefText));
    } catch (err) {
      aiError = `Brief analysis failed: ${err}`;
      briefAnalysis = buildFallbackBriefAnalysis(briefText);
    }

    if (!userAnswer) {
      try {
        const genPrompt = `Memory: ${JSON.stringify(memory || {})}\nBrief: ${JSON.stringify(briefAnalysis)}\nQuestion: ${question}\nTone: ${body.tone || 'Confident'}\nTarget: ${targetLength}`;
        const { content } = await callLLM([
          { role: 'system', content: 'Generate a short answer draft. Return JSON with draft, whyItWorks, customize.' },
          { role: 'user', content: genPrompt },
        ], context.env);
        generatedAnswer = parseLLMResponse<GeneratedAnswer>(content, buildFallbackGeneratedAnswer('', briefAnalysis));
      } catch (err) {
        aiError = aiError ? `${aiError}; Generation failed: ${err}` : `Generation failed: ${err}`;
        generatedAnswer = buildFallbackGeneratedAnswer('', briefAnalysis);
      }
    }

    const deterministicInput: DeterministicReviewInput = {
      briefAnalysis,
      answer: userAnswer || generatedAnswer?.draft || '',
      question,
      memory,
      applicationType,
      reviewStrictness: reviewStrictness as any,
      programName,
      deadline,
      generatedAnswer,
      targetLength,
    };

    const packet = buildFullReviewPacket(deterministicInput);

    if (aiError) {
      packet.readinessReport.warnings.push(`AI enhancement had issues: ${aiError}`);
    }

    return new Response(JSON.stringify({
      success: true,
      reviewId: packet.reviewId,
      programName: packet.programName,
      applicationType: packet.applicationType,
      deadlineMode: packet.deadlineMode,
      briefAnalysis: packet.briefAnalysis,
      evidenceBank: packet.evidenceBank,
      requirementCoverage: packet.requirementCoverage,
      reviewerPanel: packet.reviewerPanel,
      readinessReport: packet.readinessReport,
      nextBestEdit: packet.nextBestEdit,
      fixPlan: packet.fixPlan,
      improvedApplication: packet.improvedApplication,
      applicationPacket: packet.applicationPacket,
      wordCount: packet.readinessReport.wordCount,
      speakingTimeSeconds: packet.readinessReport.speakingTimeSeconds,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[api/review/full] internal error:', err);
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