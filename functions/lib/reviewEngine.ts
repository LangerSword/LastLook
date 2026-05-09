import type { ApplicationMemory, BriefAnalysis, GeneratedAnswer } from './types';

export interface MemoryProfile {
  name: string;
  shortBio: string;
  currentFocus: string;
  preferredTone: string;
  locationTimezone?: string;
}

export interface MemoryProject {
  name: string;
  oneLiner: string;
  longerExplanation: string;
  tags: string[];
  links: string[];
  proof: string;
  bestUseCase: string;
}

export interface MemoryAchievement {
  title: string;
  description: string;
  proof: string;
  category: string;
}

export interface LinkVault {
  github: string;
  linkedin: string;
  portfolio: string;
  resume: string;
  demoVideo: string;
  projectLinks: string[];
  otherLinks: string[];
}

export interface AnswerLibrarySnippet {
  title: string;
  body: string;
  tags: string[];
}

export interface MemoryPreferences {
  preferredTone: string;
  preferredApplicationTypes: string[];
  timezone?: string;
  notes?: string;
}

export interface ApplicationMemory {
  profile: MemoryProfile;
  projects: MemoryProject[];
  achievements: MemoryAchievement[];
  answerLibrary: AnswerLibrarySnippet[];
  linkVault: LinkVault;
  preferences: MemoryPreferences;
  updatedAt?: string;
}

export type ApplicationType = 'Fellowship' | 'Hackathon' | 'Internship' | 'Accelerator' | 'Scholarship' | 'Club/community' | 'Grant' | 'Other';
export type ReviewStrictness = 'Gentle' | 'Balanced' | 'Brutal';

export interface RequirementCoverageItem {
  requirement: string;
  status: 'covered' | 'partial' | 'missing';
  note: string;
  evidenceFound: string;
  whatToAdd: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FixPlanItem {
  step: number;
  title: string;
  why: string;
  effort: string;
  impact: 'high' | 'medium' | 'low';
  suggestedText: string;
}

export interface NextBestEdit {
  title: string;
  reason: string;
  suggestedText: string;
}

export interface ImprovedAnswerVariant {
  originalAnswer: string;
  improvedAnswer: string;
  whatChanged: string[];
  whyItIsBetter: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export interface EvidenceBank {
  projects: string[];
  achievements: string[];
  links: string[];
  personalAngles: string[];
  reusableSnippets: string[];
  answerSnippets: string[];
}

export interface BriefAnalysisV2 {
  summary: string;
  explicitRequirements: string[];
  hiddenRequirements: string[];
  deliverables: string[];
  requiredLinks: string[];
  answerTopics: string[];
  evaluationCriteria: string[];
  deadlineConstraints: string[];
  formatConstraints: string[];
  submissionRisks: string[];
}

export interface CheckResult {
  score: number;
  status: string;
  criticalIssues: string[];
  warnings: string[];
  strongPoints: string[];
  fixOrder: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export interface ReviewerPanelItem {
  score: number;
  verdict: string;
  specificFindings: string[];
  fixes: string[];
}

export interface ReviewerPanel {
  requirements: ReviewerPanelItem;
  fit: ReviewerPanelItem;
  clarity: ReviewerPanelItem;
  evidence: ReviewerPanelItem;
  length: ReviewerPanelItem;
  voice: ReviewerPanelItem;
  risk: ReviewerPanelItem;
}

export interface DeadlineMode {
  mode: 'careful' | 'fast' | 'emergency';
  timeRemaining: string;
  recommendation: string;
}

export interface ApplicationPacket {
  programName: string;
  applicationType: ApplicationType;
  overallScore: number;
  status: string;
  nextBestEdit: string;
  finalAnswers: string[];
  requirementChecklist: RequirementCoverageItem[];
  requiredLinks: string[];
  fixPlan: FixPlanItem[];
  submissionChecklist: string[];
  exportMarkdown: string;
}

export interface FullReviewPacket {
  reviewId: string;
  programName: string;
  applicationType: ApplicationType;
  deadlineMode: DeadlineMode;
  briefAnalysis: BriefAnalysisV2;
  evidenceBank: EvidenceBank;
  requirementCoverage: RequirementCoverageItem[];
  reviewerPanel: ReviewerPanel;
  readinessReport: CheckResult;
  nextBestEdit: NextBestEdit;
  fixPlan: FixPlanItem[];
  improvedApplication: ImprovedAnswerVariant;
  applicationPacket: ApplicationPacket;
}

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

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function speakingTime(wordCountValue: number): number {
  return Math.round((wordCountValue / 145) * 60);
}

function detectLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]]+/gi) || [];
  return unique(matches);
}

