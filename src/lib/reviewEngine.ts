import type {
  ApplicationMemory,
  ApplicationPacket,
  ApplicationType,
  BriefAnalysis,
  CheckResult,
  EvidenceBank,
  FixPlanItem,
  FullReviewPacket,
  GeneratedAnswer,
  ImprovedAnswerVariant,
  NextBestEdit,
  RequirementCoverageItem,
  ReviewerPanelItem,
  ReviewStrictness,
} from './types';
import { buildMemoryEvidence } from './memoryStore';
import { speakingTime, wordCount } from './utils';

const GENERIC_PHRASES = [
  'smart people',
  'learn from mentors',
  'exciting opportunity',
  'passionate about technology',
  'make an impact',
  'i want to grow',
  'this program is a great fit',
];

const APPLICATION_TYPE_GUIDE: Record<ApplicationType, { focus: string[]; fitLine: string }> = {
  Fellowship: { focus: ['fit', 'motivation', 'builder identity', 'curiosity', 'current work'], fitLine: 'This fellowship fits the work I am already doing.' },
  Hackathon: { focus: ['project clarity', 'demo readiness', 'execution', 'novelty', 'feasibility'], fitLine: 'This hackathon fits a shipping-first mindset.' },
  Internship: { focus: ['skills', 'evidence', 'role match', 'professionalism', 'reliability'], fitLine: 'This internship fits the skills and evidence I can already show.' },
  Accelerator: { focus: ['problem clarity', 'founder insight', 'market relevance', 'speed', 'execution'], fitLine: 'This accelerator fits the problem I am trying to solve.' },
  Scholarship: { focus: ['eligibility', 'impact', 'sincerity', 'clarity', 'background'], fitLine: 'This scholarship fits the impact and path I want to show clearly.' },
  'Club/community': { focus: ['contribution', 'interest', 'fit', 'reliability', 'participation'], fitLine: 'This club fits how I want to contribute consistently.' },
  Grant: { focus: ['outcomes', 'feasibility', 'clarity', 'impact', 'budget logic'], fitLine: 'This grant fits a concrete outcome I can explain and deliver.' },
  Other: { focus: ['clarity', 'fit', 'completeness', 'evidence', 'format'], fitLine: 'This opportunity fits the direction of my current work.' },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function lower(text: string): string {
  return text.toLowerCase();
}

function safeSplit(text: string): string[] {
  return text.split(/\s+/).map((item) => item.trim()).filter(Boolean);
}

function tokenScore(text: string, requirement: string): { score: number; matchedTokens: string[] } {
  const answer = lower(text);
  const tokens = requirement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const matchedTokens = tokens.filter((token) => answer.includes(token));
  const score = tokens.length === 0 ? 0 : matchedTokens.length / tokens.length;
  return { score, matchedTokens };
}

function detectLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]]+/gi) || [];
  return unique(matches);
}

function detectGenericPhrases(text: string): string[] {
  const answer = lower(text);
  return GENERIC_PHRASES.filter((phrase) => answer.includes(phrase));
}

function formatTimeRemaining(deadline?: string): { mode: 'careful' | 'fast' | 'emergency'; timeRemaining: string; recommendation: string } {
  if (!deadline) {
    return {
      mode: 'careful',
      timeRemaining: 'No deadline provided',
      recommendation: 'Treat this as a normal review and focus on the biggest missing requirements first.',
    };
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return {
      mode: 'careful',
      timeRemaining: deadline,
      recommendation: 'Deadline text is not a date. Use the brief itself to decide urgency.',
    };
  }

  const diffMs = parsed.getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 2) {
    return {
      mode: 'emergency',
      timeRemaining: `${Math.max(0, Math.round(diffDays * 24))} hours left`,
      recommendation: 'Move the required link, missing evidence, and any format fixes to the top of the list.',
    };
  }

  if (diffDays <= 7) {
    return {
      mode: 'fast',
      timeRemaining: `${Math.max(1, Math.round(diffDays))} days left`,
      recommendation: 'Focus on requirement coverage and evidence quality before polishing tone.',
    };
  }

  return {
    mode: 'careful',
    timeRemaining: `${Math.max(1, Math.round(diffDays))} days left`,
    recommendation: 'You have time to improve fit, clarity, and evidence before submission.',
  };
}

