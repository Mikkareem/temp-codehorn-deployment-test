'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCodeHornStore } from '../store/useCodeHornStore';
import { CodeHornApiService } from '../services/api';
import ResizablePanel from './ResizablePanel';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronLeft, 
  Play, 
  CheckCircle, 
  HelpCircle, 
  ArrowLeftRight, 
  RotateCcw, 
  Flame, 
  Calendar, 
  Trophy, 
  Bookmark, 
  Check, 
  Info, 
  FlameKindling,
  BookOpen, 
  Clock, 
  Terminal, 
  AlertTriangle, 
  Copy, 
  Layers,
  Plus,
  X
} from 'lucide-react';
import { Submission } from '../types';

const PARAM_LABELS: Record<string, string[]> = {
  'two-sum': ['nums', 'target'],
  'valid-parentheses': ['s'],
  'longest-substring-without-repeating-characters': ['s'],
  'container-with-most-water': ['height'],
  'median-of-two-sorted-arrays': ['nums1', 'nums2']
};

interface MarkdownCodeBlockProps {
  lang: string;
  code: string;
  theme: string;
}

function MarkdownCodeBlock({ lang, code, theme }: MarkdownCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n').length;
  const calculatedHeight = Math.min(Math.max(lines * 20 + 24, 80), 400);
  const normalizedLang = lang === 'cpp' ? 'cpp' : lang === 'java' ? 'java' : lang === 'py' || lang === 'python3' || lang === 'python' ? 'python' : lang;

  return (
    <div className="my-4 rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden shadow-xl" id="markdown-sc-block">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-900 text-[11px] text-zinc-400 font-mono select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="uppercase tracking-wider font-bold text-zinc-350">{normalizedLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all duration-150 border border-zinc-700/30"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold">Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div style={{ height: `${calculatedHeight}px` }} className="relative overflow-hidden w-full select-text">
        <Editor
          height="100%"
          language={normalizedLang}
          theme={theme}
          value={code}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            folding: true,
            wordWrap: 'on',
            domReadOnly: true,
            automaticLayout: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
            },
            padding: { top: 12, bottom: 12 }
          }}
          loading={
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-2">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default function ProblemDetail() {
  const router = useRouter();
  const {
    selectedProblem,
    selectProblem,
    currentLanguage,
    setLanguage,
    codeDrafts,
    updateDraft,
    customTestcase,
    setCustomTestcase,
    editorTheme,
    setEditorTheme,
    submissions,
    isRunning,
    isSubmitting,
    latestResult,
    activeResultTab,
    activeLeftTab,
    setLeftTab,
    setResultTab,
    runUserCode,
    submitUserCode,
    isDailyChallenge,
    dailyChallengeDate,
  } = useCodeHornStore();

  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<Submission | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  const [localLeftTab, setLocalLeftTab] = useState<string>('description');
  const [openSubTabs, setOpenSubTabs] = useState<Submission[]>([]);
  const [simulationState, setSimulationState] = useState<Record<string, {
    step: number;
    status: 'compiling' | 'samples' | 'hidden' | 'finishing' | 'done';
    submission: Submission | null;
  }>>({});

  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'problem' | 'code'>('problem');

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safety trigger: Reset active selected case index when switching problem
  React.useEffect(() => {
    setActiveCaseIdx(0);
    setOpenSubTabs([]);
    setLocalLeftTab('description');
  }, [selectedProblem?.id]);

  // Keep local left tab in sync with the global store
  React.useEffect(() => {
    if (activeLeftTab === 'description' || activeLeftTab === 'editorial' || activeLeftTab === 'submissions') {
      setLocalLeftTab(activeLeftTab);
    }
  }, [activeLeftTab]);

  if (!selectedProblem) return null;

  const currentCode = codeDrafts[selectedProblem.id]?.[currentLanguage] || '';

  const handleResetDraft = () => {
    if (window.confirm('Reset draft: This will overwrite your current solution with the starter code. Are you sure?')) {
      const initialCode = selectedProblem.starterCode[currentLanguage] || '';
      updateDraft(selectedProblem.id, currentLanguage, initialCode);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleLocalSubmitSolution = async () => {
    if (isRunning || isSubmitting) return;

    // Set store grading/submitting state to disable controls during run
    useCodeHornStore.setState({ isSubmitting: true });

    // Generate unique temp ID for visual representation
    const tempId = `sub_${Math.random().toString(36).substr(2, 5)}`;
    
    // Initial temporary submission representation
    const tempSub: Submission = {
      id: tempId,
      problemId: selectedProblem.id,
      problemTitle: selectedProblem.title,
      problemSlug: selectedProblem.slug,
      language: currentLanguage,
      code: currentCode,
      status: 'Accepted',
      timestamp: new Date().toISOString(),
      runtime: 0,
      memory: 0,
    };

    // Open tab & transition active view
    setOpenSubTabs((prev) => [...prev, tempSub]);
    setLocalLeftTab(`submission-${tempId}`);
    if (isMobile) {
      setMobileTab('problem');
    }

    // Set simulator active steps
    setSimulationState((prev) => ({
      ...prev,
      [tempId]: {
        step: 0,
        status: 'compiling',
        submission: null,
      }
    }));

    // Start timer sequence for realistic compiler updates
    const stepIntervals = [
      { step: 1, delay: 600 },
      { step: 2, delay: 1400 },
      { step: 3, delay: 2300 },
    ];

    stepIntervals.forEach(({ step, delay }) => {
      setTimeout(() => {
        setSimulationState((prev) => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: {
              ...prev[tempId],
              step,
            }
          };
        });
      }, delay);
    });

    try {
      const realSubmission = await CodeHornApiService.submitCode(
        selectedProblem.slug,
        currentLanguage,
        currentCode
      );

      // Save submission to our global state store list
      const updatedSubmissions = [realSubmission, ...submissions];
      useCodeHornStore.setState({
        submissions: updatedSubmissions,
        isSubmitting: false,
        latestResult: {
          status: realSubmission.status,
          runtime: realSubmission.runtime,
          memory: realSubmission.memory,
          errorMessage: realSubmission.compileError,
          passedCount: realSubmission.status === 'Accepted' ? selectedProblem.testcases.length : Math.max(0, selectedProblem.testcases.length - 1),
          totalCount: selectedProblem.testcases.length,
          failedTestCase: realSubmission.failedTestCase,
        }
      });
      localStorage.setItem('codehorn_subs_v1', JSON.stringify(updatedSubmissions));

      // Gamification updates 
      if (realSubmission.status === 'Accepted') {
        const alreadySolved = submissions.some(
          s => s.problemId === selectedProblem.id && s.status === 'Accepted'
        );

        if (!alreadySolved) {
          const pointsAwarded = selectedProblem.difficulty === 'Easy' ? 10 : selectedProblem.difficulty === 'Medium' ? 20 : 30;
          const newXP = useCodeHornStore.getState().xpPoints + pointsAwarded;
          localStorage.setItem('codehorn_xp', String(newXP));
          
          const newStreak = useCodeHornStore.getState().streak + 1;
          localStorage.setItem('codehorn_streak', String(newStreak));

          useCodeHornStore.setState({ xpPoints: newXP, streak: newStreak });
        }
      }

      // Conclude the simulation at 3000ms
      setTimeout(() => {
        setOpenSubTabs((prev) =>
          prev.map((tab) => (tab.id === tempId ? { ...realSubmission, id: tempId } : tab))
        );

        setSimulationState((prev) => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: {
              step: 4,
              status: 'done',
              submission: realSubmission,
            }
          };
        });
      }, 3000);

    } catch (err) {
      console.error(err);
      useCodeHornStore.setState({ isSubmitting: false });
      setTimeout(() => {
        setSimulationState((prev) => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: {
              step: 4,
              status: 'done',
              submission: tempSub,
            }
          };
        });
      }, 3000);
    }
  };

  const renderSubmissionDetails = (sub: Submission) => {
    const sim = simulationState[sub.id];
    const isSimulating = sim && sim.step < 4;

    const sampleTestcases = selectedProblem.testcases.filter(t => t.isSample);
    const hiddenTestcases = selectedProblem.testcases.filter(t => !t.isSample);
    const totalSample = sampleTestcases.length;
    const totalHidden = hiddenTestcases.length;

    // Calculate passed sample & hidden count based on sub status and failedTestCase if failed
    let passedSample = totalSample;
    let passedHidden = totalHidden;
    let totalPassed = selectedProblem.testcases.length;

    if (sub.status !== 'Accepted') {
      if (sub.failedTestCase) {
        // Check if failed test case is one of the samples
        const failedInputClean = sub.failedTestCase.input.replace(/\s+/g, '');
        const failedIdx = selectedProblem.testcases.findIndex(t => t.input.replace(/\s+/g, '') === failedInputClean);
        
        if (failedIdx !== -1) {
          const failedTest = selectedProblem.testcases[failedIdx];
          if (failedTest.isSample) {
            // Failed on a sample testcase
            const idxInSamples = sampleTestcases.findIndex(t => t.id === failedTest.id);
            passedSample = idxInSamples === -1 ? 0 : idxInSamples;
            passedHidden = 0;
            totalPassed = passedSample;
          } else {
            // Failed on a hidden testcase
            passedSample = totalSample; // All samples passed!
            const idxInHidden = hiddenTestcases.findIndex(t => t.id === failedTest.id);
            passedHidden = idxInHidden === -1 ? 0 : idxInHidden;
            totalPassed = passedSample + passedHidden;
          }
        } else {
          // Fallback if failedTestCase does not match any known testcase but we have an error
          passedSample = Math.min(totalSample, Math.floor(totalSample * 0.6));
          passedHidden = 0;
          totalPassed = passedSample;
        }
      } else {
        // Complete failure (eg compile error)
        passedSample = 0;
        passedHidden = 0;
        totalPassed = 0;
      }
    }

    if (isSimulating) {
      // Submitting Simulator Visuals
      return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 flex flex-col space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Outer double loader rings */}
              <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-amber-500 animate-spin" />
              <div className="absolute w-10 h-10 rounded-full border-2 border-dashed border-zinc-700 border-b-emerald-400 animate-spin [animation-direction:reverse]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight uppercase">Simulating Sandbox Evaluation</h3>
              <p className="text-xs text-zinc-500 font-mono">ID: {sub.id}</p>
            </div>
          </div>

          {/* Detailed visual logging list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2">
              <span>SANDBOX COMPILER STREAM</span>
              <span>STATE: ACTIVE</span>
            </div>

            <div className="space-y-2.5 leading-relaxed">
              <div className="flex items-start space-x-2">
                <span className="text-zinc-600">[0.0s]</span>
                <span className="text-zinc-400 font-medium">Initializing container sandbox environment...</span>
              </div>

              {sim.step >= 0 && (
                <div className="flex items-start space-x-2">
                  <span className="text-zinc-600">[0.3s]</span>
                  <span className={`${sim.step === 0 ? 'text-amber-400 animate-pulse font-semibold' : 'text-emerald-400'}`}>
                    {sim.step === 0 ? '⏳ Transpiling source structures...' : '✓ Compilation completed successfully.'}
                  </span>
                </div>
              )}

              {sim.step >= 1 && (
                <div className="flex items-start space-x-2">
                  <span className="text-zinc-600">[0.9s]</span>
                  <span className={`${sim.step === 1 ? 'text-amber-400 animate-pulse font-semibold' : 'text-emerald-400'}`}>
                    {sim.step === 1 ? `⏳ Running sample validation checks (0/${totalSample})...` : `✓ Passed all ${totalSample} sample test suites.`}
                  </span>
                </div>
              )}

              {sim.step >= 2 && (
                <div className="flex items-start space-x-2">
                  <span className="text-zinc-600">[1.7s]</span>
                  <span className={`${sim.step === 2 ? 'text-amber-400 animate-pulse font-semibold' : 'text-emerald-400'}`}>
                    {sim.step === 2 ? `⏳ Verifying hidden and edge test suites (0/${totalHidden})...` : '✓ Completed edge scenarios verification.'}
                  </span>
                </div>
              )}

              {sim.step >= 3 && (
                <div className="flex items-start space-x-2">
                  <span className="text-zinc-600">[2.5s]</span>
                  <span className="text-amber-400 animate-pulse font-semibold">⏳ Compiling telemetry metrics & points...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Finished details view
    const isAccepted = sub.status === 'Accepted';
    const percentPassed = Math.round((totalPassed / (totalSample + totalHidden)) * 100);

    return (
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-zinc-300 text-sm" id={`sub-details-${sub.id}`}>
        
        {/* Header summary & Verdict */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">Submission Report</span>
            <span className="text-[11px] font-mono text-zinc-400">{new Date(sub.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl border ${
              isAccepted 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className={`text-xl font-black tracking-tight ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sub.status}
                </h2>
                {isAccepted && (
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 uppercase font-semibold">
                    <span>👑</span>
                    <span>Solved (+XP)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-medium font-sans">
                {percentPassed}% testcases passed ({totalPassed} / {totalSample + totalHidden})
              </p>
            </div>
          </div>

          {/* Tech Metrics rows */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Runtime Speed</span>
              <span className="text-sm font-bold text-zinc-200 mt-1 block font-mono">{sub.runtime} ms</span>
              <span className="text-[10px] text-zinc-500 block">Beats 82% of users</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Memory Usage</span>
              <span className="text-sm font-bold text-zinc-200 mt-1 block font-mono">{sub.memory} MB</span>
              <span className="text-[10px] text-zinc-500 block">Beats 88% of users</span>
            </div>
          </div>
        </div>

        {/* Testcase Progress breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Execution Breakdown</h3>
          
          <div className="space-y-2.5">
            {/* Sample Case Status bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 block">Sample Test cases</span>
                <span className="text-[10px] text-zinc-500 font-mono">Predefined test suite cases</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  passedSample === totalSample
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/15'
                    : 'text-amber-500 bg-amber-500/10 border border-amber-500/15'
                }`}>
                  {passedSample} / {totalSample} Passed
                </span>
              </div>
            </div>

            {/* Hidden Case Status bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 block">Hidden Scenario cases</span>
                <span className="text-[10px] text-zinc-500 font-mono">Secret evaluator and edge scenarios</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  passedHidden === totalHidden
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/15'
                    : 'text-rose-500 bg-rose-500/10 border border-rose-500/15'
                }`}>
                  {passedHidden} / {totalHidden} Passed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Failed TestCase details section */}
        {!isAccepted && sub.failedTestCase && (() => {
          const paramNames = PARAM_LABELS[selectedProblem.slug] || ['input'];
          const parsedInputs = sub.failedTestCase.input.split('\n');
          return (
            <div className="bg-rose-950/10 border border-rose-950/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-rose-900/15 pb-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-450" />
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">Failed testcase metrics</h4>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Inputs breakdown block */}
                <div className="space-y-3.5">
                  {paramNames.map((name, paramIdx) => {
                    const val = parsedInputs[paramIdx] !== undefined ? parsedInputs[paramIdx] : '';
                    return (
                      <div key={name} className="flex flex-col space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">
                          Input#{paramIdx + 1} ({name})
                        </span>
                        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 text-zinc-300 font-mono overflow-x-auto select-all max-h-32">
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Outputs expected / actual grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-500 block uppercase tracking-wider font-extrabold">Expected Output:</span>
                    <div className="bg-emerald-950/15 border border-emerald-950/25 rounded-lg p-2.5 text-emerald-350 overflow-x-auto select-all font-mono">
                      {sub.failedTestCase.expected}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-rose-550 block uppercase tracking-wider font-extrabold">Actual Output:</span>
                    <div className="bg-rose-950/15 border border-rose-950/25 rounded-lg p-2.5 text-rose-350 overflow-x-auto select-all font-mono font-bold">
                      {sub.failedTestCase.actual}
                    </div>
                  </div>
                </div>

                {/* Stdout Console Logs if any exists */}
                <div className="space-y-1 bg-zinc-950/40 rounded-lg p-3.5 border border-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-550 block uppercase tracking-wider font-extrabold">Stdout (Console Logs)</span>
                  {sub.failedTestCase.stdout ? (
                    <pre className="text-zinc-400 whitespace-pre-wrap overflow-x-auto select-text font-mono leading-relaxed mt-1.5 text-[11px] bg-zinc-950 p-2.5 rounded max-h-40 border border-zinc-900/60 shadow-inner">
                      {sub.failedTestCase.stdout}
                    </pre>
                  ) : (
                    <span className="text-zinc-600 text-[10px] block font-mono italic mt-1 font-medium">No standard output logged.</span>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* Submitted Code snippet with Copy action */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/35">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wide">Submitted Source ({sub.language})</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sub.code);
                alert('Code copied to clipboard.');
              }}
              className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-850 rounded border border-zinc-800 transition-all flex items-center space-x-1 font-semibold"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </button>
          </div>
          <div className="h-[250px] border-t border-zinc-900 overflow-hidden relative">
            <Editor
              height="100%"
              language={sub.language === 'cpp' ? 'cpp' : sub.language === 'java' ? 'java' : sub.language}
              theme={editorTheme}
              value={sub.code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                folding: true,
                wordWrap: 'on',
                domReadOnly: true,
                automaticLayout: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                }
              }}
              loading={
                <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-2">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <span className="text-[10px] text-zinc-550 font-mono">Loading highlighted source...</span>
                </div>
              }
            />
          </div>
        </div>

      </div>
    );
  };

  // Get difficulty badge color rules
  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  // Language display labels
  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'JavaScript (ES6)';
      case 'python': return 'Python 3.10';
      case 'cpp': return 'C++ (Clang 15)';
      case 'java': return 'Java (JDK 17)';
      default: return lang;
    }
  };

  // Render left panel depending on tabs (Description, Editorial, Submissions history)
  const renderLeftPanelContent = () => {
    if (localLeftTab.startsWith('submission-')) {
      const subId = localLeftTab.replace('submission-', '');
      const sub = openSubTabs.find(t => t.id === subId);
      if (sub) {
        return renderSubmissionDetails(sub);
      }
    }

    switch (localLeftTab) {
      case 'editorial':
        return (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-zinc-300 text-sm leading-relaxed" id="detail-left-editorial">
            <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-zinc-100">Official Editorial & Solution</h2>
            </div>
            
            <div className="prose prose-invert max-w-none text-zinc-300 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Complexity Frameworks</h4>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li><strong>Active Approaches:</strong> {selectedProblem.solutionApproaches ? selectedProblem.solutionApproaches.join(', ') : 'Optimal Hash lookup'}</li>
                  <li><strong>Avg Compiles Required:</strong> ~3 executions before green marks</li>
                </ul>
              </div>

              {/* Editorial text formatted section */}
              <div className="leading-relaxed text-zinc-300 antialiased font-sans">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed font-sans">{children}</p>,
                    h1: ({ children }) => <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight mt-6 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-extrabold text-zinc-100 tracking-tight mt-5 mb-2.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-md font-bold text-zinc-200 tracking-tight mt-4 mb-2">{children}</h3>,
                    strong: ({ children }) => <strong className="font-extrabold text-zinc-100">{children}</strong>,
                    em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const rawCode = String(children).replace(/\n$/, '');
                      if (match) {
                        return (
                          <MarkdownCodeBlock 
                            lang={match[1]} 
                            code={rawCode} 
                            theme={editorTheme} 
                          />
                        );
                      }
                      return (
                        <code className="bg-zinc-900 border border-zinc-800/60 text-amber-400 px-1.5 py-0.5 rounded text-[12px] font-mono leading-none font-medium mx-0.5" {...props}>
                          {children}
                        </code>
                      );
                    },
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-zinc-300">{children}</ol>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-300">{children}</ul>,
                    li: ({ children }) => <li className="leading-relaxed mb-1">{children}</li>,
                    pre: ({ children }) => <>{children}</>,
                  }}
                >
                  {selectedProblem.editorial}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );

      case 'submissions':
        const problemSubmissions = submissions.filter((s) => s.problemId === selectedProblem.id);
        return (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-zinc-300 text-sm" id="detail-left-submissions">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-100">Submission History logs</h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Total checks: {problemSubmissions.length}</span>
            </div>

            {problemSubmissions.length > 0 ? (
              <div className="space-y-3">
                {problemSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (!openSubTabs.some(t => t.id === sub.id)) {
                        setOpenSubTabs(prev => [...prev, sub]);
                      }
                      setLocalLeftTab(`submission-${sub.id}`);
                    }}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer transition-all duration-150 flex items-center justify-between group"
                    id={`sub-history-item-${sub.id}`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span className={`font-bold text-sm ${
                          sub.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-400 font-mono capitalize">{sub.language}</span>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {new Date(sub.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right text-xs font-mono space-y-0.5">
                        <div className="text-zinc-300">{sub.runtime} ms</div>
                        <div className="text-zinc-500">{sub.memory} MB</div>
                      </div>
                      <div className="text-zinc-500 group-hover:text-amber-500 text-xs font-semibold">
                        View Code
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 font-medium">
                <HelpCircle className="w-10 h-10 mx-auto text-zinc-700 mb-2 animate-pulse" />
                <p>No submissions found for this problem.</p>
                <p className="text-xs text-zinc-600 mt-1">Submit your code inside the editor sandbox to see records here.</p>
              </div>
            )}
          </div>
        );

      case 'description':
      default:
        return (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6" id="detail-left-description">
            {/* Title & Stats */}
            <div className="space-y-3">
              {isDailyChallenge && dailyChallengeDate && (
                <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-1.5 text-amber-400 max-w-max select-none animate-fade-in">
                  <Trophy className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-black tracking-wider uppercase font-sans">
                    OFFICIAL DAILY CHALLENGE • {new Date(dailyChallengeDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDiffColor(selectedProblem.difficulty)}`}>
                  {selectedProblem.difficulty}
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-zinc-400 text-xs font-medium bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                  {selectedProblem.category}
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-zinc-400 text-xs font-mono">Acceptance: {selectedProblem.acceptanceRate}%</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-zinc-100 tracking-tight">
                {selectedProblem.id}. {selectedProblem.title}
              </h1>
            </div>

            {/* Problem markdown representation */}
            <div className="leading-relaxed text-zinc-300 antialiased font-sans">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed font-sans">{children}</p>,
                  h1: ({ children }) => <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight mt-6 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-extrabold text-zinc-100 tracking-tight mt-5 mb-2.5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-md font-bold text-zinc-200 tracking-tight mt-4 mb-2">{children}</h3>,
                  strong: ({ children }) => <strong className="font-extrabold text-zinc-100">{children}</strong>,
                  em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const rawCode = String(children).replace(/\n$/, '');
                    if (match) {
                      return (
                        <MarkdownCodeBlock 
                          lang={match[1]} 
                          code={rawCode} 
                          theme={editorTheme} 
                        />
                      );
                    }
                    return (
                      <code className="bg-zinc-900 border border-zinc-800/60 text-amber-400 px-1.5 py-0.5 rounded text-[12px] font-mono leading-none font-medium mx-0.5" {...props}>
                        {children}
                      </code>
                    );
                  },
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-zinc-300">{children}</ol>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-300">{children}</ul>,
                  li: ({ children }) => <li className="leading-relaxed mb-1">{children}</li>,
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {selectedProblem.description}
              </ReactMarkdown>
            </div>

            {/* Examples visual layout */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">Examples:</h3>
              {selectedProblem.examples.map((ex) => (
                <div key={ex.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="text-xs font-semibold text-zinc-400">Example {ex.id}:</div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-amber-500/80 font-bold">Input:</span>{' '}
                      <span className="text-zinc-300 select-all">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-emerald-500/85 font-bold">Output:</span>{' '}
                      <span className="text-zinc-300 select-all">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-zinc-400 pt-1.5 border-t border-zinc-800/60 leading-relaxed">
                        <span className="text-zinc-500 italic">Explanation:</span> {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints Block */}
            <div className="space-y-2.5 pt-4 border-t border-zinc-800/60">
              <h3 className="text-sm font-bold text-zinc-200">Constraints:</h3>
              <ul className="space-y-1.5 list-disc pl-5 text-xs text-zinc-400 font-mono">
                {selectedProblem.constraints.map((c, idx) => (
                  <li key={idx}>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hints lists togglers list */}
            <div className="space-y-3 pt-4 border-t border-zinc-800/60">
              <h3 className="text-sm font-bold text-zinc-200">Hints:</h3>
              {selectedProblem.hints.map((hint, index) => (
                <details
                  key={index}
                  className="group bg-zinc-900/30 border border-zinc-800/60 rounded-lg overflow-hidden transition-all duration-150"
                >
                  <summary className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold text-amber-500/90 cursor-pointer select-none hover:bg-zinc-900/40">
                    <span>Hint #{index + 1}</span>
                    <span className="text-zinc-500 group-open:scale-y-[-1] transition-transform duration-100">▼</span>
                  </summary>
                  <p className="px-4 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-2.5 font-sans">
                    {hint}
                  </p>
                </details>
              ))}
            </div>
          </div>
        );
    }
  };

  // Top Section of Left Layout Frame (Problems backlink & general navigation tabs)
  const leftPanel = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 text-zinc-100 min-w-0">
      
      {/* Backlink title row */}
      {!isMobile && (
        <div className="px-4 h-12 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/10 shrink-0 select-none">
          <button
            id="back-to-problems-btn"
            onClick={() => router.push('/')}
            className="flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-150 text-xs font-semibold transition-colors duration-150"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Problem List</span>
          </button>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium">Workspace Sandbox</span>
        </div>
      )}

      {/* Tabs list (Description, Editorial, Submission history, dynamic submission details) */}
      <div className="flex border-b border-zinc-850 shrink-0 bg-zinc-950/45 text-xs font-medium px-4 select-none overflow-x-auto scrollbar-none gap-0.5">
        <button
          id="tab-desc-btn"
          onClick={() => setLocalLeftTab('description')}
          className={`px-3 py-2.5 border-b-2 font-semibold transition-all duration-150 shrink-0 ${
            localLeftTab === 'description' 
              ? 'border-zinc-200 text-zinc-100' 
              : 'border-transparent text-zinc-500 hover:text-zinc-200'
          }`}
        >
          Description
        </button>

        <button
          id="tab-editorial-btn"
          onClick={() => setLocalLeftTab('editorial')}
          className={`px-3 py-2.5 border-b-2 font-semibold transition-all duration-150 shrink-0 ${
            localLeftTab === 'editorial' 
              ? 'border-zinc-200 text-zinc-100' 
              : 'border-transparent text-zinc-500 hover:text-zinc-200'
          }`}
        >
          Editorial
        </button>

        <button
          id="tab-subhistory-btn"
          onClick={() => setLocalLeftTab('submissions')}
          className={`px-3 py-2.5 border-b-2 font-semibold transition-all duration-150 shrink-0 ${
            localLeftTab === 'submissions' 
              ? 'border-zinc-200 text-zinc-100' 
              : 'border-transparent text-zinc-500 hover:text-zinc-200'
          }`}
        >
          Submissions
        </button>

        {openSubTabs.map((sub) => {
          const isSelected = localLeftTab === `submission-${sub.id}`;
          const isSimulating = simulationState[sub.id] && simulationState[sub.id].step < 4;
          return (
            <div
              key={sub.id}
              className={`flex items-center space-x-1.5 py-1.5 px-2.5 border-b-2 transition-all duration-150 shrink-0 ${
                isSelected 
                  ? 'border-zinc-200 text-zinc-100 bg-zinc-900/40' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setLocalLeftTab(`submission-${sub.id}`)}
                className="font-semibold text-xs flex items-center space-x-1 cursor-pointer"
              >
                {isSimulating ? (
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mr-1" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    sub.status === 'Accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                )}
                <span>Sub #{sub.id.replace('sub_', '').substr(0, 4)}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSubTabs(prev => prev.filter(t => t.id !== sub.id));
                  if (isSelected) {
                    setLocalLeftTab('submissions');
                  }
                }}
                className="p-0.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-all cursor-pointer"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Dynamic Body content rendering block */}
      {renderLeftPanelContent()}
    </div>
  );

  // Bottom action bar compiler console results
  const renderRunnerLogs = () => {
    if (isRunning) {
      return (
        <div className="p-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 font-semibold text-xs font-mono animate-pulse">
            Executing tests on CodeHorn servers...
          </p>
        </div>
      );
    }

    if (isSubmitting) {
      return (
        <div className="p-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 font-semibold text-xs font-mono animate-pulse">
            Grading tests against full submission suites...
          </p>
        </div>
      );
    }

    if (!latestResult) {
      return (
        <div className="p-6 text-center text-zinc-500 text-xs font-medium flex flex-col items-center justify-center space-y-1.5 h-full">
          <Terminal className="w-7 h-7 text-zinc-700" />
          <p>Execution console is empty.</p>
          <p className="text-zinc-600">Hit "Run" to test sample inputs; "Submit" to grade all secret parameters.</p>
        </div>
      );
    }

    const { status, runtime, memory, errorMessage, passedCount, totalCount, failedTestCase } = latestResult;

    // Return view base on result status
    const isAccepted = status === 'Accepted';

    return (
      <div className="p-5 space-y-4 text-xs font-mono select-text" id="execution-logs-container">
        
        {/* Banner with status and evaluation title */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isAccepted 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-5 h-5 ${isAccepted ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span className="font-extrabold text-sm uppercase tracking-wider">{status}</span>
            </div>
            <div className="text-zinc-400 text-xs">
              Passed: {passedCount} / {totalCount} testcases evaluated
            </div>
          </div>

          <div className="flex items-center space-x-4 border-l border-zinc-800 pl-4 text-right">
            <div>
              <div className="text-zinc-500 uppercase font-black text-[9px] tracking-wider">Runtime</div>
              <div className="text-zinc-200 text-xs font-bold">{runtime} ms</div>
            </div>
            <div>
              <div className="text-zinc-500 uppercase font-black text-[9px] tracking-wider">Memory</div>
              <div className="text-zinc-200 text-xs font-bold">{memory} MB</div>
            </div>
          </div>
        </div>

        {/* Compile Error display banner */}
        {errorMessage && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="text-xs font-bold text-red-400 flex items-center space-x-1.5 mb-115">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Compilation / Runtime Error output</span>
            </div>
            <pre className="text-zinc-400 whitespace-pre-wrap overflow-x-auto select-text font-mono leading-relaxed mt-2 text-[11px] bg-zinc-950 p-2 rounded">
              {errorMessage}
            </pre>
          </div>
        )}

        {/* Failed TestCase details overlay */}
        {failedTestCase && (() => {
          const paramNames = PARAM_LABELS[selectedProblem.slug] || ['input'];
          const parsedInputs = failedTestCase.input.split('\n');
          return (
            <div className="space-y-4 bg-rose-950/5 border border-rose-950/20 rounded-xl p-4.5 mt-2">
              <div className="text-xs font-black text-rose-405 uppercase tracking-widest flex items-center space-x-1.5 border-b border-rose-900/15 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-450" />
                <span>Failed Test Case Details</span>
              </div>

              <div className="space-y-3.5">
                {/* Inputs breakdown block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paramNames.map((name, paramIdx) => {
                    const val = parsedInputs[paramIdx] !== undefined ? parsedInputs[paramIdx] : '';
                    return (
                      <div key={name} className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3 space-y-1.5 min-w-0">
                        <div className="text-zinc-500 font-bold uppercase text-[10px] font-mono">
                          Input#{paramIdx + 1} ({name}):
                        </div>
                        <pre className="text-zinc-300 font-bold select-all font-mono text-[11px] overflow-x-auto whitespace-pre-wrap" title={val}>
                          {val}
                        </pre>
                      </div>
                    );
                  })}
                </div>

                {/* Expected & Actual Output block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3 space-y-1.5 min-w-0">
                    <div className="text-emerald-500 font-bold uppercase text-[10px] font-mono">Expected Output:</div>
                    <pre className="text-emerald-400 font-extrabold select-all font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {failedTestCase.expected}
                    </pre>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3 space-y-1.5 min-w-0">
                    <div className="text-rose-500 font-bold uppercase text-[10px] font-mono">Actual Output:</div>
                    <pre className="text-rose-400 font-extrabold select-all font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {failedTestCase.actual}
                    </pre>
                  </div>
                </div>

                {/* Stdout block */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3 space-y-1.5">
                  <div className="text-zinc-500 font-bold uppercase text-[10px] font-mono">Stdout (Debugger logs):</div>
                  {failedTestCase.stdout ? (
                    <pre className="text-zinc-400 whitespace-pre-wrap overflow-x-auto select-text font-mono leading-relaxed text-[11px] bg-zinc-950 p-2 rounded max-h-32 border border-zinc-900/60 shadow-inner">
                      {failedTestCase.stdout}
                    </pre>
                  ) : (
                    <div className="text-zinc-600 text-[10px] font-mono italic">No standard output logged.</div>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* Success celebration remarks */}
        {isAccepted && (
          <div className="bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs flex items-center space-x-3 text-zinc-400">
            <Trophy className="w-6 h-6 text-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-zinc-200">First-time accepts award XP.</span> Double check the 
              Editorial module to review memory improvements or trade space constraints for speed!
            </div>
          </div>
        )}

      </div>
    );
  };

  // Right Code Editor Panel Layout including Monaco component & collapsible runs
  const rightPanel = (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-w-0">
      
      {/* Settings bar row inside compilation wrapper */}
      <div className="px-4 h-12 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/10 shrink-0 select-none">
        
        {/* Language selector selection field */}
        <div className="flex items-center space-x-3">
          {!isMobile ? (
            <select
              id="editor-language-select"
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2.5 text-xs font-semibold text-zinc-300 pointer-events-auto cursor-pointer focus:outline-none focus:border-amber-500"
            >
              <option value="javascript">JavaScript (ES6)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (Clang)</option>
              <option value="java">Java (JDK)</option>
            </select>
          ) : (
            <span className="text-[11px] font-mono font-bold text-zinc-400 capitalize bg-zinc-900/50 px-2.5 py-1 rounded border border-zinc-800">
              {getLanguageLabel(currentLanguage)}
            </span>
          )}
        </div>

        {/* Editing and settings widgets */}
        <div className="flex items-center space-x-2">
          
          {/* Editor Theme Dropdown */}
          <select
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-semibold text-zinc-400 focus:outline-none cursor-pointer hover:border-zinc-700 transition"
            title="Monaco Editor Theme"
          >
            <option value="vs-dark">Editor Theme: Dark</option>
            <option value="hc-black">Editor Theme: Contrast</option>
            <option value="light">Editor Theme: Light</option>
          </select>
          
          <div className="h-4 w-px bg-zinc-805" />

          {/* Copy draft btn */}
          <button
            onClick={handleCopyCode}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-all shadow-sm"
            title="Copy Code"
          >
            {copiedDraft ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Reset draft btn */}
          <button
            onClick={handleResetDraft}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-all shadow-sm"
            title="Reset Code Draft"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Editor Space and Bottom Console (Split vert) */}
      <div className="flex-1 min-h-0 relative">
        {!consoleExpanded ? (
          <div className="absolute inset-0 flex flex-col bg-zinc-950">
            <Editor
              height="100%"
              language={currentLanguage === 'cpp' ? 'cpp' : currentLanguage === 'java' ? 'java' : currentLanguage}
              theme={editorTheme}
              value={currentCode}
              onChange={(value) => updateDraft(selectedProblem.id, currentLanguage, value || '')}
              loading={
                <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono">Initializing Monaco...</span>
                </div>
              }
              options={{
                fontSize: isMobile ? 12 : 14,
                fontFamily: 'Fira Code, JetBrains Mono, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                tabSize: 4,
                cursorBlinking: 'smooth',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                }
              }}
            />
            {/* Minimal button bar when console is fully collapsed */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-10 px-2.5 py-1.5 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl shadow-lg select-none">
              <button
                onClick={() => {
                  setConsoleExpanded(true);
                }}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 hover:border-zinc-700 border border-transparent"
                title="Restore code runners"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                <span>Show Console</span>
              </button>
              
              <button
                onClick={() => {
                  setConsoleExpanded(true);
                  runUserCode();
                }}
                disabled={isRunning || isSubmitting}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-555 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Run</span>
              </button>
            </div>
          </div>
        ) : (
          <ResizablePanel
            direction="vertical"
            initialSplit={isMobile ? 55 : 65}
            minSize={30}
            maxSize={85}
            idPrefix="editor-console-split"
          leftElement={
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                language={currentLanguage === 'cpp' ? 'cpp' : currentLanguage === 'java' ? 'java' : currentLanguage}
                theme={editorTheme}
                value={currentCode}
                onChange={(value) => updateDraft(selectedProblem.id, currentLanguage, value || '')}
                loading={
                  <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    <span className="text-xs text-zinc-500 font-mono">Initializing Monaco dependencies...</span>
                  </div>
                }
                options={{
                  fontSize: 14,
                  fontFamily: 'Fira Code, JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  tabSize: 4,
                  cursorBlinking: 'smooth',
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'all',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  }
                }}
              />
            </div>
          }
          rightElement={
            <div className="flex-1 flex flex-col bg-zinc-950 min-h-0">
              
              {/* Console Tabs segment Header */}
              <div className="h-10 bg-zinc-900 border-y border-zinc-850 px-4 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center space-x-1">
                  
                  <button
                    onClick={() => setResultTab('testcase')}
                    title="Test Cases"
                    className={`h-8 w-8 sm:h-auto sm:w-auto px-0 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center sm:space-x-1.5 shrink-0 transition-all ${
                      activeResultTab === 'testcase'
                        ? 'bg-zinc-800 text-amber-500'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Terminal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Test Cases</span>
                  </button>

                  <button
                    onClick={() => setResultTab('result')}
                    title="Run Results"
                    className={`h-8 w-8 sm:h-auto sm:w-auto px-0 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center sm:space-x-1.5 shrink-0 transition-all ${
                      activeResultTab === 'result'
                        ? 'bg-zinc-800 text-amber-500'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Run Results</span>
                  </button>

                </div>

                <div className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Sandbox Runner Status</span>
                </div>
              </div>

              {/* Console content body */}
              <div className="flex-1 overflow-y-auto custom-minimal-scrollbar min-h-0 bg-zinc-950">
                {activeResultTab === 'testcase' ? (() => {
                  const paramNames = PARAM_LABELS[selectedProblem.slug] || ['input'];
                  const sampleCasesCount = selectedProblem.testcases.filter(t => t.isSample).length;
                  const parsedCases = customTestcase ? customTestcase.split('\n---\n').map(c => {
                    const lines = c.split('\n');
                    return paramNames.map((_, idx) => lines[idx] || '');
                  }) : [paramNames.map(() => '')];

                  // Guard active index bounds
                  const currentActiveIdx = activeCaseIdx >= parsedCases.length ? Math.max(0, parsedCases.length - 1) : activeCaseIdx;

                  const handleUpdateCaseValue = (caseIdx: number, paramIdx: number, value: string) => {
                    const updated = parsedCases.map((c, cIdx) => {
                      if (cIdx === caseIdx) {
                        return c.map((v, pIdx) => pIdx === paramIdx ? value : v);
                      }
                      return c;
                    });
                    const joined = updated.map(c => c.join('\n')).join('\n---\n');
                    setCustomTestcase(joined);
                  };

                  const handleAddTestCase = () => {
                    if (parsedCases.length >= 8) return;
                    let defaultValues = paramNames.map(() => '');
                    if (selectedProblem.slug === 'two-sum') {
                      defaultValues = ['[1,2,3]', '5'];
                    } else if (selectedProblem.slug === 'valid-parentheses') {
                      defaultValues = ['"()"'];
                    } else if (selectedProblem.slug === 'longest-substring-without-repeating-characters') {
                      defaultValues = ['"(abc)"'];
                    } else if (selectedProblem.slug === 'container-with-most-water') {
                      defaultValues = ['[1,2,1]'];
                    } else if (selectedProblem.slug === 'median-of-two-sorted-arrays') {
                      defaultValues = ['[1,2]', '[3,4]'];
                    }
                    const updated = [...parsedCases, defaultValues];
                    const joined = updated.map(c => c.join('\n')).join('\n---\n');
                    setCustomTestcase(joined);
                    setActiveCaseIdx(updated.length - 1);
                  };

                  const handleDeleteTestCase = (idx: number, e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (parsedCases.length <= 1) return;
                    const updated = parsedCases.filter((_, cIdx) => cIdx !== idx);
                    const joined = updated.map(c => c.join('\n')).join('\n---\n');
                    setCustomTestcase(joined);
                    if (currentActiveIdx >= updated.length) {
                      setActiveCaseIdx(updated.length - 1);
                    }
                  };

                  return (
                    <div className="p-4 space-y-4 font-sans">
                      {/* Header metadata layout */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Dynamic Testcase Editor ({parsedCases.length}/8)</span>
                        <span className="text-zinc-650 text-[10px] italic">Edit specific variables dynamically</span>
                      </div>

                      {/* Case selector tabs */}
                      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-900/60 pb-2.5 select-none">
                        {parsedCases.map((_, idx) => {
                          const isSample = idx < sampleCasesCount;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveCaseIdx(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
                                currentActiveIdx === idx
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-150 shadow-sm'
                                  : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                              }`}
                            >
                              <span>Case {idx + 1}</span>
                              {!isSample && parsedCases.length > 1 && (
                                <span
                                  onClick={(e) => handleDeleteTestCase(idx, e)}
                                  className="text-zinc-600 hover:text-rose-450 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Remove custom case"
                                >
                                  <X className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {parsedCases.length < 8 && (
                          <button
                            key="add-case-btn"
                            type="button"
                            onClick={handleAddTestCase}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-950 border border-dashed border-zinc-850 hover:border-zinc-800 text-zinc-550 hover:text-zinc-350 transition-all flex items-center space-x-1 cursor-pointer"
                            title="Add new test case"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Case</span>
                          </button>
                        )}
                      </div>

                      {/* Param Fields for Active Case */}
                      <div className="space-y-3.5">
                        {paramNames.map((name, paramIdx) => {
                          const val = parsedCases[currentActiveIdx]?.[paramIdx] || '';
                          const isCurrentSample = currentActiveIdx < sampleCasesCount;
                          return (
                            <div key={name} className="flex flex-col space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center space-x-1">
                                  <span className="text-zinc-600">Input#{paramIdx + 1}:</span>
                                  <span className="text-zinc-300">{name}</span>
                                </label>
                                {isCurrentSample && (
                                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800/80">
                                    Predefined Sample
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={val}
                                readOnly={isCurrentSample}
                                disabled={isCurrentSample}
                                onChange={(e) => handleUpdateCaseValue(currentActiveIdx, paramIdx, e.target.value)}
                                placeholder={`e.g. valid structure mapping for ${name}`}
                                className={`w-full font-mono text-xs focus:outline-none transition-all rounded-lg px-3 py-2 border ${
                                  isCurrentSample
                                    ? 'bg-zinc-950/60 text-zinc-400 border-zinc-900 cursor-not-allowed'
                                    : 'bg-zinc-900/90 text-zinc-200 border-zinc-850 focus:border-zinc-705 focus:ring-0 placeholder-zinc-700'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-zinc-550 font-sans border-t border-zinc-900/50 pt-2 flex items-center space-x-1">
                        <span className="text-amber-500/80">💡</span>
                        <span>Format follows JSON rules. Lists like `[2,7,11]` should have brackets; strings like `"()"` require quotes.</span>
                      </div>
                    </div>
                  );
                })() : (
                  renderRunnerLogs()
                )}
              </div>

              {/* Bottom compiler actions bar */}
              <div className="h-12 bg-zinc-950 px-4 border-t border-zinc-850 flex items-center justify-between shrink-0 select-none">
                <span className="text-[9px] font-mono text-zinc-650 font-bold uppercase tracking-wider">
                  CodeHorn System Sandbox v1.0
                </span>

                <div className="flex items-center space-x-2">
                          {/* Console expand compiler switch */}
                  <button
                    onClick={() => {
                      setConsoleExpanded(!consoleExpanded);
                    }}
                    title={consoleExpanded ? "Hide Console Pane" : "Show Console Pane"}
                    className={`h-10 w-10 sm:h-auto sm:w-auto px-0 sm:px-3 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center sm:space-x-1.5 shrink-0 border ${
                      consoleExpanded 
                        ? 'bg-zinc-800 text-amber-500 border-zinc-700 hover:bg-zinc-750' 
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 border-zinc-805'
                    }`}
                    id="console-tab-switcher"
                  >
                    <Terminal className="w-4.5 h-4.5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{consoleExpanded ? "Hide Console" : "Console view"}</span>
                  </button>

                  {/* Run Code Compiler */}
                  <button
                    id="codehorn-run-btn"
                    onClick={() => {
                      setConsoleExpanded(true);
                      runUserCode();
                    }}
                    disabled={isRunning || isSubmitting}
                    title="Run tests"
                    className="h-10 w-10 sm:h-auto sm:w-auto px-0 sm:px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-550 text-white border border-transparent rounded-lg font-medium transition-all flex items-center justify-center sm:space-x-1.5 shadow-sm hover:shadow-indigo-600/10 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isRunning ? (
                      <div className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-3 sm:h-3 text-white fill-white" />
                    )}
                    <span className="hidden sm:inline">Run tests</span>
                  </button>

                  {/* Submit solution and awards */}
                  <button
                    id="codehorn-submit-btn"
                    onClick={handleLocalSubmitSolution}
                    disabled={isRunning || isSubmitting}
                    title="Submit Solution"
                    className="h-10 w-10 sm:h-auto sm:w-auto px-0 sm:px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-555 text-white border border-transparent rounded-lg font-semibold transition-all flex items-center justify-center sm:space-x-1.5 shadow-sm hover:shadow-emerald-600/10 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle className="w-4.5 h-4.5 sm:w-3.5 sm:h-3.5 text-white" />
                    )}
                    <span className="hidden sm:inline">Submit Solution</span>
                  </button>

                </div>
              </div>

            </div>
          }
        />
        )}
      </div>

      {/* Code submitted overlays modal */}
      {selectedSubmissionCode && (
        <div 
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 select-text"
          id="code-submission-overlay"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-100">Historical solution run code</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Submitted status: {selectedSubmissionCode.status} • {selectedSubmissionCode.runtime}ms</p>
              </div>
              <button
                onClick={() => setSelectedSubmissionCode(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-black bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-850"
              >
                Close View
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto bg-zinc-950/80 p-5">
              <pre className="text-xs font-mono text-amber-500/90 whitespace-pre scroll-all leading-relaxed bg-zinc-950 p-4 border border-zinc-850 rounded-xl select-all">
                {selectedSubmissionCode.code}
              </pre>
            </div>

            {/* Copy button */}
            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedSubmissionCode.code);
                  alert('Submission code copied to clipboard successfully!');
                }}
                className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-all"
              >
                Copy solutions code
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden" id="workspace-splits-panel-mobile">
        
        {/* Unified Mobile Adaptive Tabs Controller Header */}
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none w-full shadow-sm">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 text-xs font-semibold bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Sliding pills layout bar */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center space-x-0.5 select-none shrink-0 shadow-inner">
            <button
              onClick={() => setMobileTab('problem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === 'problem'
                  ? 'bg-zinc-850 text-amber-500 shadow-sm border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setMobileTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === 'code'
                  ? 'bg-zinc-850 text-amber-500 shadow-sm border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              Code Editor
            </button>
          </div>

          <div className="flex items-center shrink-0">
            {mobileTab === 'code' ? (
              <select
                id="editor-language-select-mobile"
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2.5 text-xs font-bold text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="javascript">JS</option>
                <option value="python">PY</option>
                <option value="cpp">C++</option>
                <option value="java">JAVA</option>
              </select>
            ) : (
              <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-tight border ${getDiffColor(selectedProblem.difficulty)}`}>
                {selectedProblem.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Swipeable or standard full panel viewport area */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 flex flex-col">
            {mobileTab === 'problem' ? leftPanel : rightPanel}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-zinc-950 overflow-hidden" id="workspace-splits-panel">
      <ResizablePanel
        direction="horizontal"
        initialSplit={40}
        minSize={25}
        maxSize={75}
        idPrefix="workspace-split"
        leftElement={leftPanel}
        rightElement={rightPanel}
      />
    </div>
  );
}
