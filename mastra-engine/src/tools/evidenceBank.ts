import { z } from 'zod';
import { ApplicationMemorySchema, EvidenceBankSchema } from '../schemas';

export const EvidenceBankInputSchema = z.object({
  memory: ApplicationMemorySchema.nullable(),
  answer: z.string(),
  briefAnalysis: z.any(),
});
export const EvidenceBankOutputSchema = EvidenceBankSchema;

export function evidenceBankTool(input: z.infer<typeof EvidenceBankInputSchema>): z.infer<typeof EvidenceBankOutputSchema> {
  if (!input.memory) {
    return {
      projects: [],
      achievements: [],
      links: [],
      personalAngles: [],
      reusableSnippets: [],
      answerSnippets: [],
    };
  }

  const mem = input.memory;
  const answerLower = input.answer.toLowerCase();

  const projects = mem.projects.flatMap((p) => {
    const relevant = answerLower.includes(p.name.toLowerCase());
    return relevant ? [p.name, p.oneLiner, p.longerExplanation, p.bestUseCase].filter(Boolean) : [];
  });

  const achievements = mem.achievements.flatMap((a) => {
    const relevant = answerLower.includes(a.title.toLowerCase()) || answerLower.includes(a.description.toLowerCase());
    return relevant ? [a.title, a.description, a.proof].filter(Boolean) : [];
  });

  const links: string[] = [];
  if (mem.linkVault.github) links.push(mem.linkVault.github);
  if (mem.linkVault.linkedin) links.push(mem.linkVault.linkedin);
  if (mem.linkVault.portfolio) links.push(mem.linkVault.portfolio);
  if (mem.linkVault.resume) links.push(mem.linkVault.resume);
  if (mem.linkVault.demoVideo) links.push(mem.linkVault.demoVideo);
  links.push(...mem.linkVault.projectLinks, ...mem.linkVault.otherLinks);

  const personalAngles: string[] = [];
  if (mem.profile.shortBio) personalAngles.push(mem.profile.shortBio);
  if (mem.profile.currentFocus) personalAngles.push(mem.profile.currentFocus);

  return {
    projects: Array.from(new Set(projects)),
    achievements: Array.from(new Set(achievements)),
    links: links.filter(Boolean),
    personalAngles: Array.from(new Set(personalAngles)),
    reusableSnippets: mem.snippets?.map((s) => s.title + ': ' + s.body) || [],
    answerSnippets: mem.snippets?.map((s) => s.body) || [],
  };
}