function extractDeliverables(analysis: BriefAnalysis, briefText: string): string[] {
  const source = unique([...(analysis.explicitRequirements || []), briefText]);
  return source.filter((item) => /video|link|url|portfolio|essay|essay|form|pdf|resume|page|file|script|answer/i.test(item)).slice(0, 8);
}

function extractRequiredLinks(analysis: BriefAnalysis, memory: ApplicationMemory | null, briefText: string): string[] {
  const requiredByBrief = unique([
    ...(analysis.explicitRequirements || []),
    briefText,
  ].flatMap((item) => {
    const matches: string[] = [];
    if (/github/i.test(item) && memory?.linkVault.github) matches.push(memory.linkVault.github);
    if (/linkedin/i.test(item) && memory?.linkVault.linkedin) matches.push(memory.linkVault.linkedin);
    if (/portfolio|website/i.test(item) && memory?.linkVault.portfolio) matches.push(memory.linkVault.portfolio);
    if (/resume|cv/i.test(item) && memory?.linkVault.resume) matches.push(memory.linkVault.resume);
    if (/video|demo/i.test(item) && memory?.linkVault.demoVideo) matches.push(memory.linkVault.demoVideo);
    return matches;
  }));

  return requiredByBrief;
}

function buildEvidenceBank(memory: ApplicationMemory | null): EvidenceBank {
  if (!memory) {
    return {
      projects: [],
      achievements: [],
      links: [],
      personalAngles: [],
      reusableSnippets: [],
      answerSnippets: [],
    };
  }

  return buildMemoryEvidence(memory);
}

function buildRequirementCoverage(
  analysis: BriefAnalysis,
  answerText: string,
  evidence: EvidenceBank,
  requiredLinks: string[]
): RequirementCoverageItem[] {
  const genericEvidence = [...evidence.projects, ...evidence.achievements, ...evidence.personalAngles, ...evidence.reusableSnippets].join('\n').toLowerCase();
  const answer = lower(answerText);

  return (analysis.explicitRequirements || []).map((requirement) => {
    const { score, matchedTokens } = tokenScore(answerText, requirement);
    const hasEvidence = score >= 0.6 || matchedTokens.some((token) => genericEvidence.includes(token));
    const hasRequiredLink = requiredLinks.some((link) => answer.includes(link.toLowerCase()));
    const status: RequirementCoverageItem['status'] = hasEvidence ? 'covered' : score > 0.15 ? 'partial' : 'missing';
    const note = status === 'covered'
      ? `Covered by ${matchedTokens.slice(0, 2).join(', ') || 'your answer'}${hasRequiredLink ? ' and the required link is visible.' : '.'}`
      : status === 'partial'
        ? `Partial coverage. Add one direct sentence using ${matchedTokens[0] || 'the brief wording'}.`
        : `Missing. Add one line that answers ${requirement} directly.`;

    return {
      requirement,
      status,
      note,
    };
  });
}

function reviewerItem(score: number, verdict: string, specificFindings: string[], fixes: string[]): ReviewerPanelItem {
  return { score: clamp(score), verdict, specificFindings, fixes };
}

