import { z } from 'zod';
import { MemoryProjectSchema } from '../schemas';

export const ProjectExplanationCheckInputSchema = z.object({
  answer: z.string(),
  memoryProjects: z.array(MemoryProjectSchema),
});
export const ProjectExplanationCheckOutputSchema = z.object({
  warnings: z.array(z.object({
    projectName: z.string(),
    issue: z.string(),
    suggestedOneLiner: z.string(),
  })),
});

export function projectExplanationCheckTool(input: z.infer<typeof ProjectExplanationCheckInputSchema>): z.infer<typeof ProjectExplanationCheckOutputSchema> {
  const lower = input.answer.toLowerCase();
  const warnings: { projectName: string; issue: string; suggestedOneLiner: string }[] = [];

  for (const project of input.memoryProjects) {
    const mentioned = lower.includes(project.name.toLowerCase());
    if (!mentioned) continue;

    const explained = [project.oneLiner, project.longerExplanation, project.bestUseCase].some(
      (n) => n && lower.includes(n.toLowerCase())
    );

    if (!explained) {
      warnings.push({
        projectName: project.name,
        issue: `"${project.name}" is mentioned but the evaluator will not know what it does without an explanation.`,
        suggestedOneLiner: `${project.name} — ${project.oneLiner}`,
      });
    }
  }

  return { warnings };
}