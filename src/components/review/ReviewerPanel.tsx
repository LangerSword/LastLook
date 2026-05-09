import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { ReviewerPanel } from '../../lib/types';

const statusForScore = (score: number) => {
  if (score >= 80) return { tone: 'ok', icon: ShieldCheck, label: 'Strong' } as const;
  if (score >= 60) return { tone: 'warn', icon: AlertTriangle, label: 'Improve' } as const;
  return { tone: 'err', icon: AlertOctagon, label: 'Blocker' } as const;
};

type ReviewerResult = {
  score: number;
  summary: string;
  findings: string[];
};

type ReviewerPanelData = {
  requirements?: ReviewerResult;
  fit?: ReviewerResult;
  clarity?: ReviewerResult;
  length?: ReviewerResult;
  voice?: ReviewerResult;
  risk?: ReviewerResult;
};

interface Props {
  panel: ReviewerPanel | ReviewerPanelData;
}

export default function ReviewerPanel({ panel }: Props) {
  const entries = Object.entries(panel) as [string, ReviewerResult][];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {entries.map(([key, reviewer], idx) => {
        const status = statusForScore(reviewer.score);
        const Icon = status.icon;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="rounded-2xl border border-edge bg-surface p-5 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] font-semibold text-ink capitalize">{key} reviewer</div>
                <div className="text-[11px] text-ink-muted">{reviewer.summary}</div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                status.tone === 'ok'
                  ? 'bg-ok-soft text-ok'
                  : status.tone === 'warn'
                  ? 'bg-warn-soft text-warn'
                  : 'bg-err-soft text-err'
              }`}>
                {reviewer.score}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(reviewer.findings ?? []).slice(0, 3).map((finding: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-ink-secondary">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 ${
                    status.tone === 'ok' ? 'text-ok' : status.tone === 'warn' ? 'text-warn' : 'text-err'
                  }`} />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