function buildReviewerPanel(
  analysis: BriefAnalysis,
  answerText: string,
  memory: ApplicationMemory | null,
  applicationType: ApplicationType,
  strictness?: ReviewStrictness,
  requiredLinks: string[] = []
): FullReviewPacket['reviewerPanel'] {
  const evidence = buildEvidenceBank(memory);
  const answer = lower(answerText);
  const guide = APPLICATION_TYPE_GUIDE[applicationType] || APPLICATION_TYPE_GUIDE.Other;
  const genericHits = detectGenericPhrases(answerText);
  const links = detectLinks(answerText);
  const projectNames = memory?.projects.map((project) => project.name).filter(Boolean) || [];
  const mentionedProjects = projectNames.filter((project) => answer.includes(project.toLowerCase()));
  const explainedProjects = (memory?.projects.filter((project) => {
    if (!mentionedProjects.includes(project.name)) return false;
    return [project.oneLiner, project.longerExplanation, project.bestUseCase].some((needle) => needle && answer.includes(needle.toLowerCase()));
  }) ?? []);

  const requirementScore = 100 - Math.max(0, analysis.explicitRequirements.length - buildRequirementCoverage(analysis, answerText, evidence, requiredLinks).filter((item) => item.status === 'covered').length) * 12;
  const fitScore = 80 - genericHits.length * 8 + (answer.includes(guide.fitLine.toLowerCase()) ? 10 : 0);
  const clarityScore = 85 - Math.max(0, safeSplit(answerText).length > 0 ? Math.max(0, Math.round((wordCount(answerText) / Math.max(1, answerText.split(/[.!?]+/).filter(Boolean).length)) - 18)) : 0);
  const evidenceScore = 90 - Math.max(0, projectNames.length > 0 ? projectNames.length - explainedProjects.length : 0) * 12 - (links.length || requiredLinks.length ? 0 : 10);
  const lengthScore = clamp(100 - Math.abs((wordCount(answerText) - 170) / 2));
  const voiceScore = 86 - (strictness === 'Brutal' ? 3 : 0) - genericHits.length * 5;
  const riskScore = 88 - (requiredLinks.length && !links.length ? 18 : 0) - genericHits.length * 8;

  return {
    requirements: reviewerItem(requirementScore, requirementScore >= 80 ? 'Mostly aligned' : 'Requirements still need coverage', [
      analysis.explicitRequirements[0] ? `Directly address: ${analysis.explicitRequirements[0]}` : 'Add a direct answer to the first explicit requirement.',
      analysis.explicitRequirements[1] ? `Check the second requirement: ${analysis.explicitRequirements[1]}` : 'Add any missing required deliverable.',
    ], [
      'Map each explicit requirement to one sentence in the answer.',
      'Add missing deliverables before polishing tone.',
    ]),
    fit: reviewerItem(fitScore, fitScore >= 80 ? 'Fit reads specific' : 'Fit reads generic', [
      guide.fitLine,
      genericHits.length ? `Replace generic phrases: ${genericHits.join(', ')}` : 'No generic fit phrases detected.',
    ], [
      `Add one line tying the answer to ${applicationType.toLowerCase()} expectations.`,
      'Use a concrete reason why this opportunity matters now.',
    ]),
    clarity: reviewerItem(clarityScore, clarityScore >= 80 ? 'Readable and direct' : 'Structure needs cleanup', [
      `Average sentence length: ${answerText.split(/[.!?]+/).filter(Boolean).length ? Math.round(wordCount(answerText) / answerText.split(/[.!?]+/).filter(Boolean).length) : wordCount(answerText)} words.`,
      'Break long compound sentences into shorter ones.',
    ], [
      'Use short, plain-language sentences.',
      'Make the opening sentence carry the answer’s core point.',
    ]),
    evidence: reviewerItem(evidenceScore, evidenceScore >= 80 ? 'Evidence is usable' : 'Evidence is thin or unexplained', [
      projectNames.length ? `Projects mentioned: ${projectNames.slice(0, 2).join(', ')}` : 'No project names mentioned.',
      requiredLinks.length && !links.length ? 'A required link exists in memory but is not visible in the answer.' : 'Evidence link check passed or no required link is defined.',
    ], [
      'Explain each named project in one sentence.',
      'Add one concrete proof point or visible link.',
    ]),
    length: reviewerItem(lengthScore, lengthScore >= 80 ? 'Length is in range' : 'Length needs adjustment', [
      `Current length: ${wordCount(answerText)} words (~${speakingTime(wordCount(answerText))}s).`,
      'Target the brief’s requested word count or speaking time more closely.',
    ], [
      'Shorten the answer if it is over target.',
      'Add one more concrete example if it is under target.',
    ]),
    voice: reviewerItem(voiceScore, voiceScore >= 80 ? 'Voice feels human' : 'Voice needs more personality', [
      genericHits.length ? `Generic phrases still present: ${genericHits.join(', ')}` : 'Voice is not overstuffed with filler.',
      memory?.profile.preferredTone ? `Matches saved tone preference: ${memory.profile.preferredTone}` : 'No saved tone preference used.',
    ], [
      'Keep the tone consistent with the saved profile.',
      'Swap vague phrasing for one concrete memory-backed detail.',
    ]),
    risk: reviewerItem(riskScore, riskScore >= 80 ? 'Low risk' : 'Submission risks remain', [
      requiredLinks.length && !links.length ? 'A required public link still looks missing.' : 'No missing-link blocker detected from the current answer.',
      analysis.submissionRisks[0] || 'Check the brief for hidden format constraints.',
    ], [
      'Surface the required link near the opening sentence.',
      'Double-check any format or length constraints before submitting.',
    ]),
  };
}

