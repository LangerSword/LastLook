import { useMemo, useState } from 'react';
import { ArrowLeftRight, Copy, Save, Sparkles } from 'lucide-react';
import type { ApplicationMemory, ApplicationType, BriefAnalysis, ReviewStrictness } from '../../lib/types';
import { saveMemory } from '../../lib/memoryStore';

export interface TweakResult {
  updatedText: string;
  whatChanged: string[];
  whyItHelps: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

type TweakMode =
  | 'strengthen-fit'
  | 'explain-project'
  | 'less-generic'
  | 'add-evidence'
  | 'shorten'
  | 'expand'
  | 'improve-opening'
  | 'improve-closing'
  | 'video-script'
  | 'fix-tone';

interface Props {
  memory?: ApplicationMemory | null;
  analysis?: BriefAnalysis | null;
  question?: string;
  answer?: string;
  currentAnswer?: string;
  onUpdate?: (value: string) => void;
  applicationType?: ApplicationType;
  reviewStrictness?: ReviewStrictness;
  onReplaceAnswer?: (value: string) => void;
  onSaveToLibrary?: (value: string) => void;
  brief?: string;
}

const genericPhrases = [
  'smart people',
  'learn from mentors',
  'exciting opportunity',
  'passionate about technology',
  'make an impact',
  'i want to grow',
  'this program is a great fit',
];

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function speakingTimeSeconds(text: string): number {
  return Math.round((wordCount(text) / 145) * 60);
}

function clampText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim();
}

function buildVideoScript(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.map((sentence) => `- ${sentence.trim()}`).join('\n');
}

function replaceGenericPhrases(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  let updated = text;
  const changes: string[] = [];

  for (const phrase of genericPhrases) {
    if (updated.toLowerCase().includes(phrase)) {
      const replacement = memory?.projects[0]?.oneLiner || memory?.profile.currentFocus || 'a specific project and outcome';
      updated = updated.replace(new RegExp(phrase, 'ig'), replacement);
      changes.push(`Replaced "${phrase}" with a memory-backed detail.`);
    }
  }

  return { text: updated, changed: changes };
}

