import type { ReviewInput } from "../types";

const activateIntroVideo: ReviewInput = {
  opportunity: {
    programName: "Activate Fellowship 2026",
    applicationType: "fellowship",
    deadline: "2026-06-15",
    targetFormat: "videoScript",
    targetWords: 165,
    targetSeconds: 90,
    strictness: "balanced",
  },
  brief: "We'd love a 60–90 second intro video. Tell us a bit about yourself, what you're building or excited by right now, and why this fellowship feels like a good fit for you. Ensure the link is publicly accessible.",
  answer: "I'm Lakshaya, a 19-year-old builder interested in AI and systems. I'm building Regenera and AgentMesh, and I like making useful tools. This fellowship seems exciting because I want to learn from smart people and build faster.",
  memory: {
    profile: {
      name: "Lakshaya Sharma",
      bio: "19-year-old builder interested in AI infrastructure, systems projects, and practical student tools.",
      currentFocus: "AI infrastructure and practical student tools",
      preferredTone: "confident",
    },
    projects: [
      {
        name: "AgentMesh",
        oneLiner: "Infrastructure that helps AI agents use APIs, MCPs, and machine-readable workflows instead of brittle browser clicking.",
        description: "Building infrastructure for AI agents",
        tags: ["AI", "agents", "infrastructure", "APIs"],
        links: ["https://agentmesh.dev"],
        evidence: ["Shipped MVP to 50 users"],
      },
      {
        name: "Regenera",
        oneLiner: "A forensic recovery system that reconstructs deleted data from leftover traces and metadata.",
        description: "Data recovery for forensic analysis",
        tags: ["systems", "forensics", "data"],
        links: ["https://regenera.dev"],
        evidence: ["Recovered 10GB of_test data"],
      },
      {
        name: "NetSieve",
        oneLiner: "A real-time network intrusion detection system and cryptographic forensic logger.",
        description: "Network security tool",
        tags: ["security", "networking", "cryptography"],
        links: ["https://netsieve.dev"],
        evidence: ["Detected 1000+ intrusions"],
      },
    ],
    achievements: [
      {
        title: "Built AgentMesh from scratch",
        description: "Shipped MVP to 50 beta users",
        proofLink: "https://agentmesh.dev",
      },
      {
        title: "First place hackathon winner",
        description: "Won MLH local hackathon",
        proofLink: "",
      },
    ],
    links: {
      github: "https://github.com/lakshaya",
      portfolio: "https://lakshaya.dev",
      demoVideo: "https://demo.lakshaya.devintro",
    },
    snippets: [],
  },
};

const weakAnswer: ReviewInput = {
  opportunity: {
    programName: "Test Program",
    applicationType: "fellowship",
    targetFormat: "written",
    strictness: "balanced",
  },
  brief: "Tell us about yourself and why you want to join.",
  answer: "I am passionate about technology and want to make an impact. This seems like an exciting opportunity to grow as a person.",
  memory: {
    profile: {
      name: "Test User",
      bio: "Builder",
      currentFocus: "building things",
      preferredTone: "confident",
    },
    projects: [],
    achievements: [],
    links: {},
    snippets: [],
  },
};

const strongAnswer: ReviewInput = {
  opportunity: {
    programName: "Tech Accelerator",
    applicationType: "accelerator",
    targetFormat: "written",
    strictness: "balanced",
  },
  brief: "Tell us about your startup, what problem you're solving, and why you're the right team.",
  answer: "I'm building AgentMesh to solve AI agent reliability. Most AI agents fall apart when websites change - we use APIs and machine-readable workflows instead. Our MVP already helps 50 developers ship more reliable agents. I have 3 years of infrastructure experience and my cofounder is a former staff engineer at a major AI company. We're applying because we need the network and feedback from people who've scaled infrastructure before.",
  memory: {
    profile: {
      name: "Alex Chen",
      bio: "Infrastructure engineer, 3 years building distributed systems",
      currentFocus: "AI agent reliability",
      preferredTone: "technical",
    },
    projects: [
      {
        name: "AgentMesh",
        oneLiner: "Infrastructure for reliable AI agents using APIs instead of browser automation",
        description: "AI agent reliability framework",
        tags: ["AI", "infrastructure"],
        links: ["https://agentmesh.dev"],
        evidence: ["50 developers"],
      },
    ],
    achievements: [
      {
        title: "Staff Engineer",
        description: "Former staff at major AI company",
        proofLink: "",
      },
    ],
    links: {
      github: "https://github.com/alex",
      portfolio: "https://alexchen.dev",
    },
    snippets: [],
  },
};

