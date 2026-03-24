"use client";

const TOTAL_QUESTIONS = 8;

export default function ProgressBar({ current }: { current: number }) {
  const pct = Math.min((current / TOTAL_QUESTIONS) * 100, 100);

  return (
    <div className="w-full px-4 pt-2">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
        <span>Progress</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
