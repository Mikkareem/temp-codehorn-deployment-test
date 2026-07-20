import { create } from 'zustand';
import { Problem, Difficulty, ProblemStatus, Submission, ExecutionResult, TestCase } from '../types';
import { CodeHornApiService } from '../services/api';

interface FilterState {
  difficulty: 'All' | Difficulty;
  status: 'All' | ProblemStatus;
  search: string;
  category: string;
}

interface CodeHornState {
  // Domain Core Data
  problems: Problem[];
  selectedProblem: Problem | null;
  currentView: 'list' | 'detail' | 'playground';
  loading: boolean;

  // Editor Settings
  currentLanguage: 'javascript' | 'python' | 'cpp' | 'java';
  codeDrafts: Record<string, Record<string, string>>; // { problemId: { language: code } }
  customTestcase: string;
  editorTheme: 'vs-dark' | 'hc-black' | 'light';
  globalTheme: 'dark' | 'light';

  // Filters State
  filters: FilterState;

  // Execution & Submissions
  submissions: Submission[];
  isRunning: boolean;
  isSubmitting: boolean;
  latestResult: ExecutionResult | null;
  activeResultTab: 'testcase' | 'result';
  activeLeftTab: 'description' | 'editorial' | 'submissions';

  // Gamification & Progress
  streak: number;
  xpPoints: number;

  // Daily Challenge State
  isDailyChallenge: boolean;
  dailyChallengeDate: string | null;

  // Actions
  fetchProblems: () => Promise<void>;
  selectProblem: (problem: Problem | null) => void;
  selectDailyChallenge: (problem: Problem, dateStr: string) => void;
  setView: (view: 'list' | 'detail' | 'playground') => void;
  setLanguage: (lang: 'javascript' | 'python' | 'cpp' | 'java') => void;
  updateDraft: (problemId: string, language: string, code: string) => void;
  setCustomTestcase: (text: string) => void;
  setEditorTheme: (theme: 'vs-dark' | 'hc-black' | 'light') => void;
  setGlobalTheme: (theme: 'dark' | 'light') => void;
  
  // Filtering Actions
  setFilterDifficulty: (difficulty: 'All' | Difficulty) => void;
  setFilterStatus: (status: 'All' | ProblemStatus) => void;
  setFilterSearch: (search: string) => void;
  setFilterCategory: (category: string) => void;
  resetFilters: () => void;

  // Execution Actions
  runUserCode: () => Promise<void>;
  submitUserCode: () => Promise<void>;
  clearResult: () => void;
  setLeftTab: (tab: 'description' | 'editorial' | 'submissions') => void;
  setResultTab: (tab: 'testcase' | 'result') => void;
  
  // Helper Actions
  getProblemStatus: (problemId: string) => ProblemStatus;
  getSolvedCount: () => { easy: number; medium: number; hard: number; total: number };
}

// Initial Code Draft Template Helper
const getInitialCodeDrafts = () => {
  try {
    if (typeof window !== 'undefined') {
      const drafts = localStorage.getItem('codehorn_drafts_v1');
      return drafts ? JSON.parse(drafts) : {};
    }
  } catch {
    // Fallback
  }
  return {};
};

const getInitialSubmissions = () => {
  try {
    if (typeof window !== 'undefined') {
      const subs = localStorage.getItem('codehorn_subs_v1');
      return subs ? JSON.parse(subs) : [];
    }
  } catch {
    // Fallback
  }
  return [];
};

const getSafeLocalStorageItem = (key: string, defaultValue: string): string => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || defaultValue;
    }
  } catch {
    // Fallback
  }
  return defaultValue;
};

