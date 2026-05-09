import { useState, useEffect } from 'react';
import { Sparkles, Play, ChevronDown, Zap, Brain, FileText, ScanLine, Pencil, ArrowRight, ClipboardCheck, Package, Layout, Terminal } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState<'full' | 'tweak'>('full');

  const usage = useUsage();
  const { isAuthenticated, isDemoMode } = useAuth();
  
  const isFullReviewLimitHit = isAuthenticated && !isDemoMode && usage.fullReviewsUsed >= 5;
  const isIndividualLimitHit = isAuthenticated && !isDemoMode && usage.individualActionsUsed >= 15;

  useEffect(() => {
    void (async () => {
      const snapshot = await getMemory();
      setMemory(snapshot.memory);
    })();
  }, []);

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

  const handleDemo = async () => {
    const saved = await saveMemory(sampleProfile);
    setMemory(saved.memory);
    setBrief(sampleBrief); setQuestion(sampleQuestion); setFinalAnswer(sampleWeakAnswer);
    setProgramName('Founders Fellowship 2026');
    setApplicationType('Fellowship');
    setAnalysis(null); setGenerated(null); setCheckResult(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ─── WORKSPACE HEADER ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b-2 border-[var(--border)] px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lift">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-black uppercase tracking-tighter text-ink">Application Command Center</h1>
              <div className="flex items-center gap-2 text-[12px] text-ink-secondary font-bold uppercase tracking-widest">
                <span className={activeTab === 'full' ? 'text-[var(--accent)]' : ''}>Full Review</span>
                <span className="opacity-20">/</span>
                <span className={activeTab === 'tweak' ? 'text-[var(--accent)]' : ''}>Tweak Lab</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-[var(--surface-2)] border-2 border-[var(--border)] rounded-xl">
              <button 
                onClick={() => setActiveTab('full')}
                className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'full' ? 'bg-[var(--accent)] text-white shadow-soft' : 'text-ink-secondary hover:text-ink'}`}
              >
                Full Review
              </button>
              <button 
                onClick={() => setActiveTab('tweak')}
                className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'tweak' ? 'bg-[var(--accent)] text-white shadow-soft' : 'text-ink-secondary hover:text-ink'}`}
              >
                Tweak Lab
              </button>
            </div>
            <button onClick={handleDemo} className="btn-secondary px-4 py-2 text-[13px] font-bold border-2">Load Demo</button>
            <button 
              onClick={handleRunFull} 
              disabled={loadingState?.active}
              className="btn-primary px-6 py-2 text-[13px] font-bold rounded-xl shadow-lift disabled:opacity-50"
            >
              {loadingState?.active ? 'Running Agents...' : 'Run LastLook'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ─── LEFT PANEL: BUILDER ──────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'full' ? (
                <motion.div 
                  key="full-review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Timeline / Progress Rail */}
                  <div className="card p-6 bg-[var(--surface)] border-2 border-[var(--border)]">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[var(--accent)]" />
                        Application Builder
                      </h2>
                      <span className="text-[11px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 rounded">
                        Step-by-step
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-ink-secondary">Opportunity Brief</label>
                        <textarea 
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          placeholder="Paste the program description or brief here..."
                          className="w-full h-48 p-4 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-[14px]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-ink-secondary">Application Question</label>
                        <textarea 
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="What question are you answering?"
                          className="w-full h-48 p-4 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-[14px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card p-6 bg-[var(--surface)] border-2 border-[var(--border)]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-[var(--accent)]" />
                        Final Answer Editor
                      </h2>
                    </div>
                    <textarea 
                      value={finalAnswer}
                      onChange={(e) => setFinalAnswer(e.target.value)}
                      placeholder="Write your final answer here or generate a draft..."
                      className="w-full h-96 p-6 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all text-[15px] leading-relaxed"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="tweak-lab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TweakLab 
                    answer={finalAnswer} 
                    onUpdate={setFinalAnswer}
                    memory={memory}
                    brief={brief}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── RIGHT PANEL: STUDIO ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-28 space-y-6">
              <ReviewStudio 
                loading={loadingState} 
                analysis={analysis}
                generated={generated}
                checkResult={checkResult}
                onGenerated={handleGenerated}
              />
              
              <MemoryPanel 
                memory={memory} 
                onUpdate={setMemory}
                compact={true}
              />
            </div>
          </div>

        </div>
      </main>
      
      {/* Loading Overlay inspired by Festivent checkmarks */}
      <AnimatePresence>
        {loadingState?.active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/90 backdrop-blur-md p-6"
          >
            <div className="max-w-md w-full text-center">
              <div className="w-24 h-24 rounded-3xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-8 shadow-glow animate-bounce">
                <ScanLine className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-[24px] font-black uppercase tracking-tighter mb-4">Agents are inspecting...</h2>
              <div className="space-y-3">
                {loadingState.stages.map((stage, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[14px] font-bold transition-all ${i === loadingState.currentIdx ? 'text-[var(--accent)] scale-105' : i < loadingState.currentIdx ? 'text-[var(--success)]' : 'text-ink-faint'}`}>
                    {i < loadingState.currentIdx ? <CheckCircle2 className="w-4 h-4" /> : <div className={`w-4 h-4 rounded-full border-2 ${i === loadingState.currentIdx ? 'border-[var(--accent)] animate-spin border-t-transparent' : 'border-edge'}`} />}
                    {stage}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
