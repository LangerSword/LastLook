import { runFullReviewWorkflow, createMockLLMConfig } from './index';
import type { WorkflowInput } from './schemas';

const TEST_FIXTURE: WorkflowInput = {
  brief: "We'd love a 60-90 second intro video. Tell us a bit about yourself, what you're building or excited by right now, and why this fellowship feels like a good fit for you. Ensure the link is publicly accessible.",
  question: "Introduce yourself in a 60-90 second video. Tell us what you're building, why it matters, and why this fellowship is the right fit.",
  answer: "I'm Lakshaya, a 19-year-old builder interested in AI and systems. I'm building Regenera and AgentMesh, and I like making useful tools. This fellowship seems exciting because I want to learn from smart people and build faster.",
  memory: {
    profile: {
      name: 'Lakshaya Sharma',
      shortBio: '19-year-old builder interested in AI infrastructure, systems projects, and practical student tools.',
      currentFocus: 'AI infrastructure and systems projects',
      preferredTone: 'Confident, direct, builder-like',
    },
    projects: [
      {
        name: 'AgentMesh',
        oneLiner: 'Infrastructure that helps AI agents use APIs, MCPs, and machine-readable workflows instead of brittle browser clicking.',
        longerExplanation: 'AgentMesh provides the connectors, APIs, and protocols that let AI agents collaborate through standardized interfaces rather than screen scraping.',
        tags: ['AI', 'infrastructure', 'agents', 'APIs', 'MCPs'],
        links: [],
        proof: '',
        bestUseCase: 'Helping AI agents use APIs and MCPs instead of browser automation',
      },
      {
        name: 'Regenera',
        oneLiner: 'A forensic recovery system that reconstructs deleted data from leftover traces and metadata.',
        longerExplanation: 'Regenera analyzes file system metadata, journal entries, and residual data patterns to piece together deleted files.',
        tags: ['forensics', 'security', 'data recovery', 'systems'],
        links: [],
        proof: '',
        bestUseCase: 'Recovering deleted files from leftover traces and metadata',
      },
      {
        name: 'NetSieve',
        oneLiner: 'A real-time network intrusion detection system and cryptographic forensic logger.',
        longerExplanation: 'NetSieve monitors network traffic in real-time, detects intrusion patterns, and maintains a cryptographically signed audit trail.',
        tags: ['security', 'networking', 'cryptography', 'detection'],
        links: [],
        proof: '',
        bestUseCase: 'Real-time intrusion detection with cryptographic audit trail',
      },
    ],
    achievements: [],
    linkVault: {
      github: 'https://github.com/lakshaya',
      linkedin: 'https://linkedin.com/in/lakshaya',
      portfolio: 'https://lakshaya.dev',
      resume: '',
      demoVideo: '',
      projectLinks: [],
      otherLinks: [],
    },
    preferences: {
      preferredTone: 'Confident, direct, builder-like',
      preferredApplicationTypes: ['Fellowship'],
      notes: '',
    },
  },
  programName: 'Founders Fellowship 2026',
  applicationType: 'Fellowship',
  reviewStrictness: 'Balanced',
  targetLength: '60-90 sec video',
  deadline: undefined,
};