function buildImprovedAnswer(
  answerText: string,
  analysis: BriefAnalysis,
  memory: ApplicationMemory | null,
  applicationType: ApplicationType,
  targetLength?: string,
  requiredLinks: string[] = []
): ImprovedAnswerVariant {
  let updated = answerText.trim();
  const changes: string[] = [];
  const reasons: string[] = [];

  const firstProject = memory?.projects.find((project) => project.oneLiner) || null;
  const fitLine = APPLICATION_TYPE_GUIDE[applicationType]?.fitLine || APPLICATION_TYPE_GUIDE.Other.fitLine;
  const genericHits = detectGenericPhrases(updated);
  const hasLink = /https?:\/\//i.test(updated);

  if (genericHits.length) {
    updated = updated.replace(/smart people|learn from mentors|exciting opportunity|passionate about technology|make an impact|i want to grow|this program is a great fit/gi, firstProject?.oneLiner || memory?.profile.currentFocus || 'a specific project and outcome');
    changes.push(`Replaced generic phrasing: ${genericHits.join(', ')}`);
    reasons.push('The answer now uses memory-backed language instead of filler.');
  }

  if (firstProject && updated.toLowerCase().includes(firstProject.name.toLowerCase()) && !updated.toLowerCase().includes(firstProject.oneLiner.toLowerCase())) {
    updated = updated.replace(new RegExp(firstProject.name, 'i'), `${firstProject.name} (${firstProject.oneLiner})`);
    changes.push(`Explained ${firstProject.name} in one line.`);
    reasons.push('Named projects are no longer left unexplained.');
  }

  if (memory?.profile.currentFocus && !updated.toLowerCase().includes(memory.profile.currentFocus.toLowerCase().slice(0, 18))) {
    updated = `${fitLine} ${updated}`;
    changes.push('Added a specific fit sentence from memory and application type.');
    reasons.push('The opening now connects current work to the opportunity.');
  }

  if (requiredLinks.length > 0 && !hasLink) {
    updated = `${updated} [public link]`;
    changes.push('Added a visible public-link placeholder.');
    reasons.push('The answer now signals the required link instead of omitting it.');
  }

  const targetWords = targetLength && /\d+/.test(targetLength)
    ? Number(targetLength.match(/\d+/)?.[0] || 0)
    : targetLength === '60-90 sec video'
      ? 165
      : 150;
  const currentWords = wordCount(updated);

  if (currentWords < targetWords * 0.85) {
    const addition = firstProject
      ? `For example, ${firstProject.name} shows how I like to turn messy problems into something concrete and usable.`
      : 'That gives me a practical way to show what I can build, not just what I can say.';
    updated = `${updated} ${addition}`;
    changes.push('Expanded the answer to fit the target length more closely.');
    reasons.push('The answer is long enough to feel complete in a review setting.');
  }

  if (currentWords > targetWords * 1.25) {
    const sentences = updated.split(/(?<=[.!?])\s+/).filter(Boolean);
    updated = sentences.slice(0, Math.max(2, Math.round(sentences.length * 0.8))).join(' ');
    changes.push('Trimmed the answer to fit the target length more closely.');
    reasons.push('The answer is easier to deliver in a live or timed format.');
  }

  const finalWordCount = wordCount(updated);
  const speakingSeconds = speakingTime(finalWordCount);

  return {
    originalAnswer: answerText,
    improvedAnswer: updated,
    whatChanged: unique(changes.length ? changes : ['Made the answer more specific and evidence-driven.']),
    whyItIsBetter: unique(reasons.length ? reasons : ['It is more direct and tailored to the opportunity.']),
    wordCount: finalWordCount,
    speakingTimeSeconds: speakingSeconds,
  };
}

