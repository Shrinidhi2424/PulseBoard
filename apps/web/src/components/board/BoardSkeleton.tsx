"use client";

import React from "react";

export const BoardSkeleton: React.FC = React.memo(function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading board..."
      className="flex flex-col h-full animate-pulse select-none transition-opacity duration-200 animate-in fade-in-50"
    >
      {/* Header Skeleton */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-slate-800" />
            <div className="h-3 w-48 rounded bg-slate-850" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 rounded-full bg-slate-800" />
          <div className="h-8 w-24 rounded-lg bg-slate-800" />
        </div>
      </header>

      {/* Columns Skeleton */}
      <main className="flex-1 overflow-x-auto p-8 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div className="flex items-start gap-6 pb-6 min-w-max">
          {[1, 2, 3].map((colIndex) => (
            <div
              key={colIndex}
              className="flex flex-col w-80 shrink-0 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-20 rounded bg-slate-800" />
                  <div className="h-5 w-6 rounded-full bg-slate-800" />
                </div>
                <div className="h-6 w-6 rounded-lg bg-slate-800" />
              </div>

              {/* Task Cards Placeholder */}
              <div className="flex-1 space-y-3 pr-1">
                {[1, 2, 3].slice(0, 4 - colIndex).map((cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-4 space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-4/5 rounded bg-slate-800" />
                      <div className="h-3 w-3/5 rounded bg-slate-850" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-2.5 w-12 rounded bg-slate-850" />
                      <div className="h-4 w-14 rounded bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
});
