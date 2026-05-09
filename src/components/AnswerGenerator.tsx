import { useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { UserMemory, BriefAnalysis, GeneratedAnswer, ToneOption, LengthOption, ApplicationType, ReviewStrictness } from '../lib/types';
import { generateAnswer } from '../lib/api';

interface Props {
  memory: UserMemory | null;
  analysis: BriefAnalysis | null;
  question: string;
  onQuestionChange: (q: string) => void;
  generated: GeneratedAnswer | null;
  onGenerated: (g: GeneratedAnswer) => void;
  tone: ToneOption;
  onToneChange: (t: ToneOption) => void;
  targetLength: LengthOption;
  onLengthChange: (l: LengthOption) => void;
  applicationType?: ApplicationType;
  reviewStrictness?: ReviewStrictness;
  onStartLoading?: () => void;
  onEndLoading?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

const tones: ToneOption[] = ['Confident', 'Warm', 'Technical', 'Founder-like', 'Concise'];
const lengths: LengthOption[] = ['100 words', '150 words', '200 words', '60-90 sec video'];

export default function AnswerGenerator({ memory, analysis, question, onQuestionChange, generated, onGenerated, tone, onToneChange, targetLength, onLengthChange, applicationType, reviewStrictness, onStartLoading, onEndLoading, disabled, disabledMessage }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!question.trim()) return;
    setLoading(true); setError(null);
    if (onStartLoading) onStartLoading();
    try {
      onGenerated(
        await generateAnswer({
          memory: memory ?? {},
          briefAnalysis: analysis ?? {},
          question,
          tone,
          targetLength,
          applicationType,
          reviewStrictness,
        })
      );
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { 
      setLoading(false); 
      if (onEndLoading) onEndLoading();
    }
  };

  const inputCls = "w-full bg-surface border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none";

  return (
    <section id="answer-generator" className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">03 / draft</span>
      <div className="space-y-4 mt-4">
        <div>
          <label htmlFor="input-question" className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">Application Question</label>
          <textarea id="input-question" rows={3} value={question} onChange={e => onQuestionChange(e.target.value)} placeholder="What question are you answering?" className={`${inputCls} resize-none`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="select-tone" className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">Tone</label>
            <select id="select-tone" value={tone} onChange={e => onToneChange(e.target.value as ToneOption)} className={`${inputCls} cursor-pointer`}>
              {tones.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="select-length" className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">Target Length</label>
            <select id="select-length" value={targetLength} onChange={e => onLengthChange(e.target.value as LengthOption)} className={`${inputCls} cursor-pointer`}>
              {lengths.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!memory && <p className="mt-4 text-[13px] text-warn flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Save your memory first for personalized drafts.</p>}

      <button id="btn-generate" onClick={run} disabled={loading || !question.trim() || disabled}
        className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-yc hover:bg-yc-hover disabled:bg-surface-muted disabled:text-ink-faint text-[var(--button-text)] text-[13px] font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-yc/10 disabled:shadow-none disabled:border disabled:border-edge disabled:cursor-not-allowed cursor-pointer">
        {loading ? <><span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" /> Drafting...</>
          : <><Sparkles className="w-4 h-4" /> Draft answer</>}
      </button>

      {disabled && disabledMessage && <div className="mt-4 p-3 rounded-xl bg-surface-muted text-ink-muted text-[13px] border border-edge">{disabledMessage}</div>}
      {error && <div className="mt-4 p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">{error}</div>}

      {!generated && <p className="mt-4 text-[13px] text-ink-secondary">Draft an answer using your saved memory.</p>}
      {generated && <p className="mt-4 text-[13px] text-ink-secondary">Draft ready. Review it on the right.</p>}
    </section>
  );
}
