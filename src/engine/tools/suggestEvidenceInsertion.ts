export interface EvidenceSuggestion {
  location: string;
  insertThis: string;
  why: string;
}

export function suggestEvidenceInsertion(
  answer: string,
  evidenceBank: { projects: { name: string; oneLiner: string; mentioned: boolean }[]; achievements: { title: string; mentioned: boolean }[] }
): EvidenceSuggestion[] {
  const suggestions: EvidenceSuggestion[] = [];
  const lowerAnswer = answer.toLowerCase();

  for (const project of evidenceBank.projects) {
    if (project.mentioned && project.oneLiner && !lowerAnswer.includes(project.oneLiner.toLowerCase())) {
      suggestions.push({
        location: `After first mention of "${project.name}"`,
        insertThis: `${project.name} — ${project.oneLiner}`,
        why: 'Explain what the project does',
      });
    }
  }

  for (const achievement of evidenceBank.achievements) {
    if (!achievement.mentioned && evidenceBank.projects.length === 0) {
      suggestions.push({
        location: 'In the body',
        insertThis: achievement.title,
        why: 'Add an achievement to build credibility',
      });
    }
  }

  return suggestions;
}