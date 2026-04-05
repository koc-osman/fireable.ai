'use client';

import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'Reviewing your employment file...',
  'Consulting with AI Management...',
  'Cross-referencing automation risk data...',
  'Drafting termination notice...',
  'Preparing your severance package...',
];

export default function LoadingAnimation() {
  const [visibleCount, setVisibleCount] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= MESSAGES.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return c;
        }
        return c + 1;
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = (visibleCount / MESSAGES.length) * 100;

  return (
    <div className="py-6 px-2 flex flex-col items-center gap-5">
      {/* Pulsing icon */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[#f5c518]/10 animate-ping absolute" />
        <div className="w-8 h-8 rounded-full bg-[#f5c518]/20 flex items-center justify-center relative z-10">
          <WarningIcon className="w-4 h-4 text-[#f5c518]" />
        </div>
      </div>

      {/* Message log */}
      <div className="w-full space-y-2">
        {MESSAGES.slice(0, visibleCount).map((msg, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm animate-fade-in"
          >
            <span className="text-[#f5c518] text-xs">›</span>
            <span className={i === visibleCount - 1 ? 'font-medium text-white' : 'text-[#444444]'}>
              {msg}
            </span>
            {i === visibleCount - 1 && (
              <span className="inline-flex gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-[#555555] animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-[#555555] animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-[#555555] animate-bounce [animation-delay:300ms]" />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#f5c518] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L1 21h22L12 2zm0 3.5L21 20H3L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
    </svg>
  );
}
