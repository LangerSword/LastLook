import { useState } from 'react';
import { ScanSearch, FileText, Mic, CheckCircle2 } from 'lucide-react';
import type { BriefAnalysis, CheckResult, ApplicationType, ReviewStrictness } from '../lib/types';
import { checkAnswer } from '../lib/api';
import { wordCount, speakingTime, formatTime } from '../lib/utils';

interface Props {
  analysis: BriefAnalysis | null;
  question: string;
  finalAnswer: string;
  onFinalAnswerChange: (a: string) => void;
  result: CheckResult | null;
  onResultChange: (r: CheckResult | null) => void;
  applicationType?: ApplicationType;
  reviewStrictness?: ReviewStrictness;
  onStartLoading?: () => void;
  onEndLoading?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function LastLookChecker({ analysis, question, finalAnswer, onFinalAnswerChange, result, onResultChange, applicationType, reviewStrictness, onStartLoading, onEndLoading, disabled, disabledMessage }: Props) {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wc = wordCount(finalAnswer);
  const st = speakingTime(wc);

  const run = async () => {
    if (!finalAnswer.trim()) return;
    setLoading(true); setError(null);
    if (onStartLoading) onStartLoading();
    try {
      onResultChange(
        await checkAnswer({
          briefAnalysis: analysis ?? {},
          question,
          finalAnswer,
          target,
          wordCount: wc,
          speakingTimeSeconds: st,
          applicationType,
          reviewStrictness,
        })
      );
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Check failed'); }
    finally { 
      setLoading(false); 
      if (onEndLoading) onEndLoading();
    }
  };

  const inputCls = "w-full bg-surface border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none";
  const handleTargetChange = (value: string) => {
    setTarget(value);
    if (result) onResultChange(null);
  };

  return (
    <section id="lastlook-checker" className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">04 / check</span>

      <div className="space-y-4 mt-4">
        <div>
          <label htmlFor="input-final-answer" className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">Final Answer</label>
          <textarea id="input-final-answer" rows={6} value={finalAnswer} onChange={e => onFinalAnswerChange(e.target.value)}
            placeholder="Paste your final answer here..." className={`${inputCls} resize-none`} />
          <div className="flex gap-4 mt-2 text-[11px] text-ink-muted font-mono">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {wc} words</span>
            <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> ~{formatTime(st)}</span>
          </div>
        </div>
        <div>
          <label htmlFor="input-target" className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">Target (optional)</label>
          <input type="text" id="input-target" value={target} onChange={e => handleTargetChange(e.target.value)} placeholder="e.g. fellowship, hackathon, grant..." className={inputCls} />
        </div>
      </div>

      {!finalAnswer.trim() && !result && <p className="mt-4 text-[13px] text-ink-secondary">Run a final check to catch what you missed.</p>}

      <button id="btn-check" onClick={run} disabled={loading || !finalAnswer.trim() || disabled}
        className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-yc hover:bg-yc-hover disabled:bg-surface-muted disabled:text-ink-faint text-[var(--button-text)] text-[13px] font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-yc/10 disabled:shadow-none disabled:border disabled:border-edge disabled:cursor-not-allowed cursor-pointer">
        {loading ? <><span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" /> Checking...</>
          : <><CheckCircle2 className="w-4 h-4" /> Run readiness check</>}
      </button>

      {disabled && disabledMessage && <div className="mt-4 p-3 rounded-xl bg-surface-muted text-ink-muted text-[13px] border border-edge">{disabledMessage}</div>}
      {error && <div className="mt-4 p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">{error}</div>}

      {result && <p className="mt-4 text-[13px] text-ink-secondary">Report ready. Review the readiness details on the right.</p>}
    </section>
  );
}
