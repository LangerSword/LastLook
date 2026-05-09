import { useState } from 'react';
import { Search } from 'lucide-react';
import type { BriefAnalysis } from '../lib/types';
import { analyzeBrief } from '../lib/api';

interface Props {
  brief: string;
  onBriefChange: (b: string) => void;
  analysis: BriefAnalysis | null;
  onAnalysis: (a: BriefAnalysis) => void;
  onStartLoading?: () => void;
  onEndLoading?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function BriefAnalyzer({ brief, onBriefChange, analysis, onAnalysis, onStartLoading, onEndLoading, disabled, disabledMessage }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!brief.trim()) return;
    setLoading(true); setError(null);
    if (onStartLoading) onStartLoading();
    try { onAnalysis(await analyzeBrief(brief)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { 
      setLoading(false); 
      if (onEndLoading) onEndLoading();
    }
  };

  const inputCls = "w-full bg-surface border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none resize-none";

  return (
    <section id="brief-analyzer" className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">02 / brief</span>

      <label htmlFor="input-brief" className="block text-[11px] font-medium text-ink-secondary mb-1.5 mt-4 uppercase tracking-wider">Application Brief</label>
      <textarea id="input-brief" rows={4} value={brief} onChange={e => onBriefChange(e.target.value)}
        placeholder="Paste the application brief or prompt here..." className={`${inputCls} mb-4`} />

      {!brief.trim() && !analysis && <p className="text-[13px] text-ink-secondary mb-4">Paste a brief to extract the hidden checklist.</p>}

      <button id="btn-analyze" onClick={run} disabled={loading || !brief.trim() || disabled}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-yc hover:bg-yc-hover disabled:bg-surface-muted disabled:text-ink-faint text-[var(--button-text)] text-[13px] font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-yc/10 disabled:shadow-none disabled:border disabled:border-edge disabled:cursor-not-allowed cursor-pointer">
        {loading ? <><span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" /> Extracting...</>
          : <><Search className="w-4 h-4" /> Extract requirements</>}
      </button>

      {disabled && disabledMessage && <div className="mt-4 p-3 rounded-xl bg-surface-muted text-ink-muted text-[13px] border border-edge">{disabledMessage}</div>}
      {error && <div className="mt-4 p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">{error}</div>}

      {analysis && <p className="mt-4 text-[13px] text-ink-secondary">Analysis ready. See the breakdown on the right.</p>}
    </section>
  );
}
