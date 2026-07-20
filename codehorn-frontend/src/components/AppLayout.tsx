'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useCodeHornStore } from '../store/useCodeHornStore';
import Navbar from './Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface AppLayoutProps {
  children: React.ReactNode;
  initialProblems?: any[];
}

export default function AppLayout({ children, initialProblems }: AppLayoutProps) {
  const pathname = usePathname();
  const { globalTheme, fetchProblems } = useCodeHornStore();

  useEffect(() => {
    if (initialProblems && initialProblems.length > 0) {
      // Sync pre-fetched problems to Zustand store
      useCodeHornStore.setState({ problems: initialProblems });
    } else {
      // Fallback
      fetchProblems();
    }
  }, [initialProblems, fetchProblems]);

  const isListView = pathname === '/' || pathname === '/problems';

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${isListView ? 'min-h-screen' : 'h-screen'} w-screen flex flex-col font-sans ${isListView ? 'overflow-y-auto custom-minimal-scrollbar' : 'overflow-hidden'} ${
        globalTheme === 'light' ? 'global-theme-light' : ''
      } bg-zinc-950 text-zinc-100`}>
        
        {/* Top command navbar */}
        <Navbar />

        {/* Main viewport area panel */}
        <main className={`flex-1 flex flex-col ${isListView ? '' : 'overflow-hidden min-h-0'} relative`}>
          {children}
        </main>

      </div>
    </QueryClientProvider>
  );
}
