export interface UnsupportedClaim {
  claim: string;
  evidence: string;
  suggestion: string;
}

export function findUnsupportedClaims(answer: string, evidenceBank: { projects: { name: string; mentioned: boolean; explained: boolean }[] }): UnsupportedClaim[] {
  const claims: UnsupportedClaim[] = [];
  const lowerAnswer = answer.toLowerCase();

  const claimPatterns = [
    { pattern: /built\s+(\w+)/i, name: 'built project' },
    { pattern: /shipped\s+(\w+)/i, name: 'shipped product' },
    { pattern: /created\s+(\w+)/i, name: 'created project' },
    { pattern: /won\s+(\w+)/i, name: 'won something' },
    { pattern: /(\d+)\s+users/i, name: 'user count' },
    { pattern: /(\d+)%\s+(growth|improvement)/i, name: 'percentage claim' },
  ];

  for (const { pattern, name } of claimPatterns) {
    const matches = answer.match(pattern);
    if (matches) {
      const hasEvidence = evidenceBank.projects.some(p =>
        p.mentioned && (lowerAnswer.includes(p.name.toLowerCase()) || p.explained)
      );

      if (!hasEvidence) {
        claims.push({
          claim: matches[0],
          evidence: 'No supporting evidence in memory',
          suggestion: 'Add a metric, user count, or outcome',
        });
      }
    }
  }

  return claims;
}