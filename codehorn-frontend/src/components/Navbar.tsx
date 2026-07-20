import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCodeHornStore } from '../store/useCodeHornStore';
import { Flame, Trophy, Layers, Library, Sparkles, Terminal, Sun, Moon, Shield } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    streak, 
    xpPoints, 
    getSolvedCount, 
    problems, 
    globalTheme, 
    setGlobalTheme 
  } = useCodeHornStore();

  const solved = getSolvedCount();
  const totalProblems = problems.length || 5;

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-100 px-6 h-14 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand Logo & Tab Links */}
      <div className="flex items-center space-x-8">
        <Link 
          href="/" 
          className="flex items-center space-x-2.5 cursor-pointer group"
          id="navbar-logo"
        >
          {/* Flame Horn Logo block - Minimalist Styled */}
          <div className="bg-zinc-900 border border-zinc-850 p-1.5 rounded-lg text-zinc-400 shadow-sm group-hover:bg-zinc-800 group-hover:text-zinc-100 group-hover:border-zinc-700 transition-all duration-200">
            <Flame className="w-5 h-5 fill-transparent text-current" />
          </div>
          <span className="font-semibold tracking-tight text-base text-zinc-100 transition-colors duration-150">
            Code<span className="text-zinc-500 font-normal">Horn</span>
          </span>
        </Link>

        {/* View Toggle tabs */}
        <nav className="flex items-center space-x-1.5">
          <Link
            id="navbar-problems-tab"
            href="/"
            title="Problems"
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all duration-150 border whitespace-nowrap shrink-0 ${
              pathname === '/' || pathname.startsWith('/problems')
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <Link
            id="navbar-playground-tab"
            href="/playground"
            title="Developer Sandbox"
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all duration-150 border whitespace-nowrap shrink-0 ${
              pathname === '/playground'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Developer Sandbox</span>
          </Link>
        </nav>
      </div>

      {/* Stats trackers, XP points, and editor theme adjustment */}
      <div className="flex items-center space-x-3 md:space-x-5">
        
        {/* Simple Progress HUD */}
        <div className="hidden lg:flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 whitespace-nowrap">
          <div className="text-zinc-500">Solved:</div>
          <div className="flex space-x-1.5 font-bold font-mono">
            <span className="text-zinc-100">E:{solved.easy}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-100">M:{solved.medium}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-100">H:{solved.hard}</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="font-semibold text-zinc-400">
            {solved.total} / {totalProblems}
          </div>
        </div>

        {/* Streak Counter */}
        <div 
          className="flex items-center space-x-1.5 cursor-help bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap" 
          title={`${streak} Day Streak. Keep solving questions daily!`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
          <span className="font-semibold text-zinc-300 text-xs hidden sm:inline">{streak} Day Streak</span>
        </div>

        {/* Dynamic XP Awards badge */}
        <div 
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/12 via-yellow-500/5 to-amber-500/12 border border-amber-500/25 rounded-lg shrink-0 whitespace-nowrap cursor-help shadow-sm shadow-amber-500/5 hover:border-amber-400/40 transition-all duration-200 animate-none" 
          title={`${xpPoints} Experience Points Earned / Developer Credits`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/15 animate-pulse" />
          <span className="font-extrabold text-amber-400 text-xs tracking-wide">{xpPoints} XP</span>
        </div>

        <div className="h-5 w-px bg-zinc-800" />

        {/* Global Theme Adjuster */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setGlobalTheme('dark')}
            className={`p-1 rounded-md transition-all ${
              globalTheme === 'dark' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Dark Global Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setGlobalTheme('light')}
            className={`p-1 rounded-md transition-all ${
              globalTheme === 'light' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Light Global Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User profile avatar */}
        <div className="flex items-center space-x-2 border-l border-zinc-800 pl-4 h-8">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center font-semibold text-xs text-zinc-300">
              CH
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
