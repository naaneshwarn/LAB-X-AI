import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export default function ProjectileVisualizer({ measurements, seriesData = [] }) {
  const tof = measurements?.time_of_flight ?? 3.6;
  const maxH = Math.max(1, measurements?.max_height ?? 16);
  const range = Math.max(1, measurements?.horizontal_range ?? 63);
  const vx = measurements?.horizontal_velocity ?? 17.6;
  const vy0 = measurements?.vertical_velocity ?? 17.6;
  const g = measurements?.gravity ?? 9.81;

  const [isPlaying, setIsPlaying] = useState(true);
  const [simT, setSimT] = useState(0);
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => {
    setSimT(0);
    setIsPlaying(true);
  }, [tof, maxH, range]);

  useEffect(() => {
    if (!isPlaying || tof <= 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
      return;
    }
    const tick = (ts) => {
      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      setSimT((prev) => {
        const next = prev + dt;
        return next > tof ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tof]);

  // SVG viewport mapping
  const padL = 54;
  const padR = 36;
  const padT = 32;
  const padB = 46;
  const W = 640;
  const H = 310;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const mapX = (x) => padL + (x / (range * 1.08)) * plotW;
  const mapY = (y) => H - padB - (y / (maxH * 1.2)) * plotH;

  const pathD =
    seriesData.length > 1
      ? seriesData
          .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt.y).toFixed(1)}`)
          .join(' ')
      : '';

  const curX = vx * simT;
  const curY = Math.max(0, vy0 * simT - 0.5 * g * simT * simT);
  const curVy = vy0 - g * simT;

  const px = mapX(curX);
  const py = mapY(curY);

  const apexX = mapX(range / 2);
  const apexY = mapY(maxH);

  // Velocity vector visual scaling
  const vScale = 2.1;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4 dark:border-navy-700">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span className="font-mono uppercase tracking-wider text-blue-300">
          2D Parabolic Trajectory (No Air Resistance)
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400">
            t = {simT.toFixed(2)}s / {tof.toFixed(2)}s
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
            onClick={() => setSimT(0)}
            className="inline-flex items-center gap-1 rounded bg-navy-800 px-2 py-1 text-xs text-slate-200 hover:bg-navy-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Projectile Motion Trajectory">
        {/* Ground & vertical axis */}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#475569" strokeWidth="2.5" />
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#334155" strokeWidth="1.5" />

        {/* Apex guide */}
        <line x1={apexX} y1={apexY} x2={apexX} y2={H - padB} stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx={apexX} cy={apexY} r="4" fill="#a78bfa" />
        <text x={apexX + 6} y={apexY - 6} fill="#c4b5fd" fontSize="11" fontFamily="monospace">
          Apex H = {maxH.toFixed(1)} m
        </text>

        {/* Parabolic trajectory curve */}
        {pathD && <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 4" />}

        {/* Velocity component vectors at current position */}
        <line
          x1={px}
          y1={py}
          x2={Math.min(W - 10, px + vx * vScale)}
          y2={py}
          stroke="#10b981"
          strokeWidth="2.5"
        />
        <line
          x1={px}
          y1={py}
          x2={px}
          y2={Math.max(10, Math.min(H - 10, py - curVy * vScale))}
          stroke="#f59e0b"
          strokeWidth="2.5"
        />

        {/* Projectile body */}
        <circle cx={px} cy={py} r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

        {/* Range marker */}
        <circle cx={mapX(range)} cy={H - padB} r="4.5" fill="#10b981" />
        <text x={mapX(range)} y={H - padB + 18} textAnchor="middle" fill="#6ee7b7" fontSize="11" fontFamily="monospace">
          R = {range.toFixed(1)} m
        </text>

        {/* Legend */}
        <text x={padL} y={H - 8} fill="#10b981" fontSize="11" fontFamily="monospace">
          — vx = {vx.toFixed(1)} m/s
        </text>
        <text x={padL + 160} y={H - 8} fill="#f59e0b" fontSize="11" fontFamily="monospace">
          — vy(t) = {curVy.toFixed(1)} m/s
        </text>
      </svg>
    </div>
  );
}
