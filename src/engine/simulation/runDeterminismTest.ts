import { getFixture, type FixtureName } from './fixtures';
import { normalizeInput } from '../normalizeInput';
import { buildEvidenceBank } from '../evidence/buildEvidenceBank';
import { runDeterministicChecks } from '../deterministic/checks';
import { buildRequirementCoverage } from '../coverage/requirementCoverage';
import {
  buildReviewerPanel,
  scoreReview,
  getStatusFromScore,
  buildNextBestEdit,
  buildFixPlan,
  buildReadinessReport,
} from '../scoring/scoreReview';
import { buildImprovedAnswer } from '../normalize/buildImprovedAnswer';
import { buildApplicationPacket } from '../packet/buildApplicationPacket';
import type { FullReviewResult } from '../types';
import { hashReviewInput, clearHashCache } from '../hash/hashReviewInput';

interface StageTiming {
  stage: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'fallback' | 'skipped';
}

function runFullEngine(input: ReturnType<typeof normalizeInput>['input']): FullReviewResult & { timings: StageTiming[] } {
  clearHashCache();
  const timings: StageTiming[] = [];
  const overallStart = Date.now();

  let stageStart = Date.now();
  const { briefAnalysis } = normalizeInput(input);
  timings.push({ stage: 'normalizeInput', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const evidenceBank = buildEvidenceBank(input.memory, input.answer, briefAnalysis);
  timings.push({ stage: 'buildEvidenceBank', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const deterministicChecks = runDeterministicChecks({
    ...input,
    briefAnalysis,
  } as any);
  timings.push({ stage: 'deterministicChecks', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  const requiredByBrief = briefAnalysis.requiredLinks
    .filter((l: any) => l.required)
    .map((l: any) => l.type);

  const requirementCoverage = buildRequirementCoverage(
    briefAnalysis,
    input.answer,
    evidenceBank,
    deterministicChecks,
    requiredByBrief
  );
  timings.push({ stage: 'requirementCoverage', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const reviewerPanel = buildReviewerPanel(
    briefAnalysis,
    input.answer,
    evidenceBank,
    deterministicChecks,
    requirementCoverage,
    input.opportunity.applicationType,
    input.opportunity.strictness
  );
  timings.push({ stage: 'reviewerPanel', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const overallScore = scoreReview(reviewerPanel);
  const status = getStatusFromScore(overallScore);
  timings.push({ stage: 'scoreReview', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const nextBestEdit = buildNextBestEdit(
    requirementCoverage,
    reviewerPanel,
    evidenceBank,
    deterministicChecks,
    input.opportunity.applicationType
  );
  timings.push({ stage: 'nextBestEdit', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const fixPlan = buildFixPlan(
    requirementCoverage,
    reviewerPanel,
    deterministicChecks,
    input.opportunity.applicationType
  );
  timings.push({ stage: 'fixPlan', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const improvedApplication = buildImprovedAnswer(
    input.answer,
    input.memory,
    briefAnalysis,
    deterministicChecks,
    input.opportunity.targetFormat
  );
  timings.push({ stage: 'improveAnswer', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const applicationPacket = buildApplicationPacket(
    input.opportunity.programName,
    improvedApplication.improvedAnswer,
    requirementCoverage,
    deterministicChecks,
    evidenceBank
  );
  timings.push({ stage: 'buildPacket', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  stageStart = Date.now();
  const readinessReport = buildReadinessReport(
    overallScore,
    status,
    nextBestEdit,
    fixPlan,
    requirementCoverage,
    reviewerPanel,
    deterministicChecks
  );
  timings.push({ stage: 'buildReadinessReport', startTime: stageStart, endTime: Date.now(), durationMs: Date.now() - stageStart, status: 'completed' });

  timings.push({ stage: 'total', startTime: overallStart, endTime: Date.now(), durationMs: Date.now() - overallStart, status: 'completed' });

  return {
    id: 'deterministic-test',
    inputSummary: {
      programName: input.opportunity.programName,
      applicationType: input.opportunity.applicationType,
      targetFormat: input.opportunity.targetFormat,
      strictness: input.opportunity.strictness,
    },
    briefAnalysis,
    evidenceBank,
    deterministicChecks,
    requirementCoverage,
    reviewerPanel,
    readinessReport,
    improvedApplication,
    applicationPacket,
    timings,
  };
}

function extractDeterministicFields(result: FullReviewResult): string {
  return JSON.stringify({
    score: result.readinessReport.score,
    status: result.readinessReport.status,
    requirementCoverage: result.requirementCoverage.map((r) => ({
      requirement: r.requirement,
      status: r.status,
    })),
    deterministicChecks: {
      wordCount: result.deterministicChecks.wordCount,
      speakingTimeSeconds: result.deterministicChecks.speakingTimeSeconds,
      lengthFit: result.deterministicChecks.lengthFit.status,
      genericPhrases: result.deterministicChecks.genericPhrases.map((g) => g.phrase),
      linksFound: result.deterministicChecks.links.urlsFound.length,
      linksMissing: result.deterministicChecks.links.requiredLinksMissing,
      projectWarnings: result.deterministicChecks.projectExplanationWarnings.map((w) => w.projectName),
    },
    nextBestEdit: result.readinessReport.nextBestEdit.action,
    reviewerPanel: {
      requirements: result.reviewerPanel.requirements.score,
      fit: result.reviewerPanel.fit.score,
      evidence: result.reviewerPanel.evidence.score,
      length: result.reviewerPanel.length.score,
      risk: result.reviewerPanel.risk.score,
    },
  });
}

async function runDeterminismTest(): Promise<void> {
  console.log('='.repeat(60));
  console.log('DETERMINISM TEST - Running same input 3 times');
  console.log('='.repeat(60));

  const fixtureName: FixtureName = 'activateIntroVideo';
  const input = getFixture(fixtureName);

  const inputHash = await hashReviewInput({
    opportunity: {
      programName: input.opportunity.programName,
      applicationType: input.opportunity.applicationType,
      deadline: input.opportunity.deadline,
      targetFormat: input.opportunity.targetFormat,
      strictness: input.opportunity.strictness,
    },
    brief: input.brief,
    answer: input.answer,
    memory: input.memory as unknown,
  });

  console.log(`\nFixture: ${fixtureName}`);
  console.log(`Input Hash: ${inputHash}`);
  console.log(`\n--- Run 1 ---`);
  const result1 = runFullEngine(input);
  const output1 = extractDeterministicFields(result1);

  console.log(`\n--- Run 2 ---`);
  const result2 = runFullEngine(input);
  const output2 = extractDeterministicFields(result2);

  console.log(`\n--- Run 3 ---`);
  const result3 = runFullEngine(input);
  const output3 = extractDeterministicFields(result3);

  console.log(`\n${'='.repeat(60)}`);
  console.log('RESULTS COMPARISON');
  console.log('='.repeat(60));

  const pass1 = output1 === output2;
  const pass2 = output2 === output3;

  console.log(`\nRun 1 vs Run 2: ${pass1 ? 'PASS' : 'FAIL'}`);
  console.log(`Run 2 vs Run 3: ${pass2 ? 'PASS' : 'FAIL'}`);

  if (!pass1 || !pass2) {
    console.log(`\n❌ DETERMINISM FAILED`);
    console.log(`\nRun 1 output:`);
    console.log(JSON.stringify(JSON.parse(output1), null, 2));
    console.log(`\nRun 2 output:`);
    console.log(JSON.stringify(JSON.parse(output2), null, 2));
    console.log(`\nRun 3 output:`);
    console.log(JSON.stringify(JSON.parse(output3), null, 2));
    throw new Error('Determinism test failed');
  }

  console.log(`\n✅ DETERMINISM PASSED`);
  console.log(`\nScore consistency:`);
  console.log(`  Run 1: ${result1.readinessReport.score}`);
  console.log(`  Run 2: ${result2.readinessReport.score}`);
  console.log(`  Run 3: ${result3.readinessReport.score}`);

  console.log(`\n⏱️ Stage Timings (Run 1):`);
  for (const t of result1.timings) {
    console.log(`  ${t.stage}: ${t.durationMs}ms [${t.status}]`);
  }

  console.log(`\nRequirement coverage consistency:`);
  for (const rc of result1.requirementCoverage) {
    console.log(`  ${rc.requirement}: ${rc.status}`);
  }

  console.log(`\nInput hash consistency:`);
  const hash2 = await hashReviewInput({
    opportunity: {
      programName: input.opportunity.programName,
      applicationType: input.opportunity.applicationType,
      deadline: input.opportunity.deadline,
      targetFormat: input.opportunity.targetFormat,
      strictness: input.opportunity.strictness,
    },
    brief: input.brief,
    answer: input.answer,
    memory: input.memory as unknown,
  });
  const hash3 = await hashReviewInput({
    opportunity: {
      programName: input.opportunity.programName,
      applicationType: input.opportunity.applicationType,
      deadline: input.opportunity.deadline,
      targetFormat: input.opportunity.targetFormat,
      strictness: input.opportunity.strictness,
    },
    brief: input.brief,
    answer: input.answer,
    memory: input.memory as unknown,
  });

  console.log(`  Hash 1: ${inputHash}`);
  console.log(`  Hash 2: ${hash2}`);
  console.log(`  Hash 3: ${hash3}`);

  const allHashesMatch = inputHash === hash2 && hash2 === hash3;
  console.log(`  All hashes match: ${allHashesMatch ? 'YES' : 'NO'}`);

  console.log(`\n${'='.repeat(60)}`);
  if (pass1 && pass2 && allHashesMatch) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
    throw new Error('Determinism test failed');
  }
  console.log('='.repeat(60));
}

runDeterminismTest().catch(console.error);