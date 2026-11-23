import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-white/10 rounded-full" />
          <div className="h-8 w-64 bg-white/10 rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-white/10 rounded-2xl" />
          <div className="h-10 w-28 bg-white/10 rounded-2xl" />
        </div>
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 h-80 bg-white/[0.04] border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="h-4 w-36 bg-white/10 rounded-full" />
          <div className="h-6 w-3/4 bg-white/10 rounded-xl" />
          <div className="h-12 w-48 bg-white/10 rounded-2xl" />
          <div className="h-32 w-full bg-white/[0.03] rounded-2xl" />
        </div>
        <div className="lg:col-span-4 h-80 bg-white/[0.04] border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="h-4 w-28 bg-white/10 rounded-full" />
          <div className="h-6 w-full bg-white/10 rounded-xl" />
          <div className="h-20 w-full bg-white/[0.03] rounded-2xl" />
          <div className="h-12 w-full bg-white/10 rounded-2xl" />
        </div>
      </div>

      {/* Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-56 bg-white/[0.04] border border-white/10 rounded-3xl p-5" />
        <div className="h-56 bg-white/[0.04] border border-white/10 rounded-3xl p-5" />
        <div className="h-56 bg-white/[0.04] border border-white/10 rounded-3xl p-5" />
      </div>
    </div>
  );
};
