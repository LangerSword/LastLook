export interface ReviewWorkflowFixture {
  name: string;
  description: string;
  input: {
    brief: string;
    question: string;
    answer: string;
    memory: {
      profile: {
        name: string;
        bio: string;
        currentFocus: string;
        preferredTone: string;
      };
      projects: {
        name: string;
        oneLiner: string;
        description: string;
        tags: string[];
        links: string[];
        bestUseCase: string;
      }[];
      achievements: {
        title: string;
        description: string;
        proof: string;
        category: string;
      }[];
      linkVault: {
        github: string;
        linkedin: string;
        portfolio: string;
        resume: string;
        demoVideo: string;
        projectLinks: string[];
        otherLinks: string[];
      };
      answerLibrary: { title: string; body: string; tags: string[] }[];
      preferences: {
        preferredTone: string;
        preferredApplicationTypes: string[];
        timezone?: string;
        notes?: string;
      };
    };
    programName: string;
    applicationType: string;
    reviewStrictness: string;
    targetLength: string;
  };
}

export const fixtures: Record<string, ReviewWorkflowFixture> = {
  laknishIntroVideo: {
    name: 'Lakshaya — Intro Video (Weak)',
    description: '19yo builder, 3 AI infra projects, intro video fellowship, too short and generic',
    input: {
      brief: 'Record a 60-90 second video introducing yourself. Tell us who you are, what you\'re building right now, and why this fellowship feels like a good fit. Make sure your link is publicly accessible.',
      question: 'Introduce yourself in a 60-90 second video.',
      answer: "I'm Lakshaya, I'm interested in AI and systems. I build things. I'm working on Regenera and AgentMesh and NetSieve. This fellowship would help me learn faster.",
      memory: {
        profile: {
          name: 'Lakshaya',
          bio: '19-year-old builder who thinks the best way to understand systems is to build them from scratch.',
          currentFocus: 'Building AI infrastructure tools that solve real problems, not demos or wrappers',
          preferredTone: 'confident',
        },
        projects: [
          {
            name: 'Regenera',
            oneLiner: 'A forensic recovery system that reconstructs deleted data from file system traces',
            description: 'Filesystem-level data recovery tool for Linux that analyzes residual metadata to reconstruct deleted files.',
            tags: ['AI', 'systems', 'infrastructure', 'forensics'],
            links: [],
            bestUseCase: 'Demonstrates deep systems understanding and practical problem-solving',
          },
          {
            name: 'AgentMesh',
            oneLiner: 'Infrastructure for AI agents — connectors, APIs, and machine-readable workflows for agent collaboration',
            description: 'Tooling that helps AI agents use tools, APIs, and communicate with each other via MCPs.',
            tags: ['AI', 'agents', 'infrastructure', 'MCP'],
            links: [],
            bestUseCase: 'Shows hands-on AI infrastructure work',
          },
          {
            name: 'NetSieve',
            oneLiner: 'Real-time intrusion detection with a cryptographic audit trail',
            description: 'Network security tool that detects anomalies and maintains cryptographically verifiable logs.',
            tags: ['security', 'networks', 'cryptography'],
            links: [],
            bestUseCase: 'Demonstrates breadth across AI, systems, and security',
          },
        ],
        achievements: [
          {
            title: 'Shipped 3 working projects',
            description: 'Built and shipped Regenera, AgentMesh, and NetSieve as working tools, not demos.',
            proof: 'github.com/lakshaya',
            category: 'building',
          },
        ],
        linkVault: {
          github: 'https://github.com/lakshaya',
          linkedin: '',
          portfolio: 'https://lakshaya.dev',
          resume: '',
          demoVideo: '',
          projectLinks: [],
          otherLinks: [],
        },
        answerLibrary: [],
        preferences: {
          preferredTone: 'confident',
          preferredApplicationTypes: ['Fellowship'],
          notes: '',
        },
      },
      programName: 'Builder Fellowship',
      applicationType: 'Fellowship',
      reviewStrictness: 'Balanced',
      targetLength: '150 words',
    },
  },
};

export function getFixture(name: string): ReviewWorkflowFixture | null {
  return fixtures[name] || null;
}