export const useCodeHornStore = create<CodeHornState>((set, get) => ({
  problems: [],
  selectedProblem: null,
  currentView: 'list',
  loading: false,

  isDailyChallenge: false,
  dailyChallengeDate: null,

  currentLanguage: 'javascript',
  codeDrafts: getInitialCodeDrafts(),
  customTestcase: '',
  editorTheme: 'vs-dark',
  globalTheme: (getSafeLocalStorageItem('codehorn_global_theme', 'dark') as 'dark' | 'light'),

  filters: {
    difficulty: 'All',
    status: 'All',
    search: '',
    category: 'All',
  },

  submissions: getInitialSubmissions(),
  isRunning: false,
  isSubmitting: false,
  latestResult: null,
  activeResultTab: 'testcase',
  activeLeftTab: 'description',

  streak: Number(getSafeLocalStorageItem('codehorn_streak', '3')),
  xpPoints: Number(getSafeLocalStorageItem('codehorn_xp', '240')),

  fetchProblems: async () => {
    set({ loading: true });
    const problems = await CodeHornApiService.getProblems();
    set({ problems, loading: false });
  },

  selectProblem: (problem) => {
    if (problem) {
      // Load or set starter code as initial draft if none exists
      const drafts = get().codeDrafts;
      const lang = get().currentLanguage;
      
      const updatedDrafts = { ...drafts };
      if (!updatedDrafts[problem.id]) {
        updatedDrafts[problem.id] = { ...problem.starterCode };
      } else {
        // Ensure all languages have their starter codes filled if missed
        updatedDrafts[problem.id] = {
          ...problem.starterCode,
          ...updatedDrafts[problem.id]
        };
      }

      // Pre-populate custom testcases with the first sample testcase of the problem
      const sampleInput = problem.testcases.filter(t => t.isSample).map(t => t.input).join('\n---\n') || '';

      set({
        selectedProblem: problem,
        isDailyChallenge: false,
        dailyChallengeDate: null,
        codeDrafts: updatedDrafts,
        customTestcase: sampleInput,
        latestResult: null,
        activeResultTab: 'testcase',
        activeLeftTab: 'description',
        currentView: 'detail',
      });
      localStorage.setItem('codehorn_drafts_v1', JSON.stringify(updatedDrafts));
    } else {
      set({ selectedProblem: null, currentView: 'list', isDailyChallenge: false, dailyChallengeDate: null });
    }
  },

  selectDailyChallenge: (problem, dateStr) => {
    if (problem) {
      const drafts = get().codeDrafts;
      const updatedDrafts = { ...drafts };
      if (!updatedDrafts[problem.id]) {
        updatedDrafts[problem.id] = { ...problem.starterCode };
      } else {
        updatedDrafts[problem.id] = {
          ...problem.starterCode,
          ...updatedDrafts[problem.id]
        };
      }

      const sampleInput = problem.testcases.filter(t => t.isSample).map(t => t.input).join('\n---\n') || '';

      set({
        selectedProblem: problem,
        isDailyChallenge: true,
        dailyChallengeDate: dateStr,
        codeDrafts: updatedDrafts,
        customTestcase: sampleInput,
        latestResult: null,
        activeResultTab: 'testcase',
        activeLeftTab: 'description',
        currentView: 'detail',
      });
      localStorage.setItem('codehorn_drafts_v1', JSON.stringify(updatedDrafts));
    }
  },

  setView: (view) => set({ currentView: view }),

  setLanguage: (lang) => set({ currentLanguage: lang }),

  updateDraft: (problemId, language, code) => {
    const drafts = get().codeDrafts;
    const updated = {
      ...drafts,
      [problemId]: {
        ...(drafts[problemId] || {}),
        [language]: code,
      },
    };
    set({ codeDrafts: updated });
    localStorage.setItem('codehorn_drafts_v1', JSON.stringify(updated));
  },

  setCustomTestcase: (text) => set({ customTestcase: text }),

  setEditorTheme: (theme) => set({ editorTheme: theme }),

  setGlobalTheme: (theme) => {
    set({ globalTheme: theme });
    localStorage.setItem('codehorn_global_theme', theme);
  },

  setFilterDifficulty: (difficulty) => 
    set((state) => ({ filters: { ...state.filters, difficulty } })),

  setFilterStatus: (status) => 
    set((state) => ({ filters: { ...state.filters, status } })),

  setFilterSearch: (search) => 
    set((state) => ({ filters: { ...state.filters, search } })),

  setFilterCategory: (category) => 
    set((state) => ({ filters: { ...state.filters, category } })),

  resetFilters: () => 
    set((state) => ({
      filters: {
        difficulty: 'All',
        status: 'All',
        search: '',
        category: 'All',
      }
    })),

  runUserCode: async () => {
    const { selectedProblem, currentLanguage, codeDrafts, customTestcase } = get();
    if (!selectedProblem) return;

    set({ isRunning: true, activeResultTab: 'result' });

    const code = codeDrafts[selectedProblem.id]?.[currentLanguage] || '';
    
    const result = await CodeHornApiService.runCode(
      selectedProblem.slug,
      currentLanguage,
      code,
      customTestcase
    );

    set({ latestResult: result, isRunning: false });
  },

  submitUserCode: async () => {
    const { selectedProblem, currentLanguage, codeDrafts } = get();
    if (!selectedProblem) return;

    set({ isSubmitting: true, activeResultTab: 'result' });

    const code = codeDrafts[selectedProblem.id]?.[currentLanguage] || '';

    const submission = await CodeHornApiService.submitCode(
      selectedProblem.slug,
      currentLanguage,
      code
    );

    // Save submission to state log
    const updatedSubmissions = [submission, ...get().submissions];
    set({ submissions: updatedSubmissions, isSubmitting: false, latestResult: {
      status: submission.status,
      runtime: submission.runtime,
      memory: submission.memory,
      errorMessage: submission.compileError,
      passedCount: submission.status === 'Accepted' ? selectedProblem.testcases.length : Math.max(0, selectedProblem.testcases.length - 1),
      totalCount: selectedProblem.testcases.length,
      failedTestCase: submission.failedTestCase,
    }});

    localStorage.setItem('codehorn_subs_v1', JSON.stringify(updatedSubmissions));

    // Gamification Points Upgrade
    if (submission.status === 'Accepted') {
      const alreadySolved = get().submissions.some(
        s => s.problemId === selectedProblem.id && s.status === 'Accepted' && s.id !== submission.id
      );

      if (!alreadySolved) {
        // First-time solve award!
        const pointsAwarded = selectedProblem.difficulty === 'Easy' ? 10 : selectedProblem.difficulty === 'Medium' ? 20 : 30;
        const newXP = get().xpPoints + pointsAwarded;
        localStorage.setItem('codehorn_xp', String(newXP));
        
        // Randomly bump streak for realism
        const newStreak = get().streak + 1;
        localStorage.setItem('codehorn_streak', String(newStreak));

        set({ xpPoints: newXP, streak: newStreak });
      }
    }
  },

  clearResult: () => set({ latestResult: null }),

  setLeftTab: (tab) => set({ activeLeftTab: tab }),

  setResultTab: (tab) => set({ activeResultTab: tab }),

  getProblemStatus: (problemId) => {
    const userSubs = get().submissions.filter(s => s.problemId === problemId);
    if (userSubs.length === 0) return 'Todo';
    const hasAccepted = userSubs.some(s => s.status === 'Accepted');
    return hasAccepted ? 'Solved' : 'Attempted';
  },

  getSolvedCount: () => {
    const allSolvedIds = Array.from(
      new Set(
        get().submissions
          .filter(s => s.status === 'Accepted')
          .map(s => s.problemId)
      )
    );

    const easy = get().problems.filter(p => p.difficulty === 'Easy' && allSolvedIds.includes(p.id)).length;
    const medium = get().problems.filter(p => p.difficulty === 'Medium' && allSolvedIds.includes(p.id)).length;
    const hard = get().problems.filter(p => p.difficulty === 'Hard' && allSolvedIds.includes(p.id)).length;

    return {
      easy,
      medium,
      hard,
      total: easy + medium + hard,
    };
  }
}));
