import { Pin, Target, AlertTriangle, Lightbulb, FileText } from 'lucide-react';
import type { BriefAnalysis } from '../lib/types';
import ResultCard from './ResultCard';

interface Props {
  analysis: BriefAnalysis | null;
}

export default function BriefResults({ analysis }: Props) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">brief analysis</span>
        {analysis && <span className="text-[11px] text-ink-muted font-mono">ready</span>}
      </div>

      {!analysis && <p className="mt-4 text-[13px] text-ink-secondary">Extract the hidden checklist from your application brief.</p>}

      {analysis && (
        <div className="mt-4 grid gap-4">
          <ResultCard title="Explicit Requirements" items={analysis.explicitRequirements} icon={<Pin className="w-4 h-4" />} />
          <ResultCard title="Implied Criteria" items={analysis.impliedCriteria} icon={<Target className="w-4 h-4" />} />
          <ResultCard title="Submission Risks" items={analysis.submissionRisks} icon={<AlertTriangle className="w-4 h-4" />} variant="warning" />
          <ResultCard title="Suggested Angles" items={analysis.suggestedAngles} icon={<Lightbulb className="w-4 h-4" />} variant="success" />
          {analysis.summary && (
            <div className="rounded-2xl border border-edge bg-surface-muted p-4">
              <h4 className="text-[13px] font-semibold text-ink mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink-secondary" /> Summary
              </h4>
              <p className="text-[13px] text-ink-secondary leading-relaxed">{analysis.summary}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
