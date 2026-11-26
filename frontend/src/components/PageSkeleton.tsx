import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-surface border border-borderline rounded-xl shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Table / Chart Skeleton */}
      <div className="p-6 bg-surface border border-borderline rounded-xl shadow-sm space-y-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