function buildFixPlan(
  analysis: BriefAnalysis,
  packet: RequirementCoverageItem[],
  reviewerPanel: FullReviewPacket['reviewerPanel'],
  memory: ApplicationMemory | null,
  answerText: string,
  requiredLinks: string[] = []
): FixPlanItem[] {
  const items: FixPlanItem[] = [];
  const missingRequirement = packet.find((item) => item.status !== 'covered');
  const genericHits = detectGenericPhrases(answerText);
  const projectNames = memory?.projects.map((project) => project.name).filter(Boolean) || [];
  const mentionedProjects = projectNames.filter((project) => lower(answerText).includes(project.toLowerCase()));
  const explainedProjects = memory?.projects.filter((project) => mentionedProjects.includes(project.name) && lower(answerText).includes(project.oneLiner.toLowerCase())) ?? [];

  if (missingRequirement) {
    items.push({
      step: 1,
      title: `Cover: ${missingRequirement.requirement}`,
      why: missingRequirement.note,
      effort: '1-2 min',
      impact: 'high',
      suggestedText: `Add one sentence that directly answers: ${missingRequirement.requirement}`,
    });
  }

  if (requiredLinks.length > 0 && !detectLinks(answerText).length) {
    items.push({
      step: items.length + 1,
      title: 'Add required public link',
      why: 'The brief or saved memory indicates a public link is required, but the answer does not show one.',
      effort: '1 min',
      impact: 'high',
      suggestedText: 'Paste the public link near the opening sentence so the evaluator can open it immediately.',
    });
  }

  if (genericHits.length) {
    items.push({
      step: items.length + 1,
      title: 'Remove generic phrasing',
      why: `Replace phrases like ${genericHits.join(', ')} with memory-backed details.`,
      effort: '2 min',
      impact: 'medium',
      suggestedText: `Swap the generic line for a specific project explanation or evidence from memory.`,
    });
  }

  if (mentionedProjects.length > explainedProjects.length) {
    items.push({
      step: items.length + 1,
      title: 'Explain project names',
      why: 'Project names appear without a one-line explanation.',
      effort: '2 min',
      impact: 'high',
      suggestedText: 'Add the saved one-liner after each named project the first time it appears.',
    });
  }

  if (reviewerPanel.length.score < 80) {
    items.push({
      step: items.length + 1,
      title: 'Match target length',
      why: `Current length is ${wordCount(answerText)} words (~${speakingTime(wordCount(answerText))}s).`,
      effort: '1 min',
      impact: 'medium',
      suggestedText: `Trim or expand to fit the target more closely.`,
    });
  }

  if (reviewerPanel.fit.score < 80) {
    items.push({
      step: items.length + 1,
      title: 'Strengthen opportunity fit',
      why: APPLICATION_TYPE_GUIDE.Other.fitLine,
      effort: '1 min',
      impact: 'high',
      suggestedText: 'Add one line explaining why this opportunity matches the work you are already doing.',
    });
  }

  return items.slice(0, 5).map((item, index) => ({ ...item, step: index + 1 }));
}

