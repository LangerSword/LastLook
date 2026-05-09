import ReviewerProgress from './review/ReviewerProgress';

interface Props {
  currentStageIdx: number; // 0 to N-1
  stages: string[];
}

export default function AnalysisLoader({ currentStageIdx, stages }: Props) {
  return (
    <div className="w-full h-full min-h-[420px] flex flex-col justify-center max-w-md mx-auto p-6 animate-fade-in">
      <ReviewerProgress stages={stages} currentIdx={currentStageIdx} />

      <div className="mt-6 grid gap-3">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="rounded-2xl border border-edge bg-surface p-4 shadow-soft animate-soft-pulse">
            <div className="h-3 w-1/3 bg-surface-muted rounded-full" />
            <div className="mt-3 h-2 w-5/6 bg-surface-muted rounded-full" />
            <div className="mt-2 h-2 w-2/3 bg-surface-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
