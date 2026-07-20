'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCodeHornStore } from '../store/useCodeHornStore';
import { Problem, Difficulty, ProblemStatus } from '../types';
import { 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Trophy,
  Play,
  Code 
} from 'lucide-react';

export default function ProblemList() {
  const router = useRouter();
  const {
    problems,
    filters,
    setFilterSearch,
    setFilterDifficulty,
    setFilterStatus,
    setFilterCategory,
    resetFilters,
    selectProblem,
    getProblemStatus,
    getSolvedCount,
    submissions,
    selectDailyChallenge,
  } = useCodeHornStore();

  const solvedStats = getSolvedCount();
  const totalCount = problems.length;

  const totalEasy = problems.filter(p => p.difficulty === 'Easy').length;
  const totalMedium = problems.filter(p => p.difficulty === 'Medium').length;
  const totalHard = problems.filter(p => p.difficulty === 'Hard').length;

  // Derive unique categories/tags for list filters
  const categories = ['All', 'Arrays', 'Stack', 'Sliding Window', 'Two Pointers', 'Binary Search'];

  // Calendar states & navigation
  const [calendarDate, setCalendarDate] = React.useState(() => new Date());
  const [selectedDayObj, setSelectedDayObj] = React.useState<Date>(() => new Date());

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const today = new Date();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleTodayMonth = () => {
    const d = new Date();
    setCalendarDate(d);
    setSelectedDayObj(d);
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Grid calculations
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
  const prevDays = Array.from({ length: firstDayIndex }, (_, i) => {
    const d = prevMonthTotalDays - firstDayIndex + 1 + i;
    return {
      day: d,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, d),
    };
  });

  const currentDays = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = i + 1;
    return {
      day: d,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, d),
    };
  });

  const totalCells = prevDays.length + currentDays.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextDays = Array.from({ length: remainingCells }, (_, i) => {
    const d = i + 1;
    return {
      day: d,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, d),
    };
  });

  const allCalendarDays = [...prevDays, ...currentDays, ...nextDays];

  // Map to deterministic problem ID
  const getDailyChallengeForDate = (date: Date) => {
    if (!problems || problems.length === 0) return null;
    const index = (date.getFullYear() * 31 + date.getMonth() * 7 + date.getDate() * 13) % problems.length;
    return problems[index];
  };

  const getDayStatus = (date: Date): 'Completed' | 'Partial' | 'Attempted' | 'Todo' => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const p = getDailyChallengeForDate(date);
    if (!p) return 'Todo';

    const daySubs = submissions.filter(s => {
      if (s.problemId !== p.id) return false;
      const subDate = new Date(s.timestamp);
      const sDateStr = `${subDate.getFullYear()}-${String(subDate.getMonth() + 1).padStart(2, '0')}-${String(subDate.getDate()).padStart(2, '0')}`;
      return sDateStr === dStr;
    });

    if (daySubs.length === 0) return 'Todo';
    
    const hasAccepted = daySubs.some(s => s.status === 'Accepted');
    if (hasAccepted) return 'Completed';

    const hasWrongAnswer = daySubs.some(s => s.status === 'Wrong Answer');
    if (hasWrongAnswer) return 'Partial';

    return 'Attempted';
  };

  const handleDayClick = (dayDate: Date) => {
    const targetProblem = getDailyChallengeForDate(dayDate);
    if (targetProblem) {
      const dStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      selectDailyChallenge(targetProblem, dStr);
      router.push(`/problems/${targetProblem.slug}?daily=${dStr}`);
    }
  };

  const selectedChallengeProblem = getDailyChallengeForDate(selectedDayObj);
  const selectedDayStatus = getDayStatus(selectedDayObj);

  // Apply search/difficulty/status/category filtering logic
  const filteredProblems = problems.filter((problem) => {
    // 1. Search Query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchTitle = problem.title.toLowerCase().includes(query);
      const matchDesc = problem.description.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }

    // 2. Difficulty
    if (filters.difficulty !== 'All' && problem.difficulty !== filters.difficulty) {
      return false;
    }

    // 3. Status
    if (filters.status !== 'All') {
      const status = getProblemStatus(problem.id);
      if (filters.status !== status) return false;
    }

    // 4. Category
    if (filters.category !== 'All') {
      const lowerCat = problem.category.toLowerCase();
      const lowerFilter = filters.category.toLowerCase();
      if (!lowerCat.includes(lowerFilter)) return false;
    }

    return true;
  });

  // Difficulty badge render helper
  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Hard
          </span>
        );
    }
  };

  // Completion status icon render helper
  const getStatusIcon = (id: string) => {
    const status = getProblemStatus(id);
    switch (status) {
      case 'Solved':
        return (
          <span title="Solved">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
          </span>
        );
      case 'Attempted':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" title="In Progress" />
        );
      case 'Todo':
        return (
          <span title="Unattempted">
            <HelpCircle className="w-5 h-5 text-zinc-600" />
          </span>
        );
    }
  };

  // Quick stats calculations for visual cards
  const activePercent = totalCount > 0 ? Math.round((solvedStats.total / totalCount) * 100) : 0;

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 flex flex-col px-4 md:px-6 py-5 md:py-6" id="problem-listing-panel">
      
      {/* Dynamic Bento Style Hero Statistics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        
        {/* Progress Tracker Meter */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 lg:p-4.5 flex flex-col justify-between shadow-sm col-span-2 lg:col-span-1">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold block mb-0.5">Your Total Progress</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl lg:text-2xl font-bold text-zinc-100">{solvedStats.total}</span>
              <span className="text-zinc-500 text-xs">/ {totalCount} Solved</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">
              <span>Completion Rate</span>
              <span className="text-zinc-300">{activePercent}%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-850">
              <div 
                className="bg-zinc-300 h-full rounded-full transition-all duration-500" 
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Easy Cards stats */}
        <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-xl p-3.5 lg:p-4.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Easy Progress</span>
            <span className="text-lg lg:text-xl font-bold text-zinc-100">{solvedStats.easy}<span className="text-zinc-500 text-xs font-normal font-mono">/{totalEasy}</span></span>
            <span className="text-zinc-500 text-[9px] block mt-0.5">Acceptance ~ 50%</span>
          </div>
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-emerald-900/50 bg-emerald-950/40 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 ml-1">
            E
          </div>
        </div>

        {/* Medium Cards stats */}
        <div className="bg-amber-950/15 border border-amber-900/30 rounded-xl p-3.5 lg:p-4.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Medium Progress</span>
            <span className="text-lg lg:text-xl font-bold text-zinc-100">{solvedStats.medium}<span className="text-zinc-500 text-xs font-normal font-mono">/{totalMedium}</span></span>
            <span className="text-zinc-500 text-[9px] block mt-0.5">Acceptance ~ 35%</span>
          </div>
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-amber-900/50 bg-amber-950/40 flex items-center justify-center font-bold text-amber-500 text-xs shrink-0 ml-1">
            M
          </div>
        </div>

        {/* Hard Cards stats */}
        <div className="bg-rose-950/15 border border-rose-900/30 rounded-xl p-3.5 lg:p-4.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-rose-400/80 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Hard Progress</span>
            <span className="text-lg lg:text-xl font-bold text-zinc-100">{solvedStats.hard}<span className="text-zinc-500 text-xs font-normal font-mono">/{totalHard}</span></span>
            <span className="text-zinc-500 text-[9px] block mt-0.5">Acceptance ~ 20%</span>
          </div>
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-rose-900/50 bg-rose-950/40 flex items-center justify-center font-bold text-rose-500 text-xs shrink-0 ml-1">
            H
          </div>
        </div>

      </div>

      {/* Daily Coding Challenge Hub */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 lg:p-5 mb-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-5 border-b border-zinc-800/65 pb-3 font-sans">
          <Trophy className="w-5 h-5 text-amber-550 animate-pulse" />
          <div>
            <h2 className="text-sm lg:text-base font-extrabold tracking-tight text-zinc-100 font-sans">Daily Challenge Hub</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5 font-sans">Solve a challenge every day to build consistency & track history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
          
          {/* Calendar Grid Section: spans 3 columns on desktops */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              {/* Calendar header controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-zinc-350 flex items-center space-x-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850 self-start select-none font-sans">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Selected: {selectedDayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </span>

                <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-lg p-0.5 space-x-1 select-none">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-zinc-300 px-2 min-w-28 text-center select-none font-mono">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <button 
                    onClick={handleNextMonth} 
                    className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleTodayMonth}
                    className="text-[10px] px-2 py-1 hover:bg-zinc-900 text-amber-500 font-bold rounded transition tracking-tight cursor-pointer font-sans"
                    title="Jump to Today"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Day of week labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase select-none tracking-widest border-b border-zinc-850 pb-1.5 mb-2 font-sans">
                {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {allCalendarDays.map((day, idx) => {
                  const isSelected = selectedDayObj.getDate() === day.day && selectedDayObj.getMonth() === day.date.getMonth() && selectedDayObj.getFullYear() === day.date.getFullYear();
                  const isToday = today.getDate() === day.day && today.getMonth() === day.date.getMonth() && today.getFullYear() === day.date.getFullYear();
                  const statusVal = day.isCurrentMonth ? getDayStatus(day.date) : 'Todo';

                  // Base classes
                  let cellClasses = "aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 relative text-xs font-semibold select-none transition-all duration-150 border ";

                  if (!day.isCurrentMonth) {
                    cellClasses += "text-zinc-700 bg-zinc-950/20 opacity-30 cursor-not-allowed border-transparent";
                  } else {
                    cellClasses += "cursor-pointer ";

                    if (isSelected) {
                      cellClasses += "ring-1.5 ring-amber-500 border-amber-500 scale-[1.03] shadow-[0_0_12px_rgba(245,158,11,0.15)] z-10 ";
                    } else if (isToday) {
                      cellClasses += "ring-1 ring-zinc-500/50 border-zinc-500/80 ";
                    }

                    switch (statusVal) {
                      case 'Completed':
                        cellClasses += "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
                        break;
                      case 'Partial':
                        cellClasses += "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20";
                        break;
                      case 'Attempted':
                        cellClasses += "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                        break;
                      default:
                        cellClasses += isSelected ? "bg-zinc-850 border-zinc-750 text-zinc-100" : "bg-zinc-905/60 border-zinc-850/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200";
                    }
                  }

                  return (
                    <div 
                      key={idx}
                      onClick={() => day.isCurrentMonth && setSelectedDayObj(day.date)}
                      onDoubleClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                      className={cellClasses}
                      title={day.isCurrentMonth ? `Challenge for ${day.date.toLocaleDateString()}: ${getDailyChallengeForDate(day.date)?.title || ''} (${statusVal})` : ''}
                    >
                      {/* Day number */}
                      <span className="self-start text-[11px] leading-none">{day.day}</span>
                      
                      {/* Status Dot / Indicator */}
                      {day.isCurrentMonth && (
                        <div className="flex items-center space-x-1 mt-1 justify-center w-full">
                          {statusVal === 'Completed' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                          )}
                          {statusVal === 'Partial' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                          )}
                          {statusVal === 'Attempted' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Minor Legend labels */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 mt-4 border-t border-zinc-850 text-[10px] font-bold text-zinc-500 uppercase select-none tracking-wider font-sans">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/30 inline-block" />
                <span>Completed (Solved)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/30 inline-block" />
                <span>Partial (WA)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/15 border border-rose-500/30 inline-block" />
                <span>Attempted</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800 inline-block" />
                <span>Todo</span>
              </span>
            </div>
          </div>

          {/* Featured Challenge Details Sidebar: spans 2 columns */}
          <div className="lg:col-span-2">
            {selectedChallengeProblem ? (
              <div className="bg-zinc-950/45 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between h-full space-y-4 font-sans">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-850/70 pb-2.5">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block leading-none">Challenge Date</span>
                      <span className="text-xs font-bold text-zinc-300">
                        {selectedDayObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {selectedDayStatus === 'Completed' && (
                        <span className="flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-tight">
                          Completed
                        </span>
                      )}
                      {selectedDayStatus === 'Partial' && (
                        <span className="flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold tracking-tight">
                          Partial (WA)
                        </span>
                      )}
                      {selectedDayStatus === 'Attempted' && (
                        <span className="flex items-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold tracking-tight">
                          Attempted
                        </span>
                      )}
                      {selectedDayStatus === 'Todo' && (
                        <span className="flex items-center px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] uppercase font-bold tracking-tight">
                          Todo / Unsolved
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Problem Target</span>
                    <h4 className="text-sm font-extrabold text-zinc-100 flex items-center space-x-2">
                      <Code className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedChallengeProblem.id}. {selectedChallengeProblem.title}</span>
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                      {selectedChallengeProblem.description.replace(/[`*#_[\]()]/g, '')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900 text-xs font-sans">
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase tracking-wider mb-0.5 font-bold">Difficulty</span>
                      <span className={`font-extrabold text-[11px] ${
                        selectedChallengeProblem.difficulty === 'Easy' ? 'text-emerald-400' :
                        selectedChallengeProblem.difficulty === 'Medium' ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {selectedChallengeProblem.difficulty}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase tracking-wider mb-0.5 font-bold">Category</span>
                      <span className="text-zinc-350 font-bold text-[11px] truncate block">
                        {selectedChallengeProblem.category.split('/').pop()?.trim()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="featured-solve-challenge-btn"
                  onClick={() => handleDayClick(selectedDayObj)}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs tracking-wide rounded-lg transition-all active:scale-[0.98] duration-150 flex items-center justify-center space-x-1.5 shadow cursor-pointer font-sans"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-zinc-950" />
                  <span>VIEW DAILY WORKSPACE</span>
                </button>
              </div>
            ) : (
              <div className="h-full bg-zinc-950/20 border border-zinc-900 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-2 text-zinc-500 select-none">
                <Trophy className="w-8 h-8 text-zinc-800 animate-bounce" />
                <span className="text-xs font-mono font-bold">Select a calendar day to solve challenge</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Filter and Search Bar Controller section */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch">
          
          {/* Text Input Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-zinc-500" />
            </span>
            <input
              type="text"
              id="problem-search-input"
              value={filters.search}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search problems by title, keywords, or topics..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700/80 transition-all duration-150 font-sans"
            />
          </div>

          {/* Selector controllers */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Difficulty selector dropdown */}
            <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id="problem-difficulty-filter"
                value={filters.difficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                className="bg-transparent text-xs text-zinc-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-950 text-zinc-300">All Difficulties</option>
                <option value="Easy" className="bg-zinc-950 text-emerald-400">Easy</option>
                <option value="Medium" className="bg-zinc-950 text-amber-400">Medium</option>
                <option value="Hard" className="bg-zinc-950 text-rose-400">Hard</option>
              </select>
            </div>

            {/* Status selector dropdown */}
            <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id="problem-status-filter"
                value={filters.status}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent text-xs text-zinc-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-950">All Statuses</option>
                <option value="Todo" className="bg-zinc-950">Todo</option>
                <option value="Attempted" className="bg-zinc-950">Attempted</option>
                <option value="Solved" className="bg-zinc-950">Solved</option>
              </select>
            </div>

            {/* Reset Filters button */}
            <button
              id="problem-reset-filters-btn"
              onClick={resetFilters}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-950 text-xs font-semibold transition-colors duration-150"
              title="Reset query filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

          </div>
        </div>

        {/* Categories / Topic Taxonomy selectors */}
        <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-1 border-t border-zinc-800/40 pt-3">
          <span className="text-zinc-500 text-[10px] font-bold uppercase select-none shrink-0 pr-2 tracking-wider">Topics:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              id={`topic-tag-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150 shrink-0 border ${
                filters.category === cat
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Directory Table Tableboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto custom-minimal-scrollbar shadow-sm">
        <div className="min-w-[750px] md:min-w-full">
          <table className="w-full text-left border-collapse" id="problems-table">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] tracking-wider font-bold uppercase select-none bg-zinc-950/20">
              <th className="py-3.5 px-5 w-16 text-center">Status</th>
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4 w-32">Difficulty</th>
              <th className="py-3.5 px-4 w-40">Acceptance Rate</th>
              <th className="py-3.5 px-4 w-44">Category</th>
              <th className="py-3.5 px-5 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/45">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => (
                <tr 
                  key={problem.id}
                  id={`problems-row-${problem.slug}`}
                  onClick={() => router.push(`/problems/${problem.slug}`)}
                  className="hover:bg-zinc-950/40 group cursor-pointer transition-colors duration-150 text-sm"
                >
                  {/* Status checklist icon */}
                  <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center items-center">
                      {getStatusIcon(problem.id)}
                    </div>
                  </td>

                  {/* Title and custom slug identifier */}
                  <td className="py-4 px-4 font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors duration-150">
                    <div className="flex items-center space-x-2.5">
                      <span>{problem.id}. {problem.title}</span>
                    </div>
                  </td>

                  {/* Difficulty labels */}
                  <td className="py-4 px-4">
                    {getDifficultyBadge(problem.difficulty)}
                  </td>

                  {/* Acceptance Rate with custom styled bar */}
                  <td className="py-4 px-4 text-zinc-400 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-10 text-right">{problem.acceptanceRate}%</span>
                      <div className="flex-1 max-w-24 bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-zinc-600 h-1" 
                          style={{ width: `${problem.acceptanceRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Topic tag tags */}
                  <td className="py-4 px-4 text-zinc-400 text-xs">
                    <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-850 font-normal">
                      {problem.category}
                    </span>
                  </td>

                  {/* Immediate compiler links */}
                  <td className="py-4 px-5 text-center">
                    <button
                      id={`solve-btn-${problem.slug}`}
                      className="inline-flex items-center space-x-1 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                    >
                      <span>Code</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <BookOpen className="w-8 h-8 text-zinc-700 animate-pulse" />
                    <p className="text-zinc-400">No problems found matching active queries.</p>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-zinc-300 underline hover:text-zinc-100"
                    >
                      Clear filters and try again
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination footer block */}
      <div className="flex justify-between items-center mt-6 text-xs text-zinc-500 px-2 font-medium">
        <div>
          Showing {filteredProblems.length} of {totalCount} curated topics
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 rounded border border-zinc-800 bg-zinc-900 cursor-not-allowed" disabled>Prev</button>
          <button className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-100 px-3.5">1</button>
          <button className="px-3 py-1 rounded border border-zinc-800 bg-zinc-900 cursor-not-allowed" disabled>Next</button>
        </div>
      </div>

    </div>
  );
}
