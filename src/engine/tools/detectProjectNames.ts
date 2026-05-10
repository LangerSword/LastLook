export interface ProjectNameResult {
  projects: {
    name: string;
    mentioned: boolean;
    explained: boolean;
    explanation?: string;
    suggestion?: string;
  }[];
  unexplainedCount: number;
}

export interface MemoryProject {
  name: string;
  oneLiner?: string;
  longerExplanation?: string;
  bestUseCase?: string;
}

export function detectProjectNamesWithoutExplanation(
  answer: string,
  projects: MemoryProject[]
): ProjectNameResult {
  const lowerAnswer = answer.toLowerCase();
  const result: ProjectNameResult = {
    projects: [],
    unexplainedCount: 0,
  };

  for (const project of projects) {
    if (!project.name) continue;

    const mentioned = lowerAnswer.includes(project.name.toLowerCase());
    const oneLiner = project.oneLiner?.toLowerCase() || '';
    const longerExp = project.longerExplanation?.toLowerCase() || '';
    const bestUse = project.bestUseCase?.toLowerCase() || '';

    const explained = mentioned && (
      lowerAnswer.includes(oneLiner) ||
      lowerAnswer.includes(longerExp) ||
      lowerAnswer.includes(bestUse)
    );

    result.projects.push({
      name: project.name,
      mentioned,
      explained,
      explanation: explained ? (project.oneLiner || project.longerExplanation) : undefined,
      suggestion: !explained ? `Add: ${project.name} — ${project.oneLiner || 'one-liner'}` : undefined,
    });

    if (mentioned && !explained) {
      result.unexplainedCount++;
    }
  }

  return result;
}