function buildExportMarkdown(packet: FullReviewPacket): string {
  return [
    `# ${packet.programName}`,
    ``,
    `## Readiness`,
    `- Score: ${packet.readinessReport.score}/100`,
    `- Status: ${packet.readinessReport.status}`,
    `- Next best edit: ${packet.nextBestEdit.title}`,
    ``,
    `## Requirement Checklist`,
    ...packet.requirementCoverage.map((item) => `- [${item.status}] ${item.requirement} — ${item.note}`),
    ``,
    `## Fix Plan`,
    ...packet.fixPlan.map((item) => `- ${item.step}. ${item.title} (${item.effort}, ${item.impact}) — ${item.why}`),
    ``,
    `## Final Answers`,
    ...packet.applicationPacket.finalAnswers.map((answer) => `- ${answer}`),
  ].join('\n');
}

function buildDeadlineMode(deadline?: string): FullReviewPacket['deadlineMode'] {
  return formatTimeRemaining(deadline);
}

function buildReadinessReport(
  analysis: BriefAnalysis,
  answerText: string,
  coverage: RequirementCoverageItem[],
  reviewStrictness?: ReviewStrictness,
  requiredLinks: string[] = []
): CheckResult {
  const genericHits = detectGenericPhrases(answerText);
  const links = detectLinks(answerText);
  const wordTotal = wordCount(answerText);
  const speakingTotal = speakingTime(wordTotal);
  const coverageCount = coverage.filter((item) => item.status === 'covered').length;
  const missingCount = coverage.filter((item) => item.status === 'missing').length;
  const partialCount = coverage.filter((item) => item.status === 'partial').length;
  const hasMissingLink = requiredLinks.length > 0 && !links.length;

  let score = 92;
  score -= missingCount * 12;
  score -= partialCount * 5;
  score -= genericHits.length * 4;
  score -= hasMissingLink ? 14 : 0;
  score -= Math.abs(wordTotal - 165) > 55 ? 10 : 0;
  score -= reviewStrictness === 'Brutal' ? 2 : 0;
  score = clamp(score);

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const strongPoints: string[] = [];

  if (missingCount > 0) {
    criticalIssues.push(`Missing ${missingCount} explicit requirement${missingCount === 1 ? '' : 's'} from the brief.`);
  }
  if (hasMissingLink) {
    criticalIssues.push('The brief calls for a public link, but the answer does not show one.');
  }
  if (genericHits.length > 0) {
    warnings.push(`Generic phrases still appear: ${genericHits.join(', ')}.`);
  }
  if (partialCount > 0) {
    warnings.push(`${partialCount} requirement${partialCount === 1 ? '' : 's'} are only partially addressed.`);
  }
  if (coverageCount > 0) {
    strongPoints.push(`${coverageCount} explicit requirement${coverageCount === 1 ? '' : 's'} are covered.`);
  }
  if (links.length > 0) {
    strongPoints.push('A visible link is present in the answer.');
  }
  if (wordTotal > 0) {
    strongPoints.push(`Length is measurable at ${wordTotal} words (~${speakingTotal}s).`);
  }

  const fixOrder = [
    ...criticalIssues,
    ...warnings,
  ].slice(0, 5);

  const status = score >= 80 ? 'Ready with minor edits' : score >= 60 ? 'Needs fixes' : 'Not ready';

  return {
    score,
    status,
    criticalIssues,
    warnings,
    strongPoints,
    fixOrder,
    wordCount: wordTotal,
    speakingTimeSeconds: speakingTotal,
  };
}

export interface DeterministicReviewInput {
  briefAnalysis: BriefAnalysis;
  answer: string;
  question: string;
  memory?: ApplicationMemory | null;
  applicationType: ApplicationType;
  reviewStrictness?: ReviewStrictness;
  programName?: string;
  deadline?: string;
  generatedAnswer?: GeneratedAnswer | null;
  targetLength?: string;
}