function explainProjects(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  if (!memory?.projects.length) return { text, changed: [] };

  let updated = text;
  const changes: string[] = [];

  for (const project of memory.projects) {
    if (!project.name) continue;
    const namePattern = new RegExp(`\\b${project.name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
    if (namePattern.test(updated) && project.oneLiner && !updated.toLowerCase().includes(project.oneLiner.toLowerCase())) {
      updated = updated.replace(namePattern, `${project.name} (${project.oneLiner})`);
      changes.push(`Explained ${project.name} using its saved one-liner.`);
    }
  }

  return { text: updated, changed: changes };
}

function addFitSentence(text: string, memory: ApplicationMemory | null, applicationType?: ApplicationType, question?: string): { text: string; changed: string[] } {
  const fitLine = memory?.profile.currentFocus
    ? `This matters to me right now because ${memory.profile.currentFocus.toLowerCase()}.`
    : `This matters to me right now because I am building practical systems and AI products.`;
  const typeLine = applicationType ? `That is why this ${applicationType.toLowerCase()} feels relevant at this stage.` : '';
  const questionLine = question?.trim() ? `It also matches the prompt you gave: ${question.trim().slice(0, 90)}.` : '';
  return {
    text: clampText(`${fitLine} ${typeLine} ${questionLine} ${text}`),
    changed: ['Added a specific fit sentence grounded in current focus and opportunity type.'],
  };
}

function addEvidence(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  const project = memory?.projects[0];
  const achievement = memory?.achievements[0];
  const evidencePieces: string[] = [];

  if (project?.oneLiner) evidencePieces.push(`For example, ${project.name} is ${project.oneLiner.toLowerCase()}`);
  if (achievement?.description) evidencePieces.push(`I have also ${achievement.description.toLowerCase()}`);

  if (!evidencePieces.length) return { text, changed: [] };

  return {
    text: clampText(`${text} ${evidencePieces.join(' ')}.`),
    changed: ['Added evidence from saved projects and achievements.'],
  };
}

function shorten(text: string): { text: string; changed: string[] } {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept = sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.72)));
  return { text: clampText(kept.join(' ')), changed: ['Trimmed the answer to the strongest sentences.'] };
}

function expand(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  const project = memory?.projects[0];
  const addition = project?.bestUseCase
    ? `That makes ${project.name} especially useful when the evaluator wants a builder who can explain the problem, the tool, and why it matters.`
    : 'That adds a concrete example and makes the answer easier to judge.';
  return { text: clampText(`${text} ${addition}`), changed: ['Added one more specific sentence to meet a longer target.'] };
}

function improveOpening(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  const intro = memory?.profile.name ? `I’m ${memory.profile.name}, and ` : 'I’m a builder, and ';
  const rest = text.replace(/^\s*I['’]?m[^.?!]*[.?!]?\s*/i, '');
  return { text: clampText(`${intro}${rest}`), changed: ['Strengthened the first line with identity and momentum.'] };
}

function improveClosing(text: string): { text: string; changed: string[] } {
  return {
    text: clampText(`${text} I’d love the chance to build, learn, and contribute directly.`),
    changed: ['Added a confident closing line.'],
  };
}

function fixTone(text: string, memory: ApplicationMemory | null, strictness?: ReviewStrictness): { text: string; changed: string[] } {
  const tone = memory?.profile.preferredTone || 'confident, direct, builder-like';
  return {
    text: clampText(`${text} ${strictness === 'Brutal' ? 'I keep the answer direct and evidence-first.' : `I’m keeping the tone ${tone}.`}`),
    changed: ['Adjusted the answer to match the saved tone preference.'],
  };
}

function makeLessGeneric(text: string, memory: ApplicationMemory | null): { text: string; changed: string[] } {
  const withProjects = explainProjects(text, memory);
  const withGenericReplacements = replaceGenericPhrases(withProjects.text, memory);
  return {
    text: clampText(withGenericReplacements.text),
    changed: [...withProjects.changed, ...withGenericReplacements.changed],
  };
}

function getResult(mode: TweakMode, text: string, memory: ApplicationMemory | null, applicationType?: ApplicationType, question?: string, strictness?: ReviewStrictness): TweakResult {
  let updated = text;
  let changes: string[] = [];

  switch (mode) {
    case 'strengthen-fit': {
      const result = addFitSentence(updated, memory, applicationType, question);
      updated = result.text;
      changes = result.changed;
      break;
    }
    case 'explain-project': {
      const result = explainProjects(updated, memory);
      updated = result.text;
      changes = result.changed.length ? result.changed : ['No project names needed explanation.'];
      break;
    }
    case 'less-generic': {
      const result = makeLessGeneric(updated, memory);
      updated = result.text;
      changes = result.changed.length ? result.changed : ['No generic phrases detected.'];
      break;
    }
    case 'add-evidence': {
      const result = addEvidence(updated, memory);
      updated = result.text;
      changes = result.changed.length ? result.changed : ['No saved evidence was available.'];
      break;
    }
    case 'shorten': {
      const result = shorten(updated);
      updated = result.text;
      changes = result.changed;
      break;
    }
    case 'expand': {
      const result = expand(updated, memory);
      updated = result.text;
      changes = result.changed;
      break;
    }
    case 'improve-opening': {
      const result = improveOpening(updated, memory);
      updated = result.text;
      changes = result.changed;
      break;
    }
    case 'improve-closing': {
      const result = improveClosing(updated);
      updated = result.text;
      changes = result.changed;
      break;
    }
    case 'video-script': {
      updated = buildVideoScript(updated);
      changes = ['Converted the answer into a spoken script with pacing-friendly line breaks.'];
      break;
    }
    case 'fix-tone': {
      const result = fixTone(updated, memory, strictness);
      updated = result.text;
      changes = result.changed;
      break;
    }
  }

  const wc = wordCount(updated);
  return {
    updatedText: updated,
    whatChanged: changes,
    whyItHelps: [
      'Keeps the answer tied to the saved memory instead of generic filler.',
      'Improves evaluator readability and fit.',
    ],
    wordCount: wc,
    speakingTimeSeconds: speakingTimeSeconds(updated),
  };
}

export default function TweakLab({
  memory,
  analysis,
  question,
  answer: answerProp,
  currentAnswer,
  onUpdate: onUpdateProp,
  applicationType,
  reviewStrictness,
  onReplaceAnswer,
  onSaveToLibrary,
  brief,
}: Props) {
  const [mode, setMode] = useState<TweakMode>('strengthen-fit');
  const [result, setResult] = useState<TweakResult | null>(null);

  // Support both answer and currentAnswer prop names
  const answerValue = answerProp ?? currentAnswer ?? '';
  
  const answerLength = useMemo(() => wordCount(answerValue), [answerValue]);

  // Support both onUpdate and onReplaceAnswer prop names
  const handleUpdate = onUpdateProp ?? onReplaceAnswer;

  const run = (nextMode: TweakMode) => {
    setMode(nextMode);
    setResult(getResult(nextMode, answerValue, memory ?? null, applicationType, question ?? '', reviewStrictness));
  };

  const saveSnippet = async () => {
    if (!result) return;
    onSaveToLibrary?.(result.updatedText);
    if (memory) {
      await saveMemory(memory);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-ink font-headline">Fine-tune your answer</h3>
          <p className="mt-1 text-[13px] text-ink-secondary">Use memory-backed edits to make the answer more specific, tighter, or more natural.</p>
        </div>
        <div className="text-right text-[11px] text-ink-muted font-mono">
          <div>{answerLength} words</div>
          <div>~{Math.round((answerLength / 145) * 60)} sec</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['strengthen-fit', 'Strengthen fit'],
          ['explain-project', 'Explain project better'],
          ['less-generic', 'Make less generic'],
          ['add-evidence', 'Add evidence'],
          ['shorten', 'Shorten'],
          ['expand', 'Expand'],
          ['improve-opening', 'Improve opening'],
          ['improve-closing', 'Improve closing'],
          ['video-script', 'Convert to video script'],
          ['fix-tone', 'Fix tone'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => run(value as TweakMode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${mode === value ? 'border-yc bg-yc-soft text-yc' : 'border-edge bg-[var(--surface-2)] text-ink-secondary hover:text-ink hover:border-[var(--accent)]/30'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">Original</div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-secondary">{currentAnswer}</p>
          </div>
          <div className="card p-5 border-[var(--accent)]/20">
            <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">Improved</div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{result.updatedText}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted mb-2">What changed</div>
              <ul className="space-y-1.5">
                {result.whatChanged.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-yc mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted mb-2">Why it helps</div>
              <ul className="space-y-1.5">
                {result.whyItHelps.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-ok mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-edge">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-[12px] text-ink-secondary">
                <span className="font-medium">{result.wordCount} words</span>
                <span>~{result.speakingTimeSeconds} sec</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(result.updatedText)} className="btn-ghost text-[12px] px-3 py-2">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button onClick={() => handleUpdate?.(result.updatedText)} className="btn-secondary text-[12px] px-3 py-2">
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Replace
                </button>
                <button onClick={saveSnippet} className="btn-primary text-[12px] px-3 py-2">
                  <Save className="w-3.5 h-3.5" /> Save to library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="rounded-2xl border border-edge bg-[var(--surface-2)] p-5 text-[13px] text-ink-secondary">
          Pick a tweak to generate a memory-backed edit. {analysis?.summary ? 'The current review brief can guide the fit and evidence choices.' : ''}
        </div>
      )}
    </section>
  );
}
