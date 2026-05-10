export interface CoverageItem {
  requirement: string;
  status: 'covered' | 'partial' | 'missing';
  evidence: string;
  gap: string;
  whatToAdd: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CoverageResult {
  items: CoverageItem[];
  covered: number;
  partial: number;
  missing: number;
}

export interface BriefAnalysisForCoverage {
  explicitRequirements?: string[];
}

export interface EvidenceBankData {
  projects: { name: string; oneLiner: string; mentioned: boolean }[];
  achievements: { title: string; mentioned: boolean }[];
  links: string[];
}

export interface DeterministicChecksData {
  genericPhrases?: { phrase: string }[];
  links?: { required: string[]; missing: string[] };
}

export function matchRequirementCoverage(
  briefAnalysis: BriefAnalysisForCoverage,
  answer: string,
  evidenceBank: EvidenceBankData,
  deterministicChecks: DeterministicChecksData
): CoverageResult {
  const requirements = briefAnalysis.explicitRequirements || [];
  const lowerAnswer = answer.toLowerCase();

  const items: CoverageItem[] = [];
  let covered = 0;
  let partial = 0;
  let missing = 0;

  for (const req of requirements) {
    const reqLower = req.toLowerCase();
    const reqWords = reqLower.split(/\s+/).filter(w => w.length > 3);

    const matchedWords = reqWords.filter(word => lowerAnswer.includes(word));
    const hasEvidence = matchedWords.length >= reqWords.length * 0.5;
    const hasProjectEvidence = evidenceBank.projects.some(p =>
      p.mentioned && p.oneLiner && lowerAnswer.includes(p.oneLiner.toLowerCase())
    );
    const hasLink = reqLower.includes('link') && (deterministicChecks.links?.missing?.length === 0 || deterministicChecks.links?.required?.length);

    let status: CoverageItem['status'] = 'missing';
    if (hasEvidence || hasProjectEvidence || hasLink) {
      status = 'covered';
      covered++;
    } else if (matchedWords.length > 0) {
      status = 'partial';
      partial++;
    } else {
      missing++;
    }

    let evidence = '';
    let gap = '';
    let whatToAdd = '';

    if (status === 'covered') {
      evidence = matchedWords.length > 0 ? `Found: "${matchedWords.slice(0, 2).join(', ')}"` : 'Evidence from memory projects';
    } else if (reqLower.includes('link')) {
      evidence = 'No link detected in answer';
      gap = 'Required link not found';
      whatToAdd = 'Add a public link to your work';
    } else {
      gap = 'Requirement not addressed in answer';
      whatToAdd = `Add one sentence about: ${req}`;
    }

    const priority: CoverageItem['priority'] = reqLower.includes('video') || reqLower.includes('link')
      ? 'high'
      : status === 'missing' ? 'high' : 'medium';

    items.push({ requirement: req, status, evidence, gap, whatToAdd, priority });
  }

  return { items, covered, partial, missing };
}