export function buildFullReviewPacket({
  briefAnalysis,
  answer,
  question,
  memory,
  applicationType,
  reviewStrictness,
  programName,
  deadline,
  generatedAnswer,
  targetLength,
}: DeterministicReviewInput): FullReviewPacket {
  const answerText = answer || generatedAnswer?.draft || '';
  const evidenceBank = buildEvidenceBank(memory ?? null);
  const deadlineMode = buildDeadlineMode(deadline);
  const requiredLinks = extractRequiredLinks(briefAnalysis, memory ?? null, question);
  const requirementCoverage = buildRequirementCoverage(briefAnalysis, answerText, evidenceBank, requiredLinks);
  const readinessReport = buildReadinessReport(briefAnalysis, answerText, requirementCoverage, reviewStrictness, requiredLinks);
  const reviewerPanel = buildReviewerPanel(briefAnalysis, answerText, memory ?? null, applicationType, reviewStrictness, requiredLinks);
  const improvedApplication = buildImprovedAnswer(answerText, briefAnalysis, memory ?? null, applicationType, targetLength, requiredLinks);
  const fixPlan = buildFixPlan(briefAnalysis, requirementCoverage, reviewerPanel, memory ?? null, answerText, requiredLinks);
  const nextBestIssue = fixPlan[0] || {
    title: 'Tighten the opening sentence',
    why: 'The current answer is broad, and the evaluator needs a specific opening immediately.',
    suggestedText: 'Lead with one sentence that states who you are and why this opportunity matters now.',
    effort: '1 min',
    impact: 'high' as const,
    step: 1,
  };

  const nextBestEdit: NextBestEdit = {
    title: nextBestIssue.title,
    reason: nextBestIssue.why,
    suggestedText: nextBestIssue.suggestedText,
  };

  const packet: FullReviewPacket = {
    reviewId: `${programName || 'review'}-${Date.now()}`,
    programName: programName || 'Untitled opportunity',
    applicationType,
    deadlineMode,
    briefAnalysis: {
      summary: briefAnalysis.summary || '',
      explicitRequirements: briefAnalysis.explicitRequirements || [],
      hiddenRequirements: briefAnalysis.impliedCriteria || [],
      deliverables: extractDeliverables(briefAnalysis, question),
      requiredLinks,
      answerTopics: safeSplit(question).slice(0, 12),
      evaluationCriteria: unique([
        ...(briefAnalysis.impliedCriteria || []),
        ...APPLICATION_TYPE_GUIDE[applicationType].focus,
      ]),
      deadlineConstraints: deadline ? [deadlineMode.recommendation] : [],
      formatConstraints: extractDeliverables(briefAnalysis, question),
      submissionRisks: briefAnalysis.submissionRisks || [],
    },
    evidenceBank,
    requirementCoverage,
    reviewerPanel,
    readinessReport,
    nextBestEdit,
    fixPlan,
    improvedApplication,
    applicationPacket: {
      programName: programName || 'Untitled opportunity',
      applicationType,
      overallScore: readinessReport.score,
      status: readinessReport.status,
      nextBestEdit: nextBestEdit.title,
      finalAnswers: [improvedApplication.improvedAnswer],
      requirementChecklist: requirementCoverage,
      requiredLinks,
      fixPlan,
      submissionChecklist: unique([
        ...requirementCoverage.map((item) => item.requirement),
        ...requiredLinks.map((link) => `Confirm link: ${link}`),
        'Proofread the final answer once aloud',
      ]),
      exportMarkdown: '',
    },
  };

  packet.applicationPacket.exportMarkdown = buildExportMarkdown(packet);
  return packet;
}

export function summarizeReviewForChecklist(packet: FullReviewPacket) {
  return {
    score: packet.readinessReport.score,
    nextBestEdit: packet.nextBestEdit.title,
    missingRequirements: packet.requirementCoverage.filter((item) => item.status !== 'covered').length,
    requiredLinks: packet.applicationPacket.requiredLinks,
  };
}
