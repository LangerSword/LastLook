import { callLLM } from '../lib/callLLM';
import { ANALYZE_SYSTEM, GENERATE_SYSTEM, CHECK_SYSTEM } from '../lib/prompts';
import { verifyUserWithReason, isServerSupabaseConfigured } from '../lib/auth';
import { checkAndLogUsage } from '../lib/usage';

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    // Since this is a combined call, we check limit FIRST to avoid wasting AI calls if quota is exceeded.
    // However, we need provider/model to log. We can log after the first AI call.
    // Let's do a pre-check first.
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

    // 1. Analyze
    const { content: rawAnalyze, provider, model } = await callLLM(
      [
        { role: 'system', content: ANALYZE_SYSTEM },
        { role: 'user', content: `Analyze this application brief:\n\n${body.brief}` },
      ],
      context.env
    );

    let briefAnalysis;
    try {
      const cleanRaw = rawAnalyze.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      briefAnalysis = JSON.parse(cleanRaw);
    } catch {
      briefAnalysis = {
        explicitRequirements: ['Could not parse AI response'],
        impliedCriteria: [],
        submissionRisks: [],
        suggestedAngles: [],
        summary: rawAnalyze,
      };
    }

    // 2. Generate
    const genPrompt = `Memory: ${JSON.stringify(body.memory || {})}
  Brief Analysis: ${JSON.stringify(briefAnalysis)}
  Question: ${body.question}
  Program Name: ${body.programName || 'Unknown'}
  Application Type: ${body.applicationType || 'General'}
  Review Strictness: ${body.reviewStrictness || 'Balanced'}
  Tone: ${body.tone || 'Confident'}
  Target Length: ${body.targetLength || '150 words'}
  Deadline: ${body.deadline || 'Not provided'}

  Generate a tailored answer draft.`;

    const { content: rawGenerate } = await callLLM(
      [
        { role: 'system', content: GENERATE_SYSTEM },
        { role: 'user', content: genPrompt },
      ],
      context.env
    );

    let generatedAnswer;
    try {
      const cleanRaw = rawGenerate.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      generatedAnswer = JSON.parse(cleanRaw);
    } catch {
      generatedAnswer = {
        draft: rawGenerate,
        whyItWorks: ['Could not parse AI response'],
        customize: [],
      };
    }

    // 3. Check
    const finalAnswerText = body.finalAnswer?.trim() || generatedAnswer.draft;
    const wordCount = finalAnswerText.split(/\s+/).filter(Boolean).length;
    const speakingTimeSeconds = Math.round((wordCount / 145) * 60);

    const checkPrompt = `Brief Analysis: ${JSON.stringify(briefAnalysis)}
  Question: ${body.question}
  Target: ${body.target || 'general'}
  Program Name: ${body.programName || 'Unknown'}
  Application Type: ${body.applicationType || 'General'}
  Review Strictness: ${body.reviewStrictness || 'Balanced'}
  Deadline: ${body.deadline || 'Not provided'}

  Answer to review:
  ${finalAnswerText}

  Evaluate this answer and return a score with detailed feedback.`;

    const { content: rawCheck } = await callLLM(
      [
        { role: 'system', content: CHECK_SYSTEM },
        { role: 'user', content: checkPrompt },
      ],
      context.env
    );

    let readinessReport;
    try {
      const cleanRaw = rawCheck.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      readinessReport = JSON.parse(cleanRaw);
    } catch {
      readinessReport = {
        score: 0,
        status: "Error",
        criticalIssues: ["Could not parse AI response"],
        warnings: [],
        strongPoints: [],
        fixOrder: [],
      };
    }

    return new Response(JSON.stringify({
      briefAnalysis,
      generatedAnswer,
      readinessReport,
      wordCount,
      speakingTimeSeconds
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
