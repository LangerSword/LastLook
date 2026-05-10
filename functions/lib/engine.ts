import type { StageEvidenceBank } from './stages';

export interface DeterministicChecks {
  wordCount: number;
  speakingTimeSeconds: number;
  lengthFit: {
    status: 'tooShort' | 'tooLong' | 'fits' | 'unknown';
    note: string;
  };
  links: {
    urlsFound: string[];
    requiredLinksMissing: string[];
    savedLinksAvailable: string[];
  };
  genericPhrases: {
    phrase: string;
    replacementSuggestion: string;
  }[];
  projectExplanationWarnings: {
    projectName: string;
    issue: string;
    suggestedOneLiner: string;
  }[];
  memoryUsage: {
    usedProjects: string[];
    unusedRelevantProjects: string[];
    note: string;
  };
  formattingIssues: string[];
}

export interface RequirementCoverageOutput {
  items: {
    requirement: string;
    status: 'covered' | 'partial' | 'missing';
    note: string;
    evidenceFound: string;
    whatToAdd: string;
    priority: 'high' | 'medium' | 'low';
  }[];
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

export interface ReadinessReportOutput {
  score: number;
  status: string;
  verdict: string;
  criticalIssues: string[];
  warnings: string[];
  strongPoints: string[];
  fixOrder: string[];
  wordCount: number;
  speakingTimeSeconds: number;
  nextBestEdit: {
    action: string;
    why: string;
    expectedImpact: string;
  };
  fixPlan: {
    step: number;
    title: string;
    why: string;
    effort: string;
    impact: string;
    suggestedText?: string;
  }[];
}

export interface PacketOutput {
  programName: string;
  applicationType: string;
  overallScore: number;
  status: string;
  requiredLinks: {
    label: string;
    status: string;
    value?: string;
    note?: string;
  }[];
  submissionChecklist: {
    item: string;
    status: string;
    note?: string;
  }[];
  exportMarkdown: string;
}

export function buildEvidenceBank(
  memory: unknown,
  answer: string,
  _briefAnalysis?: unknown
): StageEvidenceBank {
  const mem = memory as {
    profile?: { name?: string; bio?: string; currentFocus?: string };
    projects?: { name?: string; oneLiner?: string; description?: string; tags?: string[] }[];
    achievements?: { title?: string; description?: string }[];
    links?: Record<string, string>;
    snippets?: { title?: string; text?: string; tags?: string[] }[];
  } | null;

  const identity: string[] = [];
  const projects: StageEvidenceBank['projects'] = [];
  const achievements: StageEvidenceBank['achievements'] = [];
  const links: StageEvidenceBank['links'] = [];
  const reusableSnippets: StageEvidenceBank['reusableSnippets'] = [];
  const missingEvidence: string[] = [];

  if (!mem) return { identity, projects, achievements, links, reusableSnippets, missingEvidence: ['No memory provided'] };

  if (mem.profile?.name) identity.push(mem.profile.name);
  if (mem.profile?.bio) identity.push(mem.profile.bio);
  if (mem.profile?.currentFocus) identity.push(mem.profile.currentFocus);

  const answerLower = answer.toLowerCase();

  for (const project of mem.projects || []) {
    if (!project.name) continue;
    const mentioned = answerLower.includes(project.name.toLowerCase());
    const explained = mentioned && project.oneLiner && answerLower.includes(project.oneLiner.toLowerCase());
    projects.push({ name: project.name, oneLiner: project.oneLiner || '', mentionedInAnswer: mentioned, explainedInAnswer: !!explained, relevanceToBrief: 'medium', suggestedUse: project.oneLiner || '' });
  }

  for (const achievement of mem.achievements || []) {
    if (!achievement.title) continue;
    achievements.push({ title: achievement.title, relevanceToBrief: 'medium', suggestedUse: achievement.description || '' });
  }

  for (const [label, url] of Object.entries(mem.links || {})) {
    if (!url) continue;
    let type = 'other';
    if (url.includes('github')) type = 'github';
    else if (url.includes('linkedin')) type = 'linkedin';
    else if (url.includes('video')) type = 'video';
    links.push({ label, url, type, relevantRequirementIds: [] });
  }

  for (const snippet of mem.snippets || []) {
    if (!snippet.text) continue;
    reusableSnippets.push({ title: snippet.title || '', text: snippet.text, relevance: 'medium' });
  }

  if (mem.projects?.length && !projects.length) missingEvidence.push('No projects mentioned in answer');

  return { identity, projects, achievements, links, reusableSnippets, missingEvidence };
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

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function speakingTime(wc: number): number {
  return Math.round((wc / 145) * 60);
}

function detectLinks(text: string): string[] {
  return (text.match(/https?:\/\/[^\s)\]]+/gi) || []).filter(Boolean);
}

function detectGenericPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.filter(p => lower.includes(p));
}

export function runDeterministicChecks(answer: string, _briefAnalysis?: unknown, _evidenceBank?: unknown): DeterministicChecks {
  const linksFound = detectLinks(answer);
  const wordTotal = wordCount(answer);
  const speakSeconds = speakingTime(wordTotal);
  const genericHits = detectGenericPhrases(answer);

  let lengthStatus: DeterministicChecks['lengthFit']['status'] = 'unknown';
  let lengthNote = '';
  if (wordTotal > 0) {
    if (wordTotal < 120) {
      lengthStatus = 'tooShort';
      lengthNote = `${wordTotal} words — target ~145-220 for 60-90s`;
    } else if (wordTotal > 240) {
      lengthStatus = 'tooLong';
      lengthNote = `${wordTotal} words — trim to ~200`;
    } else {
      lengthStatus = 'fits';
      lengthNote = `${wordTotal} words (~${speakSeconds}s) — in range`;
    }
  }

  return {
    wordCount: wordTotal,
    speakingTimeSeconds: speakSeconds,
    lengthFit: { status: lengthStatus, note: lengthNote },
    links: {
      urlsFound: linksFound,
      requiredLinksMissing: [],
      savedLinksAvailable: [],
    },
    genericPhrases: genericHits.map(p => ({ phrase: p, replacementSuggestion: 'Replace with a specific detail from your work' })),
    projectExplanationWarnings: [],
    memoryUsage: { usedProjects: [], unusedRelevantProjects: [], note: '' },
    formattingIssues: [],
  };
}

export function computeRequirementCoverage(briefAnalysis: unknown, answer: string, _deterministicChecks?: unknown): RequirementCoverageOutput {
  const analysis = briefAnalysis as { explicitRequirements?: string[] };
  const reqs = analysis?.explicitRequirements || [];
  const answerLower = answer.toLowerCase();
  const items = reqs.map((req: string) => {
    const lowerReq = req.toLowerCase();
    const tokens = lowerReq.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t: string) => t.length > 3);
    const matched = tokens.filter((t: string) => answerLower.includes(t));
    const covered = tokens.length > 0 && matched.length / tokens.length >= 0.5;
    return {
      requirement: req,
      status: covered ? 'covered' : 'missing',
      note: covered ? `Found: ${matched.slice(0, 2).join(', ')}` : 'No direct evidence',
      evidenceFound: covered ? `Covered by matched terms` : 'Not found',
      whatToAdd: covered ? '' : `Add one sentence about: ${req.slice(0, 50)}`,
      priority: covered ? 'low' as const : 'high' as const,
    };
  });
  return { items };
}

export function buildReviewerPanel(
  briefAnalysis: unknown,
  answer: string,
  _evidenceBank: unknown,
  deterministicChecks: unknown,
  coverage: RequirementCoverageOutput,
  applicationType: string,
  strictness: string
): ReviewerPanel {
  const checks = deterministicChecks as DeterministicChecks;
  const genericPhrases = checks?.genericPhrases || [];
  const wordTotal = checks?.wordCount || wordCount(answer);
  const speakSeconds = checks?.speakingTimeSeconds || speakingTime(wordTotal);
  const missingCount = coverage.items.filter(i => i.status === 'missing').length;
  const partialCount = coverage.items.filter(i => i.status === 'partial').length;

  const reviewer = (score: number, verdict: string, findings: string[], fixes: string[]) =>
    ({ score: clamp(score), verdict, specificFindings: findings, fixes });

  return {
    requirements: reviewer(
      clamp(100 - missingCount * 15 - partialCount * 7),
      missingCount > 0 ? 'Requirements need attention' : 'Requirements largely covered',
      [`${coverage.items.filter(i => i.status === 'covered').length}/${coverage.items.length} covered`, missingCount > 0 ? `Missing: ${coverage.items.find(i => i.status === 'missing')?.requirement?.slice(0, 40)}` : 'All addressed'],
      missingCount > 0 ? ['Address all missing requirements'] : []
    ),
    fit: reviewer(
      clamp(90 - genericPhrases.length * 10),
      genericPhrases.length > 0 ? 'Fit reads generic' : 'Fit reads specific',
      genericPhrases.length > 0 ? [`Generic: ${genericPhrases[0]?.phrase}`] : ['No generic phrases'],
      genericPhrases.length > 0 ? ['Replace with specific alignment'] : []
    ),
    clarity: reviewer(
      clamp(90),
      'Readable and direct',
      [`${wordTotal} words (~${speakSeconds}s)`, 'Good sentence structure'],
      []
    ),
    evidence: reviewer(
      clamp(85 - (checks?.projectExplanationWarnings?.length || 0) * 12),
      'Evidence is solid',
      ['Evidence anchored in answer'],
      (checks?.projectExplanationWarnings?.length || 0) > 0 ? ['Explain named projects'] : []
    ),
    length: reviewer(
      clamp(100 - Math.abs(wordTotal - 170) / 3),
      wordTotal >= 120 && wordTotal <= 240 ? 'Length is in range' : 'Length needs adjustment',
      [`${wordTotal} words (~${speakSeconds}s at 145 wpm)`],
      wordTotal < 120 ? ['Add content'] : wordTotal > 240 ? ['Trim excess'] : []
    ),
    voice: reviewer(
      clamp(92 - genericPhrases.length * 6),
      genericPhrases.length > 0 ? 'Voice needs personality' : 'Voice feels human',
      genericPhrases.length > 0 ? [`Generic: ${genericPhrases.map((g: { phrase: string }) => g.phrase).join(', ')}`] : ['Voice is original'],
      genericPhrases.length > 0 ? ['Replace generic phrases'] : []
    ),
    risk: reviewer(
      clamp(95 - missingCount * 10 - genericPhrases.length * 5),
      missingCount > 0 ? 'Risk factors present' : 'Low submission risk',
      missingCount > 0 ? [`${missingCount} missing requirement(s)`] : ['No risks detected'],
      missingCount > 0 ? ['Complete missing requirements'] : []
    ),
  };
}

