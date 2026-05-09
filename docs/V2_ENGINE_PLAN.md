# LastLook V2 Engine Plan

## What is Being Kept

### Frontend (Visual Shell)
- Current UI pages: LandingPage, AppWorkspace, DashboardPage, MemoryPage, ReviewsPage, ReviewDetailPage
- AppShell, Sidebar, TopBar layout components
- Theme system and CSS variables
- Framer Motion components
- Tweak Lab UI components
- ReviewStudio, ReviewStepper components

### Auth/Storage
- Supabase auth integration
- localStorage fallback (`lastlook_memory_v1`)
- Memory loading/saving logic
- Quota middleware
- BYOK UI and handling

### Backend
- Cloudflare Pages Functions structure
- Provider calling (NVIDIA, Cloudflare Workers AI, fallback)
- Auth verification
- Quota middleware

## What is Being Replaced

### Old Engine (Removed)
- functions/lib/reviewEngine.ts - weak deterministic logic
- functions/api/full.ts - generic prompt handling
- functions/lib/prompts.ts - generic prompting
- Any raw LLM output display
- Non-deterministic report generation

### New Engine (Created)
- src/engine/ - complete V2 engine
- functions/api/review/full.ts - properly structured pipeline
- functions/api/review/tweak.ts - targeted edit tools

---

## New Engine Pipeline

### Input Flow
```
ReviewInput
  → normalizeInput()
  → parseBrief() [AI + fallback]
```

### Processing Stages
```
1. normalizeInput()
2. parseBrief() - extract BriefAnalysis
3. buildEvidenceBank() - pull from memory + answer
4. runDeterministicChecks() - word count, links, generic phrases
5. buildRequirementCoverage() - matrix of requirement → gap
6. runReviewerPanel() - 7 structured evaluators
7. scoreReview() - weighted scoring
8. generateNextBestEdit() - specific action
9. generateFixPlan() - practical steps
10. buildImprovedAnswer() - memory-backed rewrite
11. buildApplicationPacket() - final export
```

### Output
```
FullReviewResult
  - id
  - inputSummary
  - briefAnalysis
  - evidenceBank
  - deterministicChecks
  - requirementCoverage[]
  - reviewerPanel
  - readinessReport
    - score (0-100)
    - status: not_ready | needs_major_fixes | close_needs_edits | ready_minor_polish
    - verdict
    - nextBestEdit
    - criticalIssues[]
    - warnings[]
    - strongPoints[]
    - fixPlan[]
    - wordCount
    - speakingTimeSeconds
  - improvedApplication
    - improvedAnswer
    - whatChanged[]
    - whyBetter[]
    - wordCount
    - speakingTimeSeconds
  - applicationPacket
    - title
    - finalAnswer
    - requiredLinks[]
    - submissionChecklist[]
    - exportMarkdown
  - debug
```

---

## Schemas

### Input (src/engine/types.ts)
```typescript
type ApplicationType = "fellowship" | "hackathon" | "internship" | "accelerator" | "scholarship" | "grant" | "club" | "other";
type TargetFormat = "written" | "shortEssay" | "longEssay" | "videoScript" | "formAnswers" | "other";
type Strictness = "gentle" | "balanced" | "brutal";

type ReviewInput = {
  opportunity: {
    programName: string;
    applicationType: ApplicationType;
    deadline?: string;
    targetFormat: TargetFormat;
    targetWords?: number;
    targetSeconds?: number;
    strictness: Strictness;
  };
  brief: string;
  answer: string;
  questions?: { id: string; question: string; answer: string; }[];
  memory: ApplicationMemory;
};

type ApplicationMemory = {
  profile: {
    name?: string;
    bio?: string;
    currentFocus?: string;
    preferredTone?: string;
  };
  projects: {
    name: string;
    oneLiner: string;
    description?: string;
    tags?: string[];
    links?: string[];
    evidence?: string[];
  }[];
  achievements: {
    title: string;
    description: string;
    proofLink?: string;
  }[];
  links: Record<string, string>;
  snippets: {
    title: string;
    text: string;
    tags?: string[];
  }[];
};
```

