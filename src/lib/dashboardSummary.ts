import type { ApplicationMemory, BriefAnalysis, CheckResult, GeneratedAnswer } from './types';

export interface DashboardSummary {
  verdict: string;
  topFix: string;
  nextBestEdit: string;
  evaluatorRisk: string;
  opportunityFitScore?: number;
  applicationType?: string;
  reviewStrictness?: string;
  programName?: string;
  deadline?: string;
  fitSnapshot: {
    completeness: number;
    specificity: number;
    clarity: number;
    lengthFit: number;
  };
  // Legacy field for older sessions
  nextAction?: string;
}

interface SummaryInput {
  memory?: ApplicationMemory | null;
  briefAnalysis: BriefAnalysis;
  generatedAnswer?: GeneratedAnswer | null;
  readinessReport: CheckResult;
  question?: string;
  finalAnswer?: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function buildTailoredDashboardSummary({
  memory,
  briefAnalysis,
  generatedAnswer,
  readinessReport,
  question,
  finalAnswer,
}: SummaryInput): DashboardSummary {
  const report = readinessReport;
  const score = report.score;
  const critical = report.criticalIssues || [];
  const warnings = report.warnings || [];
  const explicit = briefAnalysis.explicitRequirements || [];

  const answerText = (finalAnswer || generatedAnswer?.draft || '').trim();
  const lowerAnswer = answerText.toLowerCase();
  const wordCount = report.wordCount || answerText.split(/\s+/).filter(Boolean).length;
  const speakingSeconds = report.speakingTimeSeconds || Math.round((wordCount / 145) * 60);

  const requiresVideo = [...explicit, question || '']
    .filter(Boolean)
    .some((r) => /video|second|minute|pitch/i.test(r));
  const requiresLink = explicit.some((r) => /link|url|website|github|portfolio|demo/i.test(r));
  const hasLink = /(https?:\/\/|www\.)/i.test(lowerAnswer);
  const usesNumbers = /\d/.test(answerText);

  const projectNames = (memory?.projects || []).map((project) => project.name).filter(Boolean);
  const mentionedProjects = projectNames.filter((projectName) => lowerAnswer.includes(projectName.toLowerCase()));
  const explainedProjects = mentionedProjects.filter((projectName) => {
    const project = memory?.projects.find((item) => item.name.toLowerCase() === projectName.toLowerCase());
    if (!project) return false;
    const explanationNeedles = [project.oneLiner, project.longerExplanation, project.bestUseCase].filter(Boolean);
    return explanationNeedles.some((needle) => needle && lowerAnswer.includes(needle.toLowerCase().slice(0, 24)));
  });

  const requiredLinks = [
    memory?.linkVault.github,
    memory?.linkVault.linkedin,
    memory?.linkVault.portfolio,
    memory?.linkVault.resume,
    memory?.linkVault.demoVideo,
    ...(memory?.linkVault.projectLinks || []),
  ].filter(Boolean) as string[];

  let verdict = 'Promising, but not ready yet.';
  if (score >= 85) verdict = 'Ready with minor polish.';
  else if (score >= 70) verdict = 'Close. Two focused edits away.';
  else if (score < 55) verdict = 'Not ready yet. Requirements are still missing.';

  let topFix = critical[0] || warnings[0] || 'No major issues found.';
  let nextBestEdit = 'Add one concrete metric or outcome to prove impact.';
  let evaluatorRisk = 'Low risk. Only polish remains.';

  if (requiresLink && !hasLink) {
    topFix = 'Add the required public link before changing wording.';
    nextBestEdit = 'Place the link near the first sentence so evaluators do not miss it.';
    evaluatorRisk = 'Missing a required link can disqualify the submission.';
  } else if (requiresLink && requiredLinks.length > 0 && !requiredLinks.some((link) => answerText.includes(link))) {
    topFix = 'Move the saved link into the answer so the evaluator can open it immediately.';
    nextBestEdit = 'Insert the saved public link from memory right after the opening sentence.';
    evaluatorRisk = 'A saved link that is not surfaced in the answer still reads as missing.';
  } else if (requiresVideo && speakingSeconds < 60) {
    topFix = 'This is likely too short for a 60-90 second intro. Add one concrete example.';
    nextBestEdit = 'Add a single sentence about impact or a result to reach the target length.';
    evaluatorRisk = 'Too-short answers can signal low effort or missing detail.';
  } else if (mentionedProjects.length > 0 && explainedProjects.length === 0) {
    const names = mentionedProjects.slice(0, 2).join(' and ');
    topFix = `Your builder story is interesting, but ${names} need one-line explanations.`;
    nextBestEdit = 'Add a quick problem/impact line for each named project.';
    evaluatorRisk = 'Unexplained project names read as insider shorthand.';
  } else if (critical.length > 0) {
    topFix = critical[0];
    nextBestEdit = 'Resolve the most critical requirement before rewriting tone.';
    evaluatorRisk = 'Missing a key requirement creates a clear rejection risk.';
  } else if (!usesNumbers && warnings.length > 0) {
    nextBestEdit = 'Add one metric (users, savings, revenue) to make the impact real.';
    evaluatorRisk = 'Lack of specifics can make the answer feel generic.';
  } else if (score >= 85) {
    nextBestEdit = 'Tighten one sentence to make the opening sharper.';
    evaluatorRisk = 'Low risk. Watch for tiny clarity issues.';
  } else if (warnings.length > 0) {
    nextBestEdit = warnings[0];
    evaluatorRisk = 'Unresolved warnings can reduce perceived fit.';
  }

  const sentences = answerText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentence = sentences.length ? wordCount / sentences.length : wordCount;

  const completeness = clamp(
    100 - critical.length * 16 - (requiresLink && !hasLink ? 20 : 0) - (requiresLink && requiredLinks.length > 0 && !requiredLinks.some((link) => answerText.includes(link)) ? 10 : 0)
  );
  const specificity = clamp(
    100 - warnings.length * 12 - (usesNumbers ? 0 : 10) - (mentionedProjects.length > explainedProjects.length ? 12 : 0)
  );
  const clarityBase = avgSentence > 24 ? 55 : avgSentence > 18 ? 70 : 85;
  const clarity = clamp(clarityBase + (score >= 80 ? 6 : 0) - warnings.length * 2);

  let lengthFit = 70;
  if (requiresVideo) {
    if (speakingSeconds >= 55 && speakingSeconds <= 95) lengthFit = 90;
    else if (speakingSeconds < 45 || speakingSeconds > 130) lengthFit = 45;
  } else {
    if (wordCount >= 120 && wordCount <= 220) lengthFit = 90;
    else if (wordCount < 80 || wordCount > 320) lengthFit = 45;
  }

  return {
    verdict,
    topFix,
    nextBestEdit,
    evaluatorRisk,
    opportunityFitScore: Math.round((completeness + specificity + clarity + lengthFit) / 4),
    fitSnapshot: {
      completeness,
      specificity,
      clarity,
      lengthFit,
    },
  };
}
