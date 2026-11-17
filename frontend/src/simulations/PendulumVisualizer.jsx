import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export default function PendulumVisualizer({ measurements }) {
  const L = measurements?.length ?? 1.0;
  const g = measurements?.gravity ?? 9.81;
  const theta0Deg = measurements?.initial_angle ?? 12.0;
  const T = measurements?.time_period ?? 2.006;

  const [isPlaying, setIsPlaying] = useState(true);
  const [angleDeg, setAngleDeg] = useState(theta0Deg);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const simTimeRef = useRef(0);

  useEffect(() => {
    simTimeRef.current = 0;
    setElapsed(0);
    setAngleDeg(theta0Deg);
  }, [L, g, theta0Deg]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const omega = (2 * Math.PI) / T;
    const step = (timestamp) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      simTimeRef.current += dt;
      const currentAngle = theta0Deg * Math.cos(omega * simTimeRef.current);
      setAngleDeg(currentAngle);
      setElapsed(simTimeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, T, theta0Deg]);

  const pivotX = 300;
  const pivotY = 44;
  // Scale string length visually between 90px and 215px
  const visualLength = Math.min(215, Math.max(90, 80 + L * 28));
  const rad = (angleDeg * Math.PI) / 180;
  const bobX = pivotX + visualLength * Math.sin(rad);
  const bobY = pivotY + visualLength * Math.cos(rad);
  const completedCycles = Math.floor(elapsed / T);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4 dark:border-navy-700">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span className="font-mono uppercase tracking-wider text-blue-300">
          Simple Pendulum Apparatus (T = {T.toFixed(3)} s)
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400">
            t = {elapsed.toFixed(2)}s · Cycles: {completedCycles}
          </span>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded bg-navy-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-navy-700"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => {
              simTimeRef.current = 0;
              setElapsed(0);
              setAngleDeg(theta0Deg);
            }}
            className="inline-flex items-center gap-1 rounded bg-navy-800 px-2 py-1 text-xs text-slate-200 hover:bg-navy-700"
            title="Reset stopwatch"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <svg viewBox="0 0 600 310" className="h-auto w-full" role="img" aria-label="Animated Simple Pendulum">
        {/* Support Beam */}
        <rect x="170" y="28" width="260" height="16" rx="4" fill="#334155" />
        <circle cx={pivotX} cy={pivotY} r="7" fill="#60a5fa" />

        {/* Vertical equilibrium reference line */}
        <line
          x1={pivotX}
          y1={pivotY}
          x2={pivotX}
          y2={pivotY + visualLength + 24}
          stroke="#334155"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />

        {/* Swing arc guide */}
        <path
          d={`M ${pivotX - visualLength * Math.sin((theta0Deg * Math.PI) / 180)} ${
            pivotY + visualLength * Math.cos((theta0Deg * Math.PI) / 180)
          } A ${visualLength} ${visualLength} 0 0 0 ${
            pivotX + visualLength * Math.sin((theta0Deg * Math.PI) / 180)
          } ${pivotY + visualLength * Math.cos((theta0Deg * Math.PI) / 180)}`}
          fill="none"
          stroke="#1e3a8a"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* String */}
        <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#cbd5e1" strokeWidth="2.5" />

        {/* Metallic Bob */}
        <circle cx={bobX} cy={bobY} r="17" fill="#2563eb" stroke="#93c5fd" strokeWidth="3" />
        <circle cx={bobX - 5} cy={bobY - 5} r="4" fill="#dbeafe" opacity="0.6" />

        {/* Annotations */}
        <text x="24" y="88" fill="#94a3b8" fontSize="12" fontFamily="monospace">
          Length L = {L.toFixed(2)} m
        </text>
        <text x="24" y="108" fill="#94a3b8" fontSize="12" fontFamily="monospace">
          Gravity g = {g.toFixed(2)} m/s²
        </text>
        <text x="24" y="128" fill="#60a5fa" fontSize="12" fontFamily="monospace">
          θ(t) = {angleDeg.toFixed(1)}° (θ₀ = {theta0Deg}°)
        </text>
        {theta0Deg > 15 && (
          <text x="24" y="290" fill="#fbbf24" fontSize="11.5">
            Note: θ₀ &gt; 15° — small-angle approximation deviates by {measurements?.large_angle_deviation_percent}%
          </text>
        )}
      </svg>
    </div>
  );
}