### Brief Analysis Output
```typescript
type BriefAnalysis = {
  summary: string;
  explicitRequirements: {
    id: string;
    text: string;
    type: "topic" | "format" | "length" | "link" | "deadline" | "file" | "question" | "other";
    priority: "high" | "medium" | "low";
    sourceQuote?: string;
  }[];
  hiddenRequirements: {
    id: string;
    text: string;
    whyItMatters: string;
    priority: "high" | "medium" | "low";
  }[];
  evaluationCriteria: string[];
  requiredLinks: {
    type: "video" | "github" | "portfolio" | "resume" | "publicLink" | "other";
    required: boolean;
    foundInBrief: boolean;
    note: string;
  }[];
  targetLength?: {
    minWords?: number;
    maxWords?: number;
    minSeconds?: number;
    maxSeconds?: number;
  };
  risks: string[];
};
```

### Evidence Bank
```typescript
type EvidenceBank = {
  identity: string[];
  projects: {
    name: string;
    oneLiner: string;
    mentionedInAnswer: boolean;
    explainedInAnswer: boolean;
    relevanceToBrief: "high" | "medium" | "low";
    suggestedUse: string;
  }[];
  achievements: {
    title: string;
    relevanceToBrief: "high" | "medium" | "low";
    suggestedUse: string;
  }[];
  links: {
    label: string;
    url: string;
    type: string;
    relevantRequirementIds: string[];
  }[];
  reusableSnippets: {
    title: string;
    text: string;
    relevance: "high" | "medium" | "low";
  }[];
  missingEvidence: string[];
};
```

### Requirement Coverage
```typescript
type RequirementCoverageItem = {
  requirementId: string;
  requirement: string;
  status: "covered" | "partial" | "missing";
  evidenceFound: string;
  gap: string;
  whatToAdd: string;
  priority: "high" | "medium" | "low";
};
```

### Full Output
```typescript
type FullReviewResult = {
  id: string;
  inputSummary: {
    programName: string;
    applicationType: ApplicationType;
    targetFormat: TargetFormat;
    strictness: Strictness;
  };
  briefAnalysis: BriefAnalysis;
  evidenceBank: EvidenceBank;
  deterministicChecks: DeterministicChecks;
  requirementCoverage: RequirementCoverageItem[];
  reviewerPanel: ReviewerPanel;
  readinessReport: {
    score: number;
    status: "not_ready" | "needs_major_fixes" | "close_needs_edits" | "ready_minor_polish";
    verdict: string;
    nextBestEdit: NextBestEdit;
    criticalIssues: string[];
    warnings: string[];
    strongPoints: string[];
    fixPlan: FixPlanItem[];
    wordCount: number;
    speakingTimeSeconds: number;
  };
  improvedApplication: {
    improvedAnswer: string;
    whatChanged: string[];
    whyBetter: string[];
    wordCount: number;
    speakingTimeSeconds: number;
  };
  applicationPacket: {
    title: string;
    finalAnswer: string;
    requiredLinks: RequiredLink[];
    submissionChecklist: ChecklistItem[];
    exportMarkdown: string;
  };
  debug?: {
    engineVersion: "v2";
    stagesCompleted: string[];
    providerUsed?: string;
    fallbackUsed?: boolean;
  };
};
```

---

## Deterministic Checks

Checks that run independently of AI:

1. **wordCount** - Count words, calculate speaking time at 145 wpm
2. **speakingTime** - Convert to seconds for video scripts
3. **linkDetector** - Find URLs in answer
4. **genericPhraseDetector** - Flag generic filler phrases
5. **projectExplanationCheck** - Projects named but not explained
6. **deadlineMode** - Analyze urgency
7. **memoryUsageCheck** - Check saved memory is used
8. **formattingIssues** - Detect formatting problems

### Generic Phrases to Flag
- "learn from smart people"
- "exciting opportunity"
- "build faster"
- "make an impact"
- "passionate about technology"
- "grow as a person"
- "great fit"
- "useful tools"
- "I want to learn"
- "I am excited to apply"

