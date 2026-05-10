export interface ApplicationPacketResult {
  programName: string;
  applicationType: string;
  overallScore: number;
  status: string;
  finalAnswers: string[];
  requirementChecklist: { requirement: string; status: string }[];
  fixPlan: { step: number; title: string; effort: string; impact: string }[];
  exportMarkdown: string;
}

export interface ReviewData {
  programName?: string;
  applicationType?: string;
  overallScore?: number;
  status?: string;
  finalAnswer?: string;
  requirementCoverage?: { requirement: string; status: string }[];
  nextBestEdit?: { action: string; suggestedText?: string };
  fixPlan?: { step: number; title: string; effort?: string; impact?: string }[];
}

export function buildApplicationPacket(
  programName: string,
  finalAnswer: string,
  reviewResult: ReviewData,
  applicationType: string = 'Other'
): ApplicationPacketResult {
  const checklist = (reviewResult.requirementCoverage || []).map(item => ({
    requirement: item.requirement,
    status: item.status,
  }));

  const fixPlan = (reviewResult.fixPlan || []).slice(0, 5).map(item => ({
    step: item.step,
    title: item.title,
    effort: item.effort || '3 min',
    impact: item.impact || 'medium',
  }));

  const markdown = [
    `# ${programName}`,
    ``,
    `## Readiness`,
    `- Score: ${reviewResult.overallScore || 0}/100`,
    `- Status: ${reviewResult.status || 'Unknown'}`,
    ``,
    `## Requirement Checklist`,
    ...checklist.map(c => `- [${c.status === 'covered' ? 'x' : ' '}] ${c.requirement}`),
    ``,
    `## Fix Plan`,
    ...fixPlan.map(f => `- ${f.step}. ${f.title} (${f.effort}, ${f.impact})`),
    ``,
    `## Final Answer`,
    finalAnswer,
  ].join('\n');

  return {
    programName,
    applicationType,
    overallScore: reviewResult.overallScore || 0,
    status: reviewResult.status || 'Unknown',
    finalAnswers: [finalAnswer],
    requirementChecklist: checklist,
    fixPlan,
    exportMarkdown: markdown,
  };
}