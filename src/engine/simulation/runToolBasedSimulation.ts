import { getFixture, type FixtureName } from './fixtures';
import { runToolBasedReview, type WorkflowResult } from '../workflow/runToolReview';

function runToolBasedEngine(input: ReturnType<typeof getFixture>): WorkflowResult {
  const startTime = Date.now();

  const workflowInput = {
    brief: input.brief,
    answer: input.answer,
    memory: input.memory,
    opportunity: {
      programName: input.opportunity.programName,
      applicationType: input.opportunity.applicationType,
      targetFormat: input.opportunity.targetFormat,
      targetWords: input.opportunity.targetWords,
      targetSeconds: input.opportunity.targetSeconds,
      strictness: input.opportunity.strictness,
      deadline: input.opportunity.deadline,
    },
  };

  return runToolBasedReview(workflowInput, startTime);
}

function verifyActivateFixture(result: WorkflowResult): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  if (result.requirementCoverage.some(r => r.requirement.toLowerCase().includes('link') && r.status !== 'covered')) {
    issues.push('MISSING: Public link not detected in answer');
  }

  if (result.componentScores.length < 60) {
    issues.push('Answer appears too short for 60-90 sec video');
  }

  const hasGenericFit = result.componentScores.fit < 60;
  if (hasGenericFit) {
    issues.push('FIT: Generic fit language detected');
  }

  if (result.nextBestEdit.action.toLowerCase().includes('explain') ||
      result.nextBestEdit.action.toLowerCase().includes('agentmesh') ||
      result.nextBestEdit.action.toLowerCase().includes('regenera')) {
    // This is good - project explanation suggested
  } else if (result.requirementCoverage.some(r => r.status === 'missing')) {
    issues.push('NEXT BEST: Should suggest addressing missing requirement');
  }

  return { passed: issues.length === 0, issues };
}

function printResult(result: WorkflowResult): void {
  console.log(`\n📊 Score: ${result.score}/100`);
  console.log(`📋 Status: ${result.status}`);
  console.log(`🔄 Result Mode: ${result.resultMode}`);

  console.log(`\n⏱️ Stage Timings:`);
  for (const t of result.timings) {
    console.log(`  ${t.stage}: ${t.durationMs}ms [${t.status}]`);
  }

  console.log(`\n🔍 Deterministic Checks:`);
  console.log(`  Requirements: ${result.componentScores.requirements}`);
  console.log(`  Fit: ${result.componentScores.fit}`);
  console.log(`  Clarity: ${result.componentScores.clarity}`);
  console.log(`  Evidence: ${result.componentScores.evidence}`);
  console.log(`  Length: ${result.componentScores.length}`);
  console.log(`  Voice: ${result.componentScores.voice}`);
  console.log(`  Risk: ${result.componentScores.risk}`);

  console.log(`\n📝 Requirement Coverage:`);
  for (const rc of result.requirementCoverage) {
    const icon = rc.status === 'covered' ? '✓' : rc.status === 'partial' ? '~' : '✗';
    console.log(`  ${icon} ${rc.requirement}: ${rc.status}`);
  }

  console.log(`\n🎯 Next Best Edit:`);
  console.log(`  Action: ${result.nextBestEdit.action}`);
  console.log(`  Suggestion: ${result.nextBestEdit.suggestedText}`);

  if (result.fixPlan.length > 0) {
    console.log(`\n📋 Fix Plan:`);
    for (const f of result.fixPlan) {
      console.log(`  ${f.step}. ${f.title} [${f.effort}, ${f.impact}]`);
    }
  }

  console.log(`\n⏰ Deadline Mode: ${result.deadlineMode.mode} (${result.deadlineMode.urgency})`);
}

async function runToolBasedSimulation(): Promise<void> {
  console.log('='.repeat(60));
  console.log('TOOL-BASED ENGINE SIMULATION');
  console.log('='.repeat(60));

  const fixtureName: FixtureName = 'activateIntroVideo';
  console.log(`\n📦 Running: ${fixtureName}`);

  const input = getFixture(fixtureName);
  const result = runToolBasedEngine(input);

  printResult(result);

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION');
  console.log('='.repeat(60));

  const verification = verifyActivateFixture(result);
  if (verification.passed) {
    console.log('\n✅ All verifications passed!');
  } else {
    console.log('\n⚠️ Verifications with issues:');
    for (const issue of verification.issues) {
      console.log(`  - ${issue}`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

runToolBasedSimulation().catch(console.error);