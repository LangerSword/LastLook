import AnimatedSection from '../components/motion/AnimatedSection';

export default function WalkthroughPage() {
  return (
    <div className="space-y-6">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">walkthrough</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">How LastLook works</h1>
        <p className="text-[13px] text-ink-secondary mt-2">A quick evaluator-friendly guide.</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          {
            title: '1. Brief to checklist',
            body: 'Paste the opportunity brief. LastLook extracts explicit requirements and implied criteria, turning it into a checklist.',
          },
          {
            title: '2. Reviewer agents',
            body: 'Six specialist reviewers score fit, clarity, length, voice, and risk. Each reviewer adds concrete findings.',
          },
          {
            title: '3. Readiness dashboard',
            body: 'The dashboard surfaces the next best edit, blockers, and fix order so you can decide if it is ready.',
          },
          {
            title: '4. Interpret the score',
            body: 'Scores under 60 need major fixes, 60-79 need targeted edits, 80+ are submission ready with minor polish.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
            <h2 className="text-[15px] font-semibold text-ink">{item.title}</h2>
            <p className="text-[13px] text-ink-secondary mt-2">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
        <h2 className="text-[15px] font-semibold text-ink">Demo script</h2>
        <ol className="mt-3 space-y-2 text-[13px] text-ink-secondary">
          <li>1. Open New Review and paste the brief.</li>
          <li>2. Select the application type and strictness.</li>
          <li>3. Run full LastLook.</li>
          <li>4. Open the review dashboard for the decision summary.</li>
        </ol>
      </div>
    </div>
  );
}