async function main() {
  console.log('\n=== LastLook V2 Mastra Simulation ===\n');
  console.log('Input:');
  console.log(`  Program: ${TEST_FIXTURE.programName}`);
  console.log(`  Answer length: ${TEST_FIXTURE.answer.split(/\s+/).length} words`);
  console.log(`  Projects in memory: ${TEST_FIXTURE.memory?.projects.map(p => p.name).join(', ')}`);
  console.log('');

  const events: string[] = [];
  const startTime = Date.now();

  const result = await runFullReviewWorkflow(
    TEST_FIXTURE,
    createMockLLMConfig(),
    (event) => {
      const ts = (Date.now() - startTime).toString().padStart(5, ' ');
      const icon = event.type === 'stage_started' ? '>' : event.type === 'stage_completed' ? '✓' : '✗';
      const extra = event.durationMs !== undefined ? ` (${event.durationMs}ms)` : '';
      const summary = event.summary ? ` — ${event.summary}` : '';
      const line = `[${ts}ms] ${icon} ${event.stage}${extra}${summary}`;
      events.push(line);
      console.log(line);
    }
  );

  console.log('\n=== Results ===\n');

  if (!result.result) {
    console.error('ERROR: No result returned');
    console.error(JSON.stringify(result, null, 2));
    return;
  }

  const r = result.result;
  console.log(`Score: ${r.debug?.resultMode}`);
  console.log(`Overall Score: ${r.debug?.resultMode === 'mock_demo' ? 'N/A (mock mode)' : 'computed from reviewer panel'}`);
  console.log(`Provider: ${r.debug?.providerUsed}`);
  console.log(`Total Duration: ${r.debug?.totalDurationMs}ms`);
  console.log(`Stages Completed: ${r.debug?.stagesCompleted.join(', ')}`);
  console.log(`Fallback Used: ${r.debug?.fallbackUsed}`);

  console.log('\n=== Reviewer Panel ===\n');
  const panel = r.reviewerPanel;
  for (const [name, reviewer] of Object.entries(panel)) {
    console.log(`  ${name}: ${reviewer.score}/100 — ${reviewer.verdict}`);
    if (reviewer.specificFindings.length > 0) {
      for (const f of reviewer.specificFindings.slice(0, 2)) {
        console.log(`    • ${f}`);
      }
    }
  }

  console.log('\n=== Requirement Coverage ===\n');
  for (const item of r.requirementCoverage) {
    const icon = item.status === 'covered' ? '✓' : item.status === 'partial' ? '~' : '✗';
    console.log(`  ${icon} [${item.priority}] ${item.requirement}`);
    console.log(`    ${item.note}`);
  }

  console.log('\n=== Next Best Edit ===\n');
  console.log(`  "${r.nextBestEdit.title}"`);
  console.log(`  Reason: ${r.nextBestEdit.reason}`);
  console.log(`  Suggested: ${r.nextBestEdit.suggestedText.slice(0, 100)}...`);

  console.log('\n=== Fix Plan ===\n');
  for (const fix of r.fixPlan) {
    console.log(`  ${fix.step}. ${fix.title} (${fix.effort}, ${fix.impact})`);
    console.log(`     ${fix.why}`);
  }

  console.log('\n=== Improved Answer ===\n');
  console.log(r.improvedApplication.improvedAnswer.slice(0, 300) + '...');
  console.log(`\nWord count: ${r.improvedApplication.wordCount} (~${r.improvedApplication.speakingTimeSeconds}s)`);

  console.log('\n=== Deterministic Checks ===\n');
  const dc = r.deterministicChecks;
  console.log(`  Word count: ${dc.wordCount}`);
  console.log(`  Speaking time: ${dc.speakingTimeSeconds}s`);
  console.log(`  Length fit: ${dc.lengthFit.status}`);
  console.log(`  Links found: ${dc.links.urlsFound.length}`);
  console.log(`  Missing links: ${dc.links.requiredLinksMissing.join(', ') || 'none'}`);
  console.log(`  Generic phrases: ${dc.genericPhrases.length}`);
  for (const p of dc.genericPhrases.slice(0, 3)) {
    console.log(`    - "${p.phrase}"`);
  }
  console.log(`  Project warnings: ${dc.projectExplanationWarnings.length}`);
  for (const w of dc.projectExplanationWarnings) {
    console.log(`    - ${w.projectName}: ${w.issue}`);
  }

  console.log('\n=== Stage Timings ===\n');
  for (const t of r.debug?.timings || []) {
    const icon = t.status === 'completed' ? '✓' : t.status === 'fallback' ? '~' : '✗';
    console.log(`  ${icon} ${t.stage}: ${t.durationMs}ms (${t.status})`);
  }

  console.log('\n=== Simulation Complete ===\n');
}

main().catch(console.error);