---

## Reviewer Panel (7 Structured Evaluators)

Each reviewer MUST reference concrete details:
- brief text
- answer content
- saved memory
- projects
- links

### Reviewers
1. **Requirement Reviewer** - Did answer cover all explicit requirements?
2. **Fit Reviewer** - Is the fit specific to user's trajectory?
3. **Clarity Reviewer** - Is the answer clear and direct?
4. **Evidence Reviewer** - Are claims backed by saved memory?
5. **Length Reviewer** - Does it match target format/length?
6. **Voice Reviewer** - Does voice feel human, not corporate?
7. **Risk Reviewer** - What could get the application rejected?

---

## Weighted Scoring

```
score =
  requirementCoverageScore * 0.35 +
  fitScore * 0.2 +
  evidenceScore * 0.15 +
  clarityScore * 0.1 +
  lengthScore * 0.1 +
  riskScore * 0.1
```

### Status Bands
- 0-49: not_ready
- 50-69: needs_major_fixes
- 70-84: close_needs_edits
- 85-100: ready_minor_polish

---

## Next Best Edit (Hero Feature)

MUST be specific:
- Bad: "Improve your answer"
- Good: "Explain AgentMesh in one sentence and connect it to why this fellowship fits your current AI infrastructure work"

---

## Fix Plan

Practical steps with:
- step (number)
- title
- why
- effort (1 min | 3 min | 5 min | 10 min)
- impact (high | medium | low)
- suggestedText

---

## Simulation Fixtures

### Activate Intro Video (Primary Test Case)

**Memory:**
- Name: Lakshaya Sharma
- Bio: 19-year-old builder interested in AI infrastructure, systems projects, and practical student tools
- Projects:
  - AgentMesh: Infrastructure that helps AI agents use APIs, MCPs, and machine-readable workflows instead of brittle browser clicking
  - Regenera: A forensic recovery system that reconstructs deleted data from leftover traces and metadata
  - NetSieve: A real-time network intrusion detection system and cryptographic forensic logger
- Tone: Confident, direct, builder-like

**Brief:**
"We'd love a 60-90 second intro video. Tell us a bit about yourself, what you're building or excited by right now, and why this fellowship feels like a good fit for you. Ensure the link is publicly accessible."

**Weak Answer:**
"I'm Lakshaya, a 19-year-old builder interested in AI and systems. I'm building Regenera and AgentMesh, and I like making useful tools. This fellowship seems exciting because I want to learn from smart people and build faster."

**Expected Detection:**
- Too short for 60-90 seconds (~48 words)
- Missing public link
- AgentMesh named but not explained
- Regenera named but not explained
- Fit is generic ("learn from smart people", "build faster")
- No specific fellowship alignment

**Expected Next Best Edit:**
"Explain AgentMesh in one sentence and connect it to why this fellowship fits your current AI infrastructure work."

---

## Testing Strategy

1. Run simulation: `npm run simulate:review`
2. Verify all detections fire correctly
3. Check specific requirements flagged
4. Verify next best edit is actionable
5. Validate improved answer doesn't invent

---

## Known Risks

1. Brief parser may fail - use deterministic fallback
2. JSON parsing may fail - use safe parser with fallback
3. AI may be slow - show deterministic progress first
4. Memory may be empty - use smart defaults

---

## Acceptance Criteria

- [ ] Full Review uses deterministic pipeline
- [ ] Brief parser works with fallback
- [ ] Evidence bank pulls from memory correctly
- [ ] Deterministic checks run independently
- [ ] Requirement coverage matrix fires accurately
- [ ] Reviewer panel references concrete details
- [ ] Weighted scoring is not invented by AI
- [ ] Next Best Edit is specific and actionable
- [ ] Fix Plan is practical
- [ ] Improved Answer uses memory only
- [ ] Application Packet exports clean Markdown
- [ ] Tweak Lab works
- [ ] Simulation detects all Activate issues
- [ ] UI preserves visual design