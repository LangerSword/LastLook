export interface EvidenceBankResult {
  projects: {
    name: string;
    oneLiner: string;
    mentioned: boolean;
    explained: boolean;
  }[];
  achievements: { title: string; mentioned: boolean }[];
  links: string[];
  personalAngles: string[];
  reusableSnippets: string[];
  missingEvidence: string[];
}

export interface MemoryData {
  profile?: { name?: string; bio?: string; currentFocus?: string };
  projects?: { name?: string; oneLiner?: string; description?: string; evidence?: string[] }[];
  achievements?: { title?: string; description?: string; proofLink?: string }[];
  linkVault?: { github?: string; linkedin?: string; portfolio?: string; demoVideo?: string };
}

export function buildEvidenceBank(memory: MemoryData, answer: string, briefAnalysis?: { explicitRequirements?: string[] }): EvidenceBankResult {
  const lowerAnswer = answer.toLowerCase();

  const projects = (memory.projects || []).map(p => ({
    name: p.name || '',
    oneLiner: p.oneLiner || p.description || '',
    mentioned: p.name ? lowerAnswer.includes(p.name.toLowerCase()) : false,
    explained: false,
  }));

  for (const proj of projects) {
    if (proj.mentioned && proj.oneLiner) {
      proj.explained = lowerAnswer.includes(proj.oneLiner.toLowerCase());
    }
  }

  const achievements = (memory.achievements || []).map(a => ({
    title: a.title || '',
    mentioned: a.title ? lowerAnswer.includes(a.title.toLowerCase()) : false,
  }));

  const links: string[] = [];
  if (memory.linkVault?.github) links.push(memory.linkVault.github);
  if (memory.linkVault?.linkedin) links.push(memory.linkVault.linkedin);
  if (memory.linkVault?.portfolio) links.push(memory.linkVault.portfolio);
  if (memory.linkVault?.demoVideo) links.push(memory.linkVault.demoVideo);

  const personalAngles: string[] = [];
  if (memory.profile?.currentFocus) {
    personalAngles.push(`Focus: ${memory.profile.currentFocus}`);
  }
  if (memory.profile?.name) {
    personalAngles.push(`Name: ${memory.profile.name}`);
  }

  const missingEvidence: string[] = [];

  const reqTopics = (briefAnalysis?.explicitRequirements || []).join(' ').toLowerCase();
  const hasMentionedProjects = projects.some(p => p.mentioned);
  if (reqTopics.includes('build') && !hasMentionedProjects) {
    missingEvidence.push('No projects mentioned in answer');
  }

  return {
    projects,
    achievements,
    links,
    personalAngles,
    reusableSnippets: [],
    missingEvidence,
  };
}