"use client";

import { useEffect, useState } from "react";

interface Dimension {
  label: string;
  left: string;
  right: string;
  score: number;
}

interface MBTIResult {
  type: string;
  description: string;
  dimensions: Dimension[];
}

const DIMENSION_COLORS = [
  { bar: "from-green-400 to-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  { bar: "from-amber-400 to-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  { bar: "from-sky-400 to-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  { bar: "from-rose-400 to-pink-500", bg: "bg-pink-50", text: "text-pink-700" },
];

export default function ResultCard({
  result,
  onRetry,
}: {
  result: MBTIResult;
  onRetry: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    // Fade in the card
    requestAnimationFrame(() => setVisible(true));
    // Animate bars after card appears
    const t = setTimeout(() => setBarsAnimated(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        <p className="text-center text-sm text-gray-400 uppercase tracking-widest mb-2">
          Your personality type
        </p>

        {/* MBTI type with animated reveal */}
        <div className="flex justify-center gap-2 my-4">
          {result.type.split("").map((letter, i) => (
            <span
              key={i}
              className="inline-block text-5xl font-extrabold text-indigo-600 animate-pop-in"
              style={{ animationDelay: `${300 + i * 120}ms` }}
            >
              {letter}
            </span>
          ))}
        </div>

        <p className="text-gray-600 text-center text-sm leading-relaxed mb-8">
          {result.description}
        </p>

        {/* Dimension bars */}
        <div className="space-y-5">
          {result.dimensions.map((dim, i) => {
            const color = DIMENSION_COLORS[i % DIMENSION_COLORS.length];
            const leftPct = dim.score;
            const rightPct = 100 - dim.score;
            const dominant = leftPct >= 50 ? dim.left : dim.right;

            return (
              <div key={dim.label} className="animate-fade-in" style={{ animationDelay: `${600 + i * 150}ms` }}>
                {/* Labels */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${leftPct >= 50 ? color.text : "text-gray-400"}`}>
                    {dim.left} {leftPct >= 50 && `${Math.round(leftPct)}%`}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color.bg} ${color.text}`}>
                    {dim.label.split("/")[leftPct >= 50 ? 0 : 1]}
                  </span>
                  <span className={`text-xs font-semibold ${rightPct > 50 ? color.text : "text-gray-400"}`}>
                    {rightPct > 50 && `${Math.round(rightPct)}%`} {dim.right}
                  </span>
                </div>

                {/* Bar */}
                <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  {/* Left side */}
                  <div
                    className={`absolute left-0 top-0 h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: barsAnimated ? `${leftPct}%` : "0%" }}
                  />
                  {/* Center marker */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/80 z-10" />
                </div>

                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  Leaning towards {dominant}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={onRetry}
          className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
