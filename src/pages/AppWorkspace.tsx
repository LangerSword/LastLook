import { useState, useEffect } from 'react';
import { Sparkles, Play, ChevronDown, Zap, Brain, FileText, ScanLine, Pencil } from 'lucide-react';
import type { ApplicationMemory, BriefAnalysis, GeneratedAnswer, CheckResult, ToneOption, LengthOption, ApplicationType, ReviewStrictness } from '../lib/types';
import { getMemory, saveMemory } from '../lib/memoryStore';
import { sampleProfile, sampleBrief, sampleQuestion, sampleWeakAnswer } from '../lib/sampleData';
import MemoryPanel from '../components/MemoryPanel';
import BriefAnalyzer from '../components/BriefAnalyzer';
import AnswerGenerator from '../components/AnswerGenerator';
import LastLookChecker from '../components/LastLookChecker';
import ReviewStudio, { type LoadingState } from '../components/ReviewStudio';
import TweakLab from '../components/review/TweakLab';
import { runFullLastLook } from '../lib/api';
import { saveReviewSession, type ReviewSession } from '../lib/reviewStore';
import { buildTailoredDashboardSummary } from '../lib/dashboardSummary';
import ReviewStepper from '../components/review/ReviewStepper';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../contexts/AuthContext';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function AppWorkspace() {
  const [memory, setMemory] = useState<ApplicationMemory | null>(null);
  const [brief, setBrief] = useState('');
  const [analysis, setAnalysis] = useState<BriefAnalysis | null>(null);
  const [question, setQuestion] = useState('');
  const [generated, setGenerated] = useState<GeneratedAnswer | null>(null);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const [programName, setProgramName] = useState('');
  const [applicationType, setApplicationType] = useState<ApplicationType>('Fellowship');
  const [deadline, setDeadline] = useState('');
  const [strictness, setStrictness] = useState<ReviewStrictness>('Balanced');
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([
    'requirements',
    'fit',
    'clarity',
    'length',
    'voice',
    'risk',
  ]);
  
  const [tone, setTone] = useState<ToneOption>('Confident');
  const [targetLength, setTargetLength] = useState<LengthOption>('150 words');
  
  const [runMode, setRunMode] = useState<'step' | 'full'>('full');
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const usage = useUsage();
  const { isAuthenticated, isDemoMode } = useAuth();
  
  const isFullReviewLimitHit = isAuthenticated && !isDemoMode && usage.fullReviewsUsed >= 5;
  const isIndividualLimitHit = isAuthenticated && !isDemoMode && usage.individualActionsUsed >= 15;
  const limitMsg = "You’ve used today’s free review limit. You can still view saved reviews and edit drafts.";

  useEffect(() => {
    void (async () => {
      const snapshot = await getMemory();
      setMemory(snapshot.memory);
    })();
  }, []);

  useEffect(() => {
    const storedType = localStorage.getItem('lastlook_default_app_type');
    const storedStrictness = localStorage.getItem('lastlook_default_strictness');
    if (storedType) setApplicationType(storedType as ApplicationType);
    if (storedStrictness) setStrictness(storedStrictness as ReviewStrictness);
  }, []);

  useEffect(() => {
    const active = localStorage.getItem('lastlook_active_session');
    if (!active) return;
    try {
      const session = JSON.parse(active) as ReviewSession;
      setBrief(session.brief || '');
      setQuestion(session.question || '');
      setFinalAnswer(session.finalAnswer || '');
      setAnalysis(session.briefAnalysis || null);
      setCheckResult(session.readinessReport || null);
      if (session.generatedDraft) {
        setGenerated({ draft: session.generatedDraft, whyItWorks: [], customize: [] });
      }
      setRunMode('step');
      setSaveState('saved');
    } catch {
      // ignore malformed payloads
    } finally {
      localStorage.removeItem('lastlook_active_session');
    }
  }, []);

  const handleDemo = async () => {
    const saved = await saveMemory(sampleProfile);
    setMemory(saved.memory);
    setBrief(sampleBrief); setQuestion(sampleQuestion); setFinalAnswer(sampleWeakAnswer);
    setProgramName('Founders Fellowship 2026');
    setApplicationType('Fellowship');
    setDeadline('');
    setStrictness('Balanced');
    setAnalysis(null); setGenerated(null); setCheckResult(null);
    setLoadingState(null); setRunError(null);
    setSaveState('idle'); setSaveError(null);
    setLastSavedId(null);
  };

  const handleResetResults = () => {
    setAnalysis(null); setGenerated(null); setCheckResult(null);
    setLoadingState(null); setRunError(null);
    setSaveState('idle'); setSaveError(null);
    setLastSavedId(null);
  };

  const handleRunFull = async () => {
    if (!brief.trim() || !question.trim()) {
      setRunError("Please provide both a brief and a question first.");
      return;
    }
    
    const stages = [
      'Requirement Reviewer is extracting the checklist',
      'Fit Reviewer is checking opportunity alignment',
      'Clarity Reviewer is checking structure',
      'Length Reviewer is estimating word/time fit',
      'Voice Reviewer is checking consistency',
      'Risk Reviewer is finding blockers',
      'Building readiness dashboard',
      'Saving review session',
    ];
    setLoadingState({ active: true, stages, currentIdx: 0 });
    setRunError(null);
    setSaveState('idle');
    setSaveError(null);
    
    try {
      // 1-4
      const res = await runFullLastLook({
        brief,
        memory,
        question,
        tone,
        targetLength,
        finalAnswer,
        applicationType,
        reviewStrictness: strictness,
        programName,
        deadline,
      }, (step) => {
        const map = { 1: 1, 2: 3, 3: 5, 4: 6 } as Record<number, number>;
        setLoadingState({ active: true, stages, currentIdx: map[step] ?? 0 });
      });
      
      const draft = res.generatedAnswer.draft;
      const fAns = finalAnswer.trim() || draft;

      // 5. Save review session
      setLoadingState({ active: true, stages, currentIdx: 7 });
      setSaveState('saving');
      const summary = buildTailoredDashboardSummary({
        memory,
        briefAnalysis: res.briefAnalysis,
        generatedAnswer: res.generatedAnswer,
        readinessReport: res.readinessReport,
        question,
        finalAnswer: fAns,
      });
      
      const saved = await saveReviewSession({
        title: programName || question.substring(0, 40) + '...',
        brief,
        question,
        finalAnswer: fAns,
        generatedDraft: draft,
        briefAnalysis: res.briefAnalysis,
        readinessReport: res.readinessReport,
        dashboardSummary: {
          ...summary,
          applicationType,
          reviewStrictness: strictness,
          programName,
          deadline,
        },
      });
      setSaveState(saved ? 'saved' : 'error');
      if (saved) setLastSavedId(saved.id);

      setLoadingState({ active: true, stages, currentIdx: 6 });

      setAnalysis(res.briefAnalysis);
      setGenerated(res.generatedAnswer);
      setCheckResult(res.readinessReport);
      if (!finalAnswer.trim()) setFinalAnswer(draft);
      setLoadingState(null);

    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Run failed");
      setLoadingState(null);
      setSaveState('error');
    }
  };

  const handleSaveSession = async () => {
    if (!analysis || !checkResult) {
      setRunError('Run a readiness check before saving.');
      return;
    }

    const fAns = finalAnswer.trim() || generated?.draft || '';
    if (!fAns) {
      setRunError('Add a final answer before saving.');
      return;
    }

    setRunError(null);
    setSaveState('saving');
    setSaveError(null);

    try {
      const summary = buildTailoredDashboardSummary({
        memory,
        briefAnalysis: analysis,
        generatedAnswer: generated,
        readinessReport: checkResult,
        question,
        finalAnswer: fAns,
      });

      const saved = await saveReviewSession({
        title: programName || question.substring(0, 40) + '...',
        brief,
        question,
        finalAnswer: fAns,
        generatedDraft: generated?.draft,
        briefAnalysis: analysis,
        readinessReport: checkResult,
        dashboardSummary: {
          ...summary,
          applicationType,
          reviewStrictness: strictness,
          programName,
          deadline,
        },
      });
      setSaveState(saved ? 'saved' : 'error');
      if (saved) setLastSavedId(saved.id);
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleFinalAnswerChange = (value: string) => {
    setFinalAnswer(value);
    if (checkResult) setCheckResult(null);
    setSaveState('idle');
    setSaveError(null);
  };

  const handleSaveSnippet = async (value: string) => {
    if (!memory) return;
    const updatedMemory = {
      ...memory,
      answerLibrary: [
        ...memory.answerLibrary,
        {
          title: question.trim().slice(0, 60) || 'Saved answer snippet',
          body: value,
          tags: [applicationType.toLowerCase()],
        },
      ],
    };
    const saved = await saveMemory(updatedMemory);
    setMemory(saved.memory);
  };
  const handleGenerated = (g: GeneratedAnswer) => {
    setGenerated(g);
    if (!finalAnswer.trim()) setFinalAnswer(g.draft);
    if (checkResult) setCheckResult(null);
    setSaveState('idle');
    setSaveError(null);
  };
  const handleBriefChange = (value: string) => {
    setBrief(value);
    if (analysis) setAnalysis(null);
    setSaveState('idle');
    setSaveError(null);
  };
  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    if (generated) setGenerated(null);
    if (checkResult) setCheckResult(null);
    if (loadingState) setLoadingState(null);
    setSaveState('idle');
    setSaveError(null);
  };

  const toggleReviewer = (id: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckResultChange = (value: CheckResult | null) => {
    setCheckResult(value);
    setSaveState('idle');
    setSaveError(null);
  };

  const activeStep = (() => {
    if (checkResult) return 5;
    if (loadingState?.active) return 4;
    if (generated || finalAnswer.trim()) return 3;
    if (brief.trim() || question.trim() || programName.trim()) return 1;
    return 0;
  })();

  return (
    <div className="pb-20 pt-6 animate-fade-in">
      {/* ─── WORKSPACE HEADER ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">application command center</span>
            {isAuthenticated && !isDemoMode && (
              <span className="px-2 py-0.5 rounded-full bg-ok-soft text-ok text-[10px] font-semibold">
                {usage.fullReviewsUsed}/5 reviews today
              </span>
            )}
          </div>
          <h2 className="text-[clamp(1.6rem,2.8vw,2.2rem)] font-bold text-ink mt-1 font-headline">
            Build a decision-ready review.
          </h2>
          <p className="text-[14px] text-ink-secondary mt-2 max-w-xl">
            Configure the opportunity, bring your memory, and run the specialist reviewer panel.
          </p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-surface rounded-2xl border border-edge shadow-sm">
          <button
            onClick={() => setRunMode('full')}
            className={`px-4 py-2 text-[12px] font-semibold rounded-xl transition-all ${runMode === 'full' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'}`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            Full Review
          </button>
          <button
            onClick={() => setRunMode('step')}
            className={`px-4 py-2 text-[12px] font-semibold rounded-xl transition-all ${runMode === 'step' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'}`}
          >
            <Play className="w-3.5 h-3.5 inline mr-1.5" />
            Step-by-step
          </button>
          <div className="w-px h-6 bg-edge mx-1" />
          <button onClick={handleDemo} className="px-4 py-2 text-[12px] font-medium rounded-xl transition-colors text-ink-secondary hover:text-ink hover:bg-surface-muted">
            Demo
          </button>
        </div>
      </div>

      {/* ─── STEP PROGRESS ──────────────────────────────────────── */}
      <div className="mb-8">
        <ReviewStepper
          activeStep={activeStep}
          steps={[
            { title: 'Opportunity', description: 'Program, brief, deadline' },
            { title: 'Memory', description: 'Profile, projects, links' },
            { title: 'Answer', description: 'Draft or paste response' },
            { title: 'Review', description: 'Run the reviewer panel' },
            { title: 'Results', description: 'Fix plan + next best edit' },
            { title: 'Packet', description: 'Export and submit' },
          ]}
        />
      </div>

      {/* ─── MAIN WORKSPACE GRID ────────────────────────────────── */}
      <div className="workspace-grid">
        {/* Left Column: Application Builder (~60%) */}
        <div className="space-y-6">
          {/* Opportunity Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Step 1</span>
                <h3 className="text-[15px] font-bold text-ink mt-1">Opportunity Setup</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-[12px] text-ink-secondary">
                Program name
                <input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Founders Fellowship 2026"
                  className="mt-2 w-full bg-[var(--surface-2)] border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </label>
              <label className="text-[12px] text-ink-secondary">
                Application type
                <div className="relative mt-2">
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as ApplicationType)}
                    className="w-full bg-[var(--surface-2)] border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink appearance-none"
                  >
                    {['Fellowship', 'Hackathon', 'Internship', 'Accelerator', 'Scholarship', 'Club/community', 'Grant', 'Other'].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </label>
              <label className="text-[12px] text-ink-secondary md:col-span-2">
                Deadline (optional)
                <input
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  type="date"
                  className="mt-2 w-full md:w-1/2 bg-[var(--surface-2)] border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </label>
            </div>
          </div>

          {/* Memory Card — First Class */}
          <div className="card p-6 border-[var(--accent)]/20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Step 2</span>
                <h3 className="text-[15px] font-bold text-ink mt-1">Your Memory</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[13px] text-ink-secondary mb-4">
              Save your profile, projects, achievements, and links. LastLook uses them to make feedback specific to you.
            </p>
            <MemoryPanel memory={memory} onMemoryChange={setMemory} />
          </div>

          {/* Brief + Question */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Step 3</span>
                <h3 className="text-[15px] font-bold text-ink mt-1">Brief & Answer</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-edge flex items-center justify-center text-ink-muted">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-5">
              <BriefAnalyzer
                brief={brief}
                onBriefChange={handleBriefChange}
                analysis={analysis}
                onAnalysis={setAnalysis}
                onStartLoading={() => setLoadingState({ active: true, stages: ['Requirement Reviewer is extracting the checklist'], currentIdx: 0 })}
                onEndLoading={() => setLoadingState(null)}
                disabled={isIndividualLimitHit}
                disabledMessage={limitMsg}
              />
              <AnswerGenerator
                memory={memory}
                analysis={analysis}
                question={question}
                onQuestionChange={handleQuestionChange}
                generated={generated}
                onGenerated={handleGenerated}
                tone={tone}
                onToneChange={setTone}
                targetLength={targetLength}
                onLengthChange={setTargetLength}
                applicationType={applicationType}
                reviewStrictness={strictness}
                onStartLoading={() => setLoadingState({ active: true, stages: ['Clarity Reviewer is checking structure', 'Length Reviewer is estimating word/time fit'], currentIdx: 0 })}
                onEndLoading={() => setLoadingState(null)}
                disabled={isIndividualLimitHit}
                disabledMessage={limitMsg}
              />
            </div>
          </div>

          {/* Review Settings */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Step 4</span>
                <h3 className="text-[15px] font-bold text-ink mt-1">Review Settings</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-edge flex items-center justify-center text-ink-muted">
                <ScanLine className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <label className="text-[12px] text-ink-secondary">
                Review strictness
                <div className="relative mt-2">
                  <select
                    value={strictness}
                    onChange={(e) => setStrictness(e.target.value as ReviewStrictness)}
                    className="w-full bg-[var(--surface-2)] border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink appearance-none"
                  >
                    {['Gentle', 'Balanced', 'Brutal'].map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </label>
            </div>
            <div>
              <div className="text-[12px] text-ink-secondary mb-2">Reviewer agents</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'requirements', label: 'Requirement' },
                  { id: 'fit', label: 'Fit' },
                  { id: 'clarity', label: 'Clarity' },
                  { id: 'evidence', label: 'Evidence' },
                  { id: 'length', label: 'Length' },
                  { id: 'voice', label: 'Voice' },
                  { id: 'risk', label: 'Risk' },
                ].map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleReviewer(agent.id)}
                    className={`px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
                      selectedReviewers.includes(agent.id)
                        ? 'bg-yc-soft text-yc border-yc/30'
                        : 'bg-[var(--surface-2)] text-ink-secondary border-edge'
                    }`}
                  >
                    {agent.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Final Answer Editor */}
          <LastLookChecker
            analysis={analysis}
            question={question}
            finalAnswer={finalAnswer}
            onFinalAnswerChange={handleFinalAnswerChange}
            result={checkResult}
            onResultChange={handleCheckResultChange}
            applicationType={applicationType}
            reviewStrictness={strictness}
            onStartLoading={() => setLoadingState({ active: true, stages: ['Risk Reviewer is finding blockers', 'Building readiness dashboard'], currentIdx: 0 })}
            onEndLoading={() => setLoadingState(null)}
            disabled={isIndividualLimitHit}
            disabledMessage={limitMsg}
          />

          {/* Run CTA */}
          <div className="card p-6 bg-gradient-to-br from-surface to-[var(--accent-soft)]/30 border-[var(--accent)]/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-ink mb-1">Run Full LastLook</h3>
                <p className="text-[13px] text-ink-secondary mb-4">
                  Run all reviewer agents in one pass when your brief and answer are ready.
                </p>
                {isFullReviewLimitHit && (
                  <div className="mb-4 p-3 rounded-xl bg-warn-soft text-warn text-[13px] border border-warn/20">{limitMsg}</div>
                )}
                <button
                  onClick={handleRunFull}
                  disabled={loadingState?.active || isFullReviewLimitHit}
                  className="btn-primary text-[14px] px-6 py-3 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  {loadingState?.active ? 'Running review panel...' : 'Run full LastLook'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Review Studio (~40%) */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-6 self-start">
          <ReviewStudio
            analysis={analysis}
            generated={generated}
            checkResult={checkResult}
            loadingState={loadingState}
            error={runError}
            onReset={handleResetResults}
            memory={memory}
            briefText={brief}
            question={question}
            finalAnswer={finalAnswer}
            applicationType={applicationType}
            reviewStrictness={strictness}
            programName={programName}
            deadline={deadline}
            openReviewPath={lastSavedId ? `/reviews/${lastSavedId}` : undefined}
            onSaveSession={handleSaveSession}
            saveState={saveState}
            saveError={saveError}
          />

          {/* Tweak Lab — visually separate */}
          {(analysis || generated || checkResult || finalAnswer.trim()) && (
            <div className="card p-6 border-[var(--accent)]/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Tweak Lab</span>
                  <h3 className="text-[14px] font-bold text-ink">Targeted improvements</h3>
                </div>
              </div>
              <TweakLab
                memory={memory}
                analysis={analysis}
                question={question}
                currentAnswer={finalAnswer || generated?.draft || ''}
                applicationType={applicationType}
                reviewStrictness={strictness}
                onReplaceAnswer={handleFinalAnswerChange}
                onSaveToLibrary={handleSaveSnippet}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
