export interface MemoryOpportunityMapping {
  alignment: string;
  evidence: string;
  gaps: string[];
  score: number;
}

export interface MemoryProfile {
  currentFocus?: string;
  bio?: string;
}

export interface Opportunity {
  programName?: string;
  applicationType?: string;
  brief?: string;
}

export function mapMemoryToOpportunity(memory: MemoryProfile, opportunity: Opportunity): MemoryOpportunityMapping {
  const alignment: string[] = [];
  const gaps: string[] = [];
  let score = 50;

  const currentFocus = memory.currentFocus?.toLowerCase() || '';
  const brief = opportunity.brief?.toLowerCase() || '';
  const appType = opportunity.applicationType?.toLowerCase() || '';

  if (currentFocus && brief) {
    if (brief.includes('ai') && currentFocus.includes('ai')) {
      alignment.push('Current focus aligns with AI focus');
      score += 15;
    }
    if (brief.includes('infrastructure') && currentFocus.includes('infrastructure')) {
      alignment.push('Infrastructure experience relevant');
      score += 15;
    }
    if (brief.includes('systems') && currentFocus.includes('systems')) {
      alignment.push('Systems experience relevant');
      score += 10;
    }
  }

  if (appType.includes('fellowship') && currentFocus) {
    alignment.push(`Focus on "${currentFocus}" fits fellowship`);
    score += 10;
  }

  if (alignment.length === 0) {
    gaps.push('No clear connection between memory and opportunity');
    score -= 10;
  }

  return {
    alignment: alignment.join('; ') || 'No specific alignment found',
    evidence: alignment.length > 0 ? alignment[0] : 'No evidence of fit',
    gaps,
    score: Math.max(0, Math.min(100, score)),
  };
}