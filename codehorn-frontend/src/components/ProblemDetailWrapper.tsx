'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCodeHornStore } from '../store/useCodeHornStore';
import { Problem } from '../types';
import ProblemDetail from './ProblemDetail';

interface ProblemDetailWrapperProps {
  problem: Problem;
}

export default function ProblemDetailWrapper({ problem }: ProblemDetailWrapperProps) {
  const { selectProblem, selectDailyChallenge } = useCodeHornStore();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const dailyParam = searchParams.get('daily');
    if (dailyParam) {
      selectDailyChallenge(problem, dailyParam);
    } else {
      selectProblem(problem);
    }
    setIsReady(true);
  }, [problem, searchParams, selectProblem, selectDailyChallenge]);

  if (!isReady) {
    return (
      <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-zinc-500 font-mono text-xs select-none tracking-wider animate-pulse">
          Loading problem workspace...
        </div>
      </div>
    );
  }

  return <ProblemDetail />;
}