export function scoreReview(reviewerPanel: ReviewerPanel): number {
  const weights = { requirements: 0.35, fit: 0.2, evidence: 0.15, clarity: 0.1, length: 0.1, risk: 0.1 };
  const keys = Object.keys(weights) as (keyof typeof weights)[];
  const score = keys.reduce((acc, key) => acc + reviewerPanel[key].score * weights[key], 0);
  return Math.round(clamp(score));
}

export function getStatusFromScore(score: number): string {
  if (score >= 85) return 'ready_minor_polish';
  if (score >= 70) return 'close_needs_edits';
  if (score >= 50) return 'needs_major_fixes';
  return 'not_ready';
}

export function buildReadinessReport(
  score: number,
  status: string,
  nextBestEdit: { action: string; why: string; expectedImpact?: string },
  fixPlan: { step?: number; title: string; why: string; effort: string; impact: string; suggestedText?: string }[],
  coverage: RequirementCoverageOutput,
  reviewerPanel: ReviewerPanel,
  deterministicChecks: DeterministicChecks
): ReadinessReportOutput {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const strongPoints: string[] = [];

  const missing = coverage.items.filter(i => i.status === 'missing');
  if (missing.length > 0) criticalIssues.push(`${missing.length} requirement(s) missing`);

  if (deterministicChecks?.links?.requiredLinksMissing?.length > 0) {
    criticalIssues.push(`MISSING Link: ${deterministicChecks.links.requiredLinksMissing.join(', ')}`);
  }

  if (deterministicChecks?.lengthFit?.status === 'tooShort') {
    criticalIssues.push(`Too short: ${deterministicChecks.lengthFit.note}`);
  }

  if (deterministicChecks?.genericPhrases?.length > 0) {
    warnings.push(`Generic: ${deterministicChecks.genericPhrases.map(g => g.phrase).join(', ')}`);
  }

  if (coverage.items.filter(i => i.status === 'covered').length >= coverage.items.length * 0.7) {
    strongPoints.push('Most requirements covered');
  }

  if (deterministicChecks?.links?.urlsFound?.length > 0) strongPoints.push('Link(s) present');

  const verdicts: Record<string, string> = {
    ready_minor_polish: 'Ready with minor edits',
    close_needs_edits: 'Close but needs edits',
    needs_major_fixes: 'Needs major fixes',
    not_ready: 'Not ready for submission',
  };

  return {
    score,
    status,
    verdict: verdicts[status] || 'Unknown',
    criticalIssues,
    warnings,
    strongPoints,
    fixOrder: [...criticalIssues, ...warnings].slice(0, 5),
    wordCount: deterministicChecks?.wordCount || 0,
    speakingTimeSeconds: deterministicChecks?.speakingTimeSeconds || 0,
    nextBestEdit: { action: nextBestEdit?.action || 'Unknown', why: nextBestEdit?.why || '' },
    fixPlan: (fixPlan || []).map((item, i) => ({ step: i + 1, title: item.title, why: item.why, effort: item.effort, impact: item.impact, suggestedText: item.suggestedText })),
  };
}

