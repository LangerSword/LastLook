import type { ApplicationMemory } from './types';

export const sampleProfile: ApplicationMemory = {
  profile: {
    name: 'Lakshaya Sharma',
    shortBio: '19-year-old builder interested in AI infrastructure, systems projects, and practical student tools.',
    currentFocus: 'Building small useful AI products, agent-native software, and systems projects.',
    preferredTone: 'confident, direct, builder-like',
    locationTimezone: '',
  },
  projects: [
    {
      name: 'Regenera',
      oneLiner: 'A forensic recovery system that reconstructs deleted data from leftover traces and metadata.',
      longerExplanation: 'Regenera focuses on data recovery workflows and trace analysis for deleted or partially erased evidence.',
      tags: ['forensics', 'systems', 'reverse engineering'],
      links: [],
      proof: '',
      bestUseCase: 'Use when the application values systems thinking, recovery workflows, or forensic tooling.',
    },
    {
      name: 'AgentMesh',
      oneLiner: 'Infrastructure that helps AI agents use APIs, MCPs, and machine-readable workflows instead of brittle browser clicking.',
      longerExplanation: 'AgentMesh makes agent-native workflows more reliable by giving agents structured tool access.',
      tags: ['AI agents', 'infrastructure', 'MCP', 'startups'],
      links: [],
      proof: '',
      bestUseCase: 'Use when the application wants builder identity, AI infrastructure, or product execution.',
    },
    {
      name: 'NetSieve',
      oneLiner: 'A real-time network intrusion detection system and cryptographic forensic logger.',
      longerExplanation: 'NetSieve combines security telemetry with tamper-evident logging for practical incident analysis.',
      tags: ['cybersecurity', 'C', 'IDS', 'forensics'],
      links: [],
      proof: '',
      bestUseCase: 'Use when the opportunity rewards technical depth, security work, or infrastructure chops.',
    },
  ],
  achievements: [
    {
      title: 'Built and presented technical projects',
      description: 'Built and presented projects in cybersecurity, AI, and systems.',
      proof: '',
      category: 'builder proof',
    },
  ],
  answerLibrary: [
    {
      title: 'Builder intro',
      body: 'I build systems that turn messy inputs into clear, operational outcomes.',
      tags: ['intro', 'builder story'],
    },
  ],
  linkVault: {
    github: 'https://github.com/example',
    linkedin: '',
    portfolio: 'https://example.com',
    resume: '',
    demoVideo: '',
    projectLinks: [],
    otherLinks: [],
  },
  preferences: {
    preferredTone: 'confident, direct, builder-like',
    preferredApplicationTypes: ['Fellowship'],
    timezone: '',
    notes: '',
  },
  updatedAt: undefined,
};

export const sampleBrief = `We'd love a 60–90 second intro video. Tell us a bit about yourself, what you're building or excited by right now, and why this fellowship feels like a good fit for you. Ensure the link is publicly accessible.`;

export const sampleQuestion = `Tell us about yourself, what you're building, and why this fellowship feels like a good fit.`;

export const sampleWeakAnswer = `I'm Lakshaya, a 19-year-old builder interested in AI and systems. I'm building Regenera and AgentMesh, and I like making useful tools. This fellowship seems exciting because I want to learn from smart people and build faster.`;
