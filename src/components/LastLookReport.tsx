import { AlertOctagon, AlertTriangle, ShieldCheck, ListOrdered, FileText, Mic } from 'lucide-react';
import type { CheckResult } from '../lib/types';
import { formatTime } from '../lib/utils';
import ResultCard from './ResultCard';
import CopyButton from './CopyButton';

interface Props {
  result: CheckResult | null;
}

export default function LastLookReport({ result }: Props) {
  const sc = (s: number) => s >= 80 ? 'text-ok' : s >= 60 ? 'text-warn' : 'text-err';
  const bc = (s: number) => s >= 80 ? 'bg-ok' : s >= 60 ? 'bg-warn' : 'bg-err';
  const sb = (s: number) => s >= 80 ? 'bg-ok-soft text-ok' : s >= 60 ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err';

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">readiness report</span>
        {result && <span className="text-[11px] text-ink-muted font-mono">featured</span>}
      </div>

      {!result && <p className="mt-4 text-[13px] text-ink-secondary">Run a final check to catch what you missed.</p>}

      {result && (
        <div className="mt-4 space-y-4 animate-slide-up">
          <div className="rounded-2xl border border-edge bg-surface p-6 text-center shadow-soft ring-1 ring-yc/20">
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-3">readiness score</div>
            <div className={`text-[clamp(3rem,6vw,4.5rem)] font-extrabold tracking-tighter ${sc(result.score)}`}>{result.score}</div>
            <div className="text-sm text-ink-muted mt-0.5">out of 100</div>
            <span className={`inline-block mt-3 text-[11px] font-semibold font-mono px-3 py-1 rounded-full ${sb(result.score)}`}>
              {result.status}
            </span>
            <div className="mt-5 h-2.5 bg-surface-muted rounded-full overflow-hidden max-w-[280px] mx-auto">
              <div className={`h-full rounded-full transition-all duration-700 ${bc(result.score)}`} style={{ width: `${result.score}%` }} />
            </div>
            <div className="flex justify-center gap-5 mt-5 text-[11px] text-ink-muted font-mono border-t border-edge pt-4 max-w-[280px] mx-auto">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {result.wordCount} words</span>
              <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> ~{formatTime(result.speakingTimeSeconds)}</span>
            </div>
            <div className="mt-5">
              <CopyButton text={`Score: ${result.score}/100\nStatus: ${result.status}\n\nFix before submitting:\n${result.criticalIssues.map(i => `- ${i}`).join('\n')}\n\nWorth improving:\n${result.warnings.map(i => `- ${i}`).join('\n')}\n\nAlready working:\n${result.strongPoints.map(i => `- ${i}`).join('\n')}\n\nFix order:\n${result.fixOrder.map((i, n) => `${n + 1}. ${i}`).join('\n')}`} />
            </div>
          </div>

          <ResultCard title="Fix before submitting" items={result.criticalIssues} icon={<AlertOctagon className="w-4 h-4" />} variant="danger" />
          <ResultCard title="Worth improving" items={result.warnings} icon={<AlertTriangle className="w-4 h-4" />} variant="warning" />
          <ResultCard title="Already working" items={result.strongPoints} icon={<ShieldCheck className="w-4 h-4" />} variant="success" />
          <ResultCard title="Fix order" items={result.fixOrder} icon={<ListOrdered className="w-4 h-4" />} />
        </div>
      )}
    </section>
  );
}