function detectGenericPhrases(text: string): string[] {
  const answer = lower(text);
  return GENERIC_PHRASES.filter((phrase) => answer.includes(phrase));
}

function formatTimeRemaining(deadline?: string): DeadlineMode {
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
  return source.filter((item) => /video|link|url|portfolio|essay|form|pdf|resume|page|file|script|answer/i.test(item)).slice(0, 8);
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

  const projects = memory.projects.flatMap((project) => {
    return [project.name, project.oneLiner, project.longerExplanation, project.bestUseCase].filter(Boolean);
  });

  const achievements = memory.achievements.flatMap((achievement) => {
    return [achievement.title, achievement.description, achievement.proof].filter(Boolean);
  });

  const links = [
    memory.linkVault.github,
    memory.linkVault.linkedin,
    memory.linkVault.portfolio,
    memory.linkVault.resume,
    memory.linkVault.demoVideo,
    ...memory.linkVault.projectLinks,
    ...memory.linkVault.otherLinks,
  ].filter(Boolean);

  const personalAngles = [
    memory.profile.shortBio,
    memory.profile.currentFocus,
    memory.preferences.notes || '',
  ].filter(Boolean);

  const reusableSnippets = memory.answerLibrary.map((snippet) => `${snippet.title}: ${snippet.body}`);

  return {
    projects,
    achievements,
    links,
    personalAngles,
    reusableSnippets,
    answerSnippets: memory.answerLibrary.map((snippet) => snippet.body),
  };
}