const missingLinks: ReviewInput = {
  opportunity: {
    programName: "Video Fellowship",
    applicationType: "fellowship",
    targetFormat: "videoScript",
    strictness: "balanced",
  },
  brief: "Submit a 60-90 second video. Make sure to include a link to your portfolio.",
  answer: "Hi, I'm building a tool for students. Check out my work at [link]. I think this fellowship would help me grow.",
  memory: {
    profile: {
      name: "Jordan",
      bio: "Student builder",
      currentFocus: "student tools",
      preferredTone: "friendly",
    },
    projects: [
      {
        name: "StudyBuddy",
        oneLiner: "AI tutoring assistant for students",
        description: "Study tool",
        tags: ["education", "AI"],
        links: ["https://studybuddy.app"],
        evidence: [],
      },
    ],
    achievements: [],
    links: {
      portfolio: "https://portfolio.com/jordan",
    },
    snippets: [],
  },
};

const emptyAnswer: ReviewInput = {
  opportunity: {
    programName: "Quick Application",
    applicationType: "internship",
    targetFormat: "written",
    strictness: "gentle",
  },
  brief: "Tell us why you want this internship.",
  answer: "",
  memory: {
    profile: {
      name: "Sam",
      bio: "CS student",
      currentFocus: "web development",
      preferredTone: "confident",
    },
    projects: [
      {
        name: "Personal Website",
        oneLiner: "My portfolio website",
        tags: ["web"],
        links: ["https://sam.dev"],
        evidence: [],
      },
    ],
    achievements: [],
    links: {
      portfolio: "https://sam.dev",
    },
    snippets: [],
  },
};

const allFixtures = {
  activateIntroVideo,
  weakAnswer,
  strongAnswer,
  missingLinks,
  emptyAnswer,
};

export type FixtureName = keyof typeof allFixtures;

export function getFixture(name: FixtureName): ReviewInput {
  return allFixtures[name];
}

export function getAllFixtures(): { name: FixtureName; input: ReviewInput }[] {
  return Object.entries(allFixtures).map(([name, input]) => ({
    name: name as FixtureName,
    input,
  }));
}

export const expectedResults: Record<FixtureName, {
  wordCount?: { min?: number; max?: number };
  statuses: { requirement: string; status: "covered" | "partial" | "missing" }[];
  nextBestEdit?: { actionContains?: string };
  hasGenericPhrases: boolean;
  hasMissingLink: boolean;
  scoreMin?: number;
  scoreMax?: number;
}> = {
  activateIntroVideo: {
    wordCount: { max: 80 },
    statuses: [
      { requirement: "Tell us about yourself", status: "partial" },
      { requirement: "what you're building", status: "partial" },
      { requirement: "publicly accessible", status: "missing" },
    ],
    nextBestEdit: { actionContains: "AgentMesh" },
    hasGenericPhrases: true,
    hasMissingLink: true,
    scoreMin: 50,
    scoreMax: 70,
  },
  weakAnswer: {
    wordCount: { max: 30 },
    statuses: [
      { requirement: "Tell us about yourself", status: "partial" },
      { requirement: "why you want to join", status: "partial" },
    ],
    hasGenericPhrases: true,
    hasMissingLink: false,
    scoreMin: 60,
    scoreMax: 80,
  },
  strongAnswer: {
    statuses: [
      { requirement: "what problem you're solving", status: "covered" },
      { requirement: "why you're the right team", status: "covered" },
    ],
    hasGenericPhrases: false,
    hasMissingLink: false,
    scoreMin: 80,
    scoreMax: 95,
  },
  missingLinks: {
    statuses: [{ requirement: "link", status: "partial" }],
    hasGenericPhrases: false,
    hasMissingLink: true,
    scoreMin: 55,
    scoreMax: 80,
  },
  emptyAnswer: {
    wordCount: { max: 5 },
    statuses: [{ requirement: "why you want this internship", status: "missing" }],
    hasGenericPhrases: false,
    hasMissingLink: false,
    scoreMin: 0,
    scoreMax: 90,
  },
};

export default allFixtures;