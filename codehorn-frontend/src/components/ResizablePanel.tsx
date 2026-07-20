import React, { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  leftElement: React.ReactNode;
  rightElement: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSplit?: number; // percentage (e.g. 40)
  minSize?: number; // min percentage (e.g. 20)
  maxSize?: number; // max percentage (e.g. 80)
  idPrefix: string;
}

export default function ResizablePanel({
  leftElement,
  rightElement,
  direction,
  initialSplit = 45,
  minSize = 25,
  maxSize = 75,
  idPrefix,
}: ResizablePanelProps) {
  const [splitPercentage, setSplitPercentage] = useState(initialSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newPercentage = 50;

      if (direction === 'horizontal') {
        const clientX = e.clientX;
        const relativeX = clientX - rect.left;
        newPercentage = (relativeX / rect.width) * 100;
      } else {
        const clientY = e.clientY;
        const relativeY = clientY - rect.top;
        newPercentage = (relativeY / rect.height) * 100;
      }

      // Bound within minSize and maxSize
      if (newPercentage < minSize) newPercentage = minSize;
      if (newPercentage > maxSize) newPercentage = maxSize;

      setSplitPercentage(newPercentage);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, minSize, maxSize]);

  const leftStyles = direction === 'horizontal' 
    ? { width: `${splitPercentage}%`, height: '100%' }
    : { height: `${splitPercentage}%`, width: '100%' };

  const rightStyles = direction === 'horizontal'
    ? { width: `${100 - splitPercentage}%`, height: '100%' }
    : { height: `${100 - splitPercentage}%`, width: '100%' };

  return (
    <div
      ref={containerRef}
      id={`${idPrefix}-container`}
      className={`flex h-full w-full overflow-hidden ${
        direction === 'horizontal' ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Left / Top Panel */}
      <div style={leftStyles} className="overflow-hidden min-w-0 min-h-0 flex flex-col">
        {leftElement}
      </div>

      {/* Resize Handle / Divider Bar */}
      <div
        id={`${idPrefix}-divider`}
        onMouseDown={handleMouseDown}
        className={`group relative flex flex-shrink-0 items-center justify-center bg-zinc-900 border-zinc-800 hover:bg-amber-500/20 active:bg-amber-500/40 transition-colors duration-150 ${
          direction === 'horizontal'
            ? 'w-1.5 cursor-col-resize h-full border-x border-zinc-950/40'
            : 'h-1.5 cursor-row-resize w-full border-y border-zinc-950/40'
        }`}
      >
        {/* Subtle center drag line */}
        <div
          className={`bg-zinc-700 group-hover:bg-amber-500 transition-colors duration-150 rounded-full ${
            direction === 'horizontal' ? 'h-8 w-0.5' : 'w-8 h-0.5'
          }`}
        />
      </div>

      {/* Right / Bottom Panel */}
      <div style={rightStyles} className="overflow-hidden min-w-0 min-h-0 flex flex-col">
        {rightElement}
      </div>
    </div>
  );
}