export function buildApplicationPacket(
  programName: string,
  applicationType: string,
  _strictness: string,
  readinessReport: unknown,
  _nextBestEdit: unknown,
  improvedAnswer: unknown
): PacketOutput {
  const report = readinessReport as ReadinessReportOutput;
  const improved = improvedAnswer as { improvedAnswer?: string; originalAnswer?: string } | undefined;
  return {
    programName,
    applicationType,
    overallScore: report?.score || 50,
    status: report?.verdict || 'Unknown',
    requiredLinks: [],
    submissionChecklist: (report?.fixPlan || []).map(item => ({ item: item.title, status: 'review' as const })),
    exportMarkdown: `# ${programName}\n\nScore: ${report?.score || 0}/100\n\n${improved?.improvedAnswer || improved?.originalAnswer || ''}`,
  };
}

function detectTargetLength(brief: string): { minWords?: number; maxWords?: number; minSeconds?: number; maxSeconds?: number } | undefined {
  const lower = brief.toLowerCase();
  const isVideo = /video|pitch|intro/i.test(brief);
  if (isVideo && /60.*90|90.*60|one.*minute/i.test(lower)) return { minWords: 145, maxWords: 220, minSeconds: 60, maxSeconds: 90 };
  const wordMatch = brief.match(/(\d+)\s*-\s*(\d+)\s*words?/i);
  if (wordMatch) return { minWords: parseInt(wordMatch[1]), maxWords: parseInt(wordMatch[2]) };
  return undefined;
}

function detectExplicitRequirements(brief: string): { id: string; text: string; type: string; priority: string }[] {
  const reqs: { id: string; text: string; type: string; priority: string }[] = [];
  const patterns: { regex: RegExp; type: string; priority: string; base: string }[] = [
    { regex: /tell us about yourself|introduce yourself|who are you/i, type: 'topic', priority: 'high', base: 'Tell us about yourself' },
    { regex: /what are you (building|working|excited)/i, type: 'topic', priority: 'high', base: "What you're building" },
    { regex: /why (this|fit|good fit)/i, type: 'topic', priority: 'high', base: 'Why this fits you' },
    { regex: /60.*90.*second|video/i, type: 'format', priority: 'high', base: '60-90 second video' },
    { regex: /public.*link|accessible.*link/i, type: 'link', priority: 'high', base: 'Public link' },
  ];
  for (const p of patterns) {
    if (p.regex.test(brief)) reqs.push({ id: `req_${reqs.length + 1}`, text: p.base, type: p.type, priority: p.priority });
  }
  return reqs;
}

export function parseBrief(brief: string, appType = 'fellowship'): { summary: string; explicitRequirements: { id: string; text: string; type: string; priority: string }[]; hiddenRequirements: { id: string; text: string; whyItMatters: string; priority: string }[]; requiredLinks: { type: string; required: boolean; foundInBrief: boolean; note: string }[]; targetLength?: { minWords?: number; maxWords?: number; minSeconds?: number; maxSeconds?: number }; risks: string[] } {
  const lower = brief.toLowerCase();
  const explicitRequirements = detectExplicitRequirements(brief);
  const requiredLinks: { type: string; required: boolean; foundInBrief: boolean; note: string }[] = [];
  if (/link|url|website| publicly/i.test(lower)) requiredLinks.push({ type: 'publicLink', required: true, foundInBrief: true, note: 'Public link required' });
  if (/video|demo/i.test(lower)) requiredLinks.push({ type: 'video', required: true, foundInBrief: true, note: 'Video or demo required' });
  const hiddenRequirements: { id: string; text: string; whyItMatters: string; priority: string }[] = [];
  if (/fellowship|accelerator/i.test(lower)) hiddenRequirements.push({ id: 'hidden_fit', text: 'Show specific alignment with program values', whyItMatters: 'Evaluators want to see why this fits your trajectory', priority: 'high' });
  hiddenRequirements.push({ id: 'hidden_specificity', text: 'Use specific details, not generic claims', whyItMatters: 'Generic answers are easily forgotten', priority: 'medium' });
  const risks: string[] = [];
  if (requiredLinks.some(r => r.type === 'publicLink') && !explicitRequirements.find(e => e.type === 'link')) risks.push('May miss required link');
  return { summary: brief.length > 50 ? brief.slice(0, 100) + '...' : brief, explicitRequirements, hiddenRequirements, requiredLinks, targetLength: detectTargetLength(brief), risks };
}