function buildRequirementCoverage(
  analysis: BriefAnalysis,
  answerText: string,
  evidence: EvidenceBank,
  requiredLinks: string[],
  memory: ApplicationMemory | null,
  deadline?: string
): RequirementCoverageItem[] {
  const genericEvidence = [...evidence.projects, ...evidence.achievements, ...evidence.personalAngles, ...evidence.reusableSnippets].join('\n').toLowerCase();
  const answer = lower(answerText);
  const answerSentences = answerText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  return (analysis.explicitRequirements || []).map((requirement) => {
    const { score, matchedTokens } = tokenScore(answerText, requirement);
    const hasEvidence = score >= 0.6 || matchedTokens.some((token) => genericEvidence.includes(token));
    const reqLower = requirement.toLowerCase();
    const isLinkReq = /link|url|website|portfolio|github|video|demo|file/i.test(reqLower);
    const hasRequiredLink = isLinkReq && requiredLinks.length > 0;
    const linkVisible = hasRequiredLink && detectLinks(answerText).length > 0;
    const status: RequirementCoverageItem['status'] = hasEvidence && (!isLinkReq || linkVisible) ? 'covered' : (score > 0.15 || (isLinkReq && !linkVisible)) ? 'partial' : 'missing';

    const evidenceSentence = answerSentences.find((s) => {
      const sLower = s.toLowerCase();
      return matchedTokens.some((t) => sLower.includes(t));
    }) || '';

    let evidenceFound = '';
    if (status === 'covered') {
      evidenceFound = evidenceSentence
        ? `Your answer says: "${evidenceSentence.slice(0, 120)}..."`
        : `Covered by matched terms: ${matchedTokens.slice(0, 2).join(', ')}.`;
    } else if (isLinkReq && !linkVisible) {
      evidenceFound = 'The brief requires a public link, but none is visible in your answer.';
    } else {
      evidenceFound = 'No direct evidence found in the answer or saved memory.';
    }

    let whatToAdd = '';
    if (isLinkReq && !linkVisible) {
      const savedLink = memory?.linkVault?.portfolio || memory?.linkVault?.github || requiredLinks[0] || '[your public link]';
      whatToAdd = `Add the public link: ${savedLink}`;
    } else if (status === 'missing') {
      whatToAdd = `Add one sentence that directly answers: "${requirement}".`;
    } else {
      whatToAdd = `Strengthen the existing sentence with one concrete detail from your memory (project name, metric, or outcome).`;
    }

    let priority: RequirementCoverageItem['priority'] = 'low';
    if (status === 'missing') {
      priority = 'high';
    } else if (status === 'partial') {
      priority = 'medium';
    }
    if (deadline && new Date(deadline).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 && status !== 'covered') {
      priority = 'high';
    }

    const note = status === 'covered'
      ? `Covered by ${matchedTokens.slice(0, 2).join(', ') || 'your answer'}${linkVisible ? ' and the required link is visible.' : '.'}`
      : status === 'partial'
        ? `Partial coverage. Add one direct sentence using ${matchedTokens[0] || 'the brief wording'}.`
        : `Missing. Add one line that answers ${requirement} directly.`;

    return {
      requirement,
      status,
      note,
      evidenceFound,
      whatToAdd,
      priority,
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
): ReviewerPanel {
  const evidence = buildEvidenceBank(memory);
  const answer = lower(answerText);
  const guide = APPLICATION_TYPE_GUIDE[applicationType] || APPLICATION_TYPE_GUIDE.Other;
  const genericHits = detectGenericPhrases(answerText);
  const links = detectLinks(answerText);
  const projectNames = memory?.projects.map((project) => project.name).filter(Boolean) || [];
  const mentionedProjects = projectNames.filter((project) => answer.includes(project.toLowerCase()));
  const unexplainedProjects = memory?.projects.filter((project) => {
    if (!mentionedProjects.includes(project.name)) return false;
    return ![project.oneLiner, project.longerExplanation, project.bestUseCase].some((needle) => needle && answer.includes(needle.toLowerCase()));
  }) ?? [];
  const coverageItems = buildRequirementCoverage(analysis, answerText, evidence, requiredLinks, memory);
  const coveredCount = coverageItems.filter((item) => item.status === 'covered').length;
  const missingCount = coverageItems.filter((item) => item.status === 'missing').length;
  const sentences = answerText.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLen = sentences.length ? Math.round(wordCount(answerText) / sentences.length) : wordCount(answerText);

  const requirementScore = clamp(100 - missingCount * 15 - (coverageItems.filter((i) => i.status === 'partial').length) * 7);
  const fitScore = clamp(90 - genericHits.length * 10 - (missingCount > 0 ? 8 : 0));
  const clarityScore = clamp(95 - Math.max(0, avgSentenceLen > 18 ? avgSentenceLen - 18 : 0) * 2 - (missingCount > 0 ? 5 : 0));
  const evidenceScore = clamp(95 - (unexplainedProjects.length * 12) - (requiredLinks.length && !links.length ? 15 : 0) - (mentionedProjects.length === 0 && projectNames.length > 0 ? 10 : 0));
  const targetWords = 165;
  const lengthScore = clamp(100 - Math.abs((wordCount(answerText) - targetWords) / 3));
  const voiceScore = clamp(92 - (strictness === 'Brutal' ? 5 : 0) - genericHits.length * 6 - (unexplainedProjects.length > 0 ? 4 : 0));
  const riskScore = clamp(95 - (requiredLinks.length && !links.length ? 20 : 0) - missingCount * 10 - genericHits.length * 5);

  const firstGeneric = genericHits[0] || '';
  const firstUnexplained = unexplainedProjects[0]?.name || '';
  const firstRequirement = analysis.explicitRequirements[0] || '';
  const firstRisk = analysis.submissionRisks[0] || '';
  const profileName = memory?.profile.name || 'the applicant';
  const firstProject = memory?.projects[0];

  return {
    requirements: reviewerItem(requirementScore, requirementScore >= 80 ? 'Mostly aligned' : 'Requirements still need coverage', [
      analysis.explicitRequirements.length > 0
        ? `The brief asks for: "${firstRequirement}".`
        : 'No explicit requirements were extracted from the brief.',
      coveredCount > 0
        ? `${coveredCount} of ${analysis.explicitRequirements.length} requirements are fully covered.`
        : 'None of the explicit requirements are directly addressed yet.',
      missingCount > 0
        ? `Missing: ${coverageItems.filter((i) => i.status === 'missing').map((i) => i.requirement).slice(0, 2).join('; ')}.`
        : 'All tracked requirements have at least partial coverage.',
    ], [
      `Map "${firstRequirement || 'the first requirement'}" to one sentence in the answer.`,
      'Add missing deliverables before polishing tone.',
    ]),
    fit: reviewerItem(fitScore, fitScore >= 80 ? 'Fit reads specific' : 'Fit reads generic', [
      genericHits.length > 0
        ? `The answer uses generic phrasing: "${firstGeneric}" — this could apply to any opportunity.`
        : `No generic fit phrases like "smart people" or "exciting opportunity" were detected.`,
      applicationType
        ? `This is a ${applicationType} application. The evaluator is looking for: ${guide.focus.slice(0, 3).join(', ')}.`
        : 'Application type not set.',
      memory?.profile.currentFocus
        ? `Current focus from memory: "${memory.profile.currentFocus}".`
        : 'No current focus saved in memory to anchor the fit line.',
    ], [
      `Replace "${firstGeneric || 'generic phrasing'}" with a specific reason this ${applicationType.toLowerCase()} matches ${profileName}'s current work.`,
      `Add one sentence connecting "${memory?.profile.currentFocus || 'your focus'}" to what this ${applicationType.toLowerCase()} actually offers.`,
    ]),
    clarity: reviewerItem(clarityScore, clarityScore >= 80 ? 'Readable and direct' : 'Structure needs cleanup', [
      `Average sentence length is ${avgSentenceLen} words (${avgSentenceLen > 22 ? 'long' : 'reasonable'} for spoken delivery).`,
      sentences.length > 0
        ? `The answer has ${sentences.length} sentences.`
        : 'The answer does not contain clear sentence boundaries.',
      firstRequirement
        ? `The brief explicitly asks for "${firstRequirement}", which should appear early.`
        : 'No clear opening requirement to anchor the structure.',
    ], [
      avgSentenceLen > 22 ? 'Break sentences over 22 words into two shorter ones.' : 'Keep sentences short and direct.',
      `Open with one sentence that names ${profileName} and states the core point.`,
    ]),
    evidence: reviewerItem(evidenceScore, evidenceScore >= 80 ? 'Evidence is usable' : 'Evidence is thin or unexplained', [
      projectNames.length > 0
        ? `Saved projects: ${projectNames.slice(0, 3).join(', ')}.`
        : 'No projects saved in memory.',
      mentionedProjects.length > 0
        ? `Mentioned in answer: ${mentionedProjects.slice(0, 3).join(', ')}.`
        : 'No saved projects are mentioned in the answer.',
      unexplainedProjects.length > 0
        ? `"${firstUnexplained}" appears without a one-line explanation.`
        : 'All mentioned projects are explained.',
      requiredLinks.length && !links.length
        ? `Required link missing. Saved links include: ${requiredLinks.slice(0, 2).join(', ')}.`
        : links.length > 0
          ? `Visible link(s): ${links.slice(0, 2).join(', ')}.`
          : 'No link required or detected.',
    ], [
      unexplainedProjects.length > 0
        ? `Add "${firstUnexplained} — ${unexplainedProjects[0].oneLiner || 'a short one-liner'}" the first time it appears.`
        : `Explain each named project with a one-line outcome.`,
      requiredLinks.length && !links.length
        ? `Paste the required link near the first sentence.`
        : `Add one concrete proof point (metric, user count, or demo) from memory.`,
    ]),
    length: reviewerItem(lengthScore, lengthScore >= 80 ? 'Length is in range' : 'Length needs adjustment', [
      `Current: ${wordCount(answerText)} words (~${speakingTime(wordCount(answerText))}s at 145 wpm).`,
      analysis.explicitRequirements.some((r) => /60-90 second|video/i.test(r))
        ? 'The brief requests a 60-90 second video, which maps to ~145-220 words.'
        : `Target is approximately ${targetWords} words.`,
    ], [
      wordCount(answerText) < 120
        ? 'Add one concrete example or project detail to reach the target length.'
        : wordCount(answerText) > 240
          ? 'Trim filler sentences to bring the answer under 220 words.'
          : 'Length is within range.',
    ]),
    voice: reviewerItem(voiceScore, voiceScore >= 80 ? 'Voice feels human' : 'Voice needs more personality', [
      genericHits.length > 0
        ? `Generic phrases detected: "${genericHits.join('", "')}".`
        : 'No common generic phrases detected.',
      memory?.profile.preferredTone
        ? `Saved tone preference: "${memory.profile.preferredTone}".`
        : 'No saved tone preference used.',
      firstProject?.oneLiner
        ? `Project "${firstProject.name}" has a strong one-liner that could replace filler.`
        : 'No project one-liner available to swap for generic phrasing.',
    ], [
      genericHits.length > 0
        ? `Replace "${firstGeneric}" with a detail from "${firstProject?.name || 'a saved project'}".`
        : 'Keep the current voice consistent.',
    ]),
    risk: reviewerItem(riskScore, riskScore >= 80 ? 'Low risk' : 'Submission risks remain', [
      requiredLinks.length && !links.length
        ? `MISSING LINK: The brief requires a public link, but the answer contains none.`
        : 'Link check passed.',
      firstRisk
        ? `Brief risk note: "${firstRisk}".`
        : 'No specific submission risks extracted from the brief.',
      missingCount > 0
        ? `${missingCount} requirement(s) are missing, which creates a rejection risk.`
        : 'All requirements are at least partially addressed.',
    ], [
      requiredLinks.length && !links.length
        ? `Surface the link immediately: ${requiredLinks[0] || '[your link]'}.`
        : `Double-check "${firstRequirement || 'the brief'}" before submitting.`,
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

  const genericHits = detectGenericPhrases(updated);
  const hasLink = /https?:\/\//i.test(updated);
  const projectNames = memory?.projects.map((p) => p.name).filter(Boolean) || [];

  if (genericHits.length) {
    const replacements: Record<string, string> = {};
    for (const hit of genericHits) {
      const contextualProject = memory?.projects.find((p) =>
        updated.toLowerCase().includes(p.name.toLowerCase())
      );
      const replacement = contextualProject?.oneLiner || memory?.profile.currentFocus || 'a specific project I am building right now';
      replacements[hit.toLowerCase()] = replacement;
    }

    let replaced = updated;
    for (const [phrase, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      replaced = replaced.replace(regex, replacement);
    }
    if (replaced !== updated) {
      updated = replaced;
      changes.push(`Replaced generic phrasing (${genericHits.join(', ')}) with memory-backed specifics.`);
      reasons.push('The answer now uses concrete details instead of phrases that could apply to any applicant.');
    }
  }

  const mentionedProjects = memory?.projects.filter((p) =>
    updated.toLowerCase().includes(p.name.toLowerCase())
  ) ?? [];
  for (const project of mentionedProjects) {
    if (!project.oneLiner) continue;
    const alreadyExplained = [project.oneLiner, project.longerExplanation, project.bestUseCase].some((n) =>
      n && updated.toLowerCase().includes(n.toLowerCase())
    );
    if (!alreadyExplained) {
      const regex = new RegExp(`\\b${project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      updated = updated.replace(regex, `${project.name} — ${project.oneLiner}`);
      changes.push(`Explained ${project.name} with its saved one-liner.`);
      reasons.push('Evaluators cannot guess what a project does from its name alone.');
    }
  }

  if (requiredLinks.length > 0 && !hasLink) {
    const savedLink = memory?.linkVault?.portfolio || memory?.linkVault?.github || requiredLinks[0] || '[public link]';
    updated = `${updated} Link: ${savedLink}`;
    changes.push('Added the required public link.');
    reasons.push('The brief explicitly requires a publicly accessible link.');
  }

  const targetWords = targetLength && /\d+/.test(targetLength)
    ? Number(targetLength.match(/\d+/)?.[0] || 0)
    : targetLength === '60-90 sec video'
      ? 170
      : 150;
  const currentWords = wordCount(updated);

  if (currentWords < targetWords * 0.8) {
    const projectToAdd = memory?.projects.find((p) => p.bestUseCase || p.oneLiner);
    if (projectToAdd) {
      const addition = `A good example is ${projectToAdd.name}${projectToAdd.bestUseCase ? ` — ${projectToAdd.bestUseCase}` : '.'}`;
      updated = `${updated} ${addition}`;
      changes.push(`Expanded with a concrete example from ${projectToAdd.name}.`);
      reasons.push('The answer now reaches the target length using only real, saved project details.');
    } else {
      updated = `${updated} I am focused on shipping tools that solve real problems, and this opportunity aligns with the work I am already doing.`;
      changes.push('Expanded slightly to reach the target length.');
      reasons.push('The answer is now long enough to feel complete.');
    }
  }

  if (currentWords > targetWords * 1.3) {
    const sentences = updated.split(/(?<=[.!?])\s+/).filter(Boolean);
    updated = sentences.slice(0, Math.max(2, Math.round(sentences.length * 0.8))).join(' ');
    changes.push('Trimmed to fit the target length more closely.');
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
  reviewerPanel: ReviewerPanel,
  memory: ApplicationMemory | null,
  answerText: string,
  requiredLinks: string[] = [],
  applicationType: ApplicationType = 'Other'
): FixPlanItem[] {
  const items: FixPlanItem[] = [];
  const genericHits = detectGenericPhrases(answerText);
  const projectNames = memory?.projects.map((project) => project.name).filter(Boolean) || [];
  const mentionedProjects = projectNames.filter((project) => lower(answerText).includes(project.toLowerCase()));
  const unexplainedProjects = memory?.projects.filter((project) =>
    mentionedProjects.includes(project.name) && !lower(answerText).includes(project.oneLiner.toLowerCase())
  ) ?? [];
  const links = detectLinks(answerText);

  if (requiredLinks.length > 0 && !links.length) {
    const savedLink = memory?.linkVault?.portfolio || memory?.linkVault?.github || requiredLinks[0] || '[your public link]';
    items.push({
      step: 1,
      title: 'Add the required public link',
      why: 'The brief explicitly requires a publicly accessible link, and omitting it can disqualify the submission.',
      effort: '1 min',
      impact: 'high',
      suggestedText: `Paste the link near the opening sentence: ${savedLink}`,
    });
  }

  if (unexplainedProjects.length > 0) {
    const first = unexplainedProjects[0];
    items.push({
      step: items.length + 1,
      title: `Explain ${first.name}`,
      why: `"${first.name}" appears in the answer but the evaluator will not know what it does without a one-line explanation.`,
      effort: '1 min',
      impact: 'high',
      suggestedText: `Change the first mention to: "${first.name} — ${first.oneLiner || 'a short one-liner'}".`,
    });
  }

  const missingHigh = packet.filter((item) => item.status === 'missing' && item.priority === 'high');
  for (const missing of missingHigh.slice(0, 2)) {
    items.push({
      step: items.length + 1,
      title: `Cover: ${missing.requirement}`,
      why: missing.evidenceFound || `This requirement is missing from the answer.`,
      effort: '2 min',
      impact: 'high',
      suggestedText: missing.whatToAdd || `Add one sentence that directly answers: ${missing.requirement}`,
    });
  }

  if (genericHits.length) {
    const firstHit = genericHits[0];
    const replacementProject = memory?.projects.find((p) => p.oneLiner) || memory?.projects[0];
    items.push({
      step: items.length + 1,
      title: `Replace generic phrase: "${firstHit}"`,
      why: `The phrase "${firstHit}" could appear in any application and does not prove specific fit.`,
      effort: '2 min',
      impact: 'medium',
      suggestedText: replacementProject
        ? `Swap it for: "${replacementProject.oneLiner || replacementProject.name}" — this connects your work to the opportunity.`
        : `Swap it for a concrete detail about what you are building right now.`,
    });
  }

  if (reviewerPanel.length.score < 80) {
    const w = wordCount(answerText);
    const t = speakingTime(w);
    items.push({
      step: items.length + 1,
      title: 'Adjust to target length',
      why: `Current length is ${w} words (~${t}s). The brief implies a specific delivery window.`,
      effort: '1 min',
      impact: 'medium',
      suggestedText: w < 130
        ? 'Add one sentence with a concrete project example from memory.'
        : 'Cut one filler sentence that does not advance a requirement.',
    });
  }

  if (reviewerPanel.fit.score < 80 && items.length < 5) {
    items.push({
      step: items.length + 1,
      title: 'Strengthen opportunity fit',
      why: 'The evaluator needs to see why this opportunity matches your current trajectory, not just that you are interested.',
      effort: '2 min',
      impact: 'high',
      suggestedText: `Add one sentence that connects "${memory?.profile.currentFocus || 'your current work'}" to a specific ${applicationType.toLowerCase()} outcome.`,
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

function buildReadinessReport(
  analysis: BriefAnalysis,
  answerText: string,
  coverage: RequirementCoverageItem[],
  strictness?: ReviewStrictness,
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
  const isVideoBrief = analysis.explicitRequirements.some((r) => /60-90 second|video|pitch/i.test(r));

  let score = 92;
  score -= missingCount * 14;
  score -= partialCount * 6;
  score -= genericHits.length * 5;
  score -= hasMissingLink ? 18 : 0;
  score -= isVideoBrief && wordTotal < 100 ? 12 : 0;
  score -= isVideoBrief && wordTotal > 240 ? 8 : 0;
  score -= Math.abs(wordTotal - 170) > 60 ? 8 : 0;
  score -= strictness === 'Brutal' ? 3 : 0;
  score = clamp(score);

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const strongPoints: string[] = [];

  if (missingCount > 0) {
    const missingReqs = coverage.filter((i) => i.status === 'missing').map((i) => i.requirement);
    criticalIssues.push(`Missing ${missingCount} requirement(s): ${missingReqs.slice(0, 2).join('; ')}.`);
  }
  if (hasMissingLink) {
    criticalIssues.push(`MISSING LINK: The brief requires a public link. Saved candidate: ${requiredLinks[0] || '[not set]'}.`);
  }
  if (isVideoBrief && wordTotal < 100) {
    criticalIssues.push(`TOO SHORT for a 60-90 second video: ${wordTotal} words (~${speakingTotal}s). Target is ~145-220 words.`);
  }
  if (genericHits.length > 0) {
    warnings.push(`Generic phrasing detected: "${genericHits.join('", "')}" — replace with a specific project detail or metric.`);
  }
  if (partialCount > 0) {
    const partialReqs = coverage.filter((i) => i.status === 'partial').map((i) => i.requirement);
    warnings.push(`${partialCount} requirement(s) partially addressed: ${partialReqs.slice(0, 2).join('; ')}.`);
  }
  if (coverageCount > 0) {
    strongPoints.push(`${coverageCount} of ${coverage.length} explicit requirements are fully covered.`);
  }
  if (links.length > 0) {
    strongPoints.push(`Visible link present: ${links[0]}.`);
  }
  if (wordTotal > 0) {
    strongPoints.push(`Length: ${wordTotal} words (~${speakingTotal}s at 145 wpm).`);
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
  const deadlineMode = formatTimeRemaining(deadline);
  const requiredLinks = extractRequiredLinks(briefAnalysis, memory ?? null, question);
  const requirementCoverage = buildRequirementCoverage(briefAnalysis, answerText, evidenceBank, requiredLinks, memory ?? null, deadline);
  const readinessReport = buildReadinessReport(briefAnalysis, answerText, requirementCoverage, reviewStrictness, requiredLinks);
  const reviewerPanel = buildReviewerPanel(briefAnalysis, answerText, memory ?? null, applicationType, reviewStrictness, requiredLinks);
  const improvedApplication = buildImprovedAnswer(answerText, briefAnalysis, memory ?? null, applicationType, targetLength, requiredLinks);
  const fixPlan = buildFixPlan(briefAnalysis, requirementCoverage, reviewerPanel, memory ?? null, answerText, requiredLinks, applicationType);
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