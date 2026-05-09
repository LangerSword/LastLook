import { getAllFixtures, expectedResults, type FixtureName } from "./fixtures";
import { normalizeInput } from "../normalizeInput";
import { buildEvidenceBank } from "../evidence/buildEvidenceBank";
import { runDeterministicChecks } from "../deterministic/checks";
import { buildRequirementCoverage, calculateCoverageScore } from "../coverage/requirementCoverage";
import {
  buildReviewerPanel,
  scoreReview,
  getStatusFromScore,
  buildNextBestEdit,
  buildFixPlan,
  buildReadinessReport,
} from "../scoring/scoreReview";
import { buildImprovedAnswer } from "../normalize/buildImprovedAnswer";
import { buildApplicationPacket } from "../packet/buildApplicationPacket";
import type { FullReviewResult } from "../types";

function runFullEngine(input: ReturnType<typeof normalizeInput>["input"]): FullReviewResult {
  const { briefAnalysis } = normalizeInput(input);

  const evidenceBank = buildEvidenceBank(input.memory, input.answer, briefAnalysis);
  const deterministicChecks = runDeterministicChecks({
    ...input,
    briefAnalysis,
  } as any);

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

  const reviewerPanel = buildReviewerPanel(
    briefAnalysis,
    input.answer,
    evidenceBank,
    deterministicChecks,
    requirementCoverage,
    input.opportunity.applicationType,
    input.opportunity.strictness
  );

  const overallScore = scoreReview(reviewerPanel);
  const status = getStatusFromScore(overallScore);

  const nextBestEdit = buildNextBestEdit(
    requirementCoverage,
    reviewerPanel,
    evidenceBank,
    deterministicChecks,
    input.opportunity.applicationType
  );

  const fixPlan = buildFixPlan(
    requirementCoverage,
    reviewerPanel,
    deterministicChecks,
    input.opportunity.applicationType
  );

  const improvedApplication = buildImprovedAnswer(
    input.answer,
    input.memory,
    briefAnalysis,
    deterministicChecks,
    input.opportunity.targetFormat
  );

  const applicationPacket = buildApplicationPacket(
    input.opportunity.programName,
    improvedApplication.improvedAnswer,
    requirementCoverage,
    deterministicChecks,
    evidenceBank
  );

  const readinessReport = buildReadinessReport(
    overallScore,
    status,
    nextBestEdit,
    fixPlan,
    requirementCoverage,
    reviewerPanel,
    deterministicChecks
  );

  const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
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
    debug: {
      engineVersion: "v2",
      stagesCompleted: [
        "normalizeInput",
        "parseBrief",
        "buildEvidenceBank",
        "runDeterministicChecks",
        "buildRequirementCoverage",
        "buildReviewerPanel",
        "scoreReview",
        "generateNextBestEdit",
        "generateFixPlan",
        "buildImprovedAnswer",
        "buildApplicationPacket",
        "buildReadinessReport",
      ],
      fallbackUsed: false,
    },
  };
}

function checkFixture(name: FixtureName, result: FullReviewResult): {
  passed: boolean;
  issues: string[];
} {
  const expected = expectedResults[name];
  const issues: string[] = [];

  if (expected.wordCount) {
    const wordCount = result.deterministicChecks.wordCount;
    if (expected.wordCount.min && wordCount < expected.wordCount.min) {
      issues.push(`Word count ${wordCount} < min ${expected.wordCount.min}`);
    }
    if (expected.wordCount.max && wordCount > expected.wordCount.max) {
      issues.push(`Word count ${wordCount} > max ${expected.wordCount.max}`);
    }
  }

  for (const status of expected.statuses) {
    const req = result.requirementCoverage.find(
      (r) => r.requirement.toLowerCase().includes(status.requirement.toLowerCase()) ||
             r.requirement.toLowerCase().match(new RegExp(status.requirement.split(" ")[0]))
    );
    if (req && req.status !== status.status) {
      issues.push(`Requirement "${status.requirement}" is ${req.status}, expected ${status.status}`);
    }
  }

  if (expected.hasGenericPhrases !== (result.deterministicChecks.genericPhrases.length > 0)) {
    if (expected.hasGenericPhrases && result.deterministicChecks.genericPhrases.length === 0) {
      issues.push(`Generic phrases expected but none found`);
    }
  }

  if (expected.hasMissingLink !== (result.deterministicChecks.links.requiredLinksMissing.length > 0)) {
    if (expected.hasMissingLink && result.deterministicChecks.links.requiredLinksMissing.length === 0) {
      issues.push(`Missing link expected but none found`);
    }
  }

  if (expected.nextBestEdit?.actionContains) {
    const hasAction = result.readinessReport.nextBestEdit.action
      .toLowerCase()
      .includes(expected.nextBestEdit.actionContains.toLowerCase());
    if (!hasAction) {
      issues.push(`Next best edit should contain: "${expected.nextBestEdit.actionContains}"`);
    }
  }

  if (expected.scoreMax !== undefined && result.readinessReport.score > expected.scoreMax) {
    issues.push(`Score ${result.readinessReport.score} > max ${expected.scoreMax}`);
  }
  
  if (expected.scoreMin !== undefined && result.readinessReport.score < expected.scoreMin) {
    issues.push(`Score ${result.readinessReport.score} < min ${expected.scoreMin}`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

function printResult(name: FixtureName, result: FullReviewResult): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`FIXTURE: ${name}`);
  console.log(`${"=".repeat(60)}`);

  console.log(`\n📊 Score: ${result.readinessReport.score}/100`);
  console.log(`📋 Status: ${result.readinessReport.status}`);
  console.log(`📝 Verdict: ${result.readinessReport.verdict}`);

  console.log(`\n🔍 Deterministic Checks:`);
  console.log(`  - Word count: ${result.deterministicChecks.wordCount}`);
  console.log(`  - Speaking time: ${result.deterministicChecks.speakingTimeSeconds}s`);
  console.log(`  - Length fit: ${result.deterministicChecks.lengthFit.status}`);
  console.log(`  - URLs found: ${result.deterministicChecks.links.urlsFound.length}`);
  console.log(`  - Missing links: ${result.deterministicChecks.links.requiredLinksMissing.join(", ") || "none"}`);

  if (result.deterministicChecks.genericPhrases.length > 0) {
    console.log(`  - Generic phrases: ${result.deterministicChecks.genericPhrases.map((g) => g.phrase).join(", ")}`);
  }

  if (result.deterministicChecks.projectExplanationWarnings.length > 0) {
    console.log(`  - Project warnings: ${result.deterministicChecks.projectExplanationWarnings.map((w) => w.projectName).join(", ")}`);
  }

  console.log(`\n✅ Requirements (${result.requirementCoverage.length}):`);
  for (const req of result.requirementCoverage.slice(0, 5)) {
    const icon = req.status === "covered" ? "✓" : req.status === "partial" ? "~" : "✗";
    console.log(`  ${icon} ${req.requirement.slice(0, 40)}... [${req.status}]`);
    if (req.whatToAdd && req.status !== "covered") {
      console.log(`     → ${req.whatToAdd.slice(0, 50)}`);
    }
  }

  console.log(`\n🎯 Next Best Edit:`);
  console.log(`  ${result.readinessReport.nextBestEdit.action}`);
  console.log(`  Why: ${result.readinessReport.nextBestEdit.why.slice(0, 80)}`);

  if (result.readinessReport.criticalIssues.length > 0) {
    console.log(`\n⚠️ Critical Issues:`);
    for (const issue of result.readinessReport.criticalIssues) {
      console.log(`  - ${issue}`);
    }
  }

  if (result.readinessReport.warnings.length > 0) {
    console.log(`\n⚡ Warnings:`);
    for (const warning of result.readinessReport.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (result.readinessReport.fixPlan.length > 0) {
    console.log(`\n📋 Fix Plan (${result.readinessReport.fixPlan.length} items):`);
    for (const item of result.readinessReport.fixPlan.slice(0, 3)) {
      console.log(`  ${item.step}. ${item.title} [${item.effort}, ${item.impact}]`);
    }
  }

  console.log(`\n🤖 Reviewer Panel:`);
  console.log(`  - Requirements: ${result.reviewerPanel.requirements.score}`);
  console.log(`  - Fit: ${result.reviewerPanel.fit.score}`);
  console.log(`  - Evidence: ${result.reviewerPanel.evidence.score}`);
  console.log(`  - Length: ${result.reviewerPanel.length.score}`);
  console.log(`  - Risk: ${result.reviewerPanel.risk.score}`);
}

async function runSimulation(): Promise<void> {
  console.log("🚀 Starting V2 Engine Simulation...\n");

  const fixtures = getAllFixtures();
  let passedCount = 0;
  let failedCount = 0;

  for (const { name, input } of fixtures) {
    const result = runFullEngine(input);
    const check = checkFixture(name, result);

    if (check.passed) {
      passedCount++;
      console.log(`✅ ${name}: PASSED`);
    } else {
      failedCount++;
      console.log(`❌ ${name}: FAILED`);
      for (const issue of check.issues) {
        console.log(`   - ${issue}`);
      }
    }

    if (false) { // VERBOSE mode disabled for now
      printResult(name, result);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY: ${passedCount}/${fixtures.length} fixtures passed`);
  if (failedCount > 0) {
    console.log(`${failedCount} fixture(s) failed`);
  }
  console.log(`${"=".repeat(60)}`);

  if (failedCount === 0) {
    console.log("\n✅ All simulations passed!");
  } else {
    console.log("\n⚠️ Some simulations failed - review the issues above");
  }
}

runSimulation().catch(console.error);