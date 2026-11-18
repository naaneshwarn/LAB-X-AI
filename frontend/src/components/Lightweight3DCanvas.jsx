import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Lightweight, GPU-free procedural 3D perspective canvas for LabXAI 2.0.
 * Supports drag-to-orbit (yaw/pitch), zoom, depth-sorted shaded 3D spheres/tubes/capsules,
 * live animation particles, and click hit-testing — designed for government-school PCs
 * with zero heavy WebGL downloads and instant 2D SVG fallback compatibility.
 */
export default function Lightweight3DCanvas({
  nodes = [],
  tubes = [],
  particles = [],
  selectedId = null,
  onSelect,
  width = 520,
  height = 340,
  bgColor = '#f0f9ff',
  hintText = 'Drag to rotate 3D model · Click any highlighted part to inspect',
}) {
  const canvasRef = useRef(null);
  const [rot, setRot] = useState({ yaw: 0.28, pitch: 0.12, zoom: 1.0 });
  const dragRef = useRef({ active: false, x: 0, y: 0, moved: false });
  const projectedRef = useRef([]);

  const project = (x, y, z, yaw, pitch, zoom, w, h) => {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    // Rotate around Y (yaw)
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    // Rotate around X (pitch)
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;

    const fov = 420 * zoom;
    const dist = 360;
    const scale = fov / Math.max(80, dist + z2);
    return {
      sx: w / 2 + x1 * scale,
      sy: h / 2 + y2 * scale,
      z: z2,
      scale,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with soft educational gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, bgColor);
    bgGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle 3D floor grid ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 34, 150 * rot.zoom, 22 * rot.zoom, 0, 0, Math.PI * 2);
    ctx.stroke();

    const drawList = [];

    // Tubes / connectors
    tubes.forEach((tube) => {
      const p1 = project(tube.x1, tube.y1, tube.z1, rot.yaw, rot.pitch, rot.zoom, width, height);
      const p2 = project(tube.x2, tube.y2, tube.z2, rot.yaw, rot.pitch, rot.zoom, width, height);
      drawList.push({
        kind: 'tube',
        z: (p1.z + p2.z) / 2,
        p1,
        p2,
        tube,
      });
    });

    // 3D Spheres / Ellipsoids / Organs
    const hitTargets = [];
    nodes.forEach((node) => {
      const p = project(node.x, node.y, node.z, rot.yaw, rot.pitch, rot.zoom, width, height);
      const rx = (node.rx ?? node.r ?? 18) * p.scale;
      const ry = (node.ry ?? node.r ?? 18) * p.scale;
      drawList.push({ kind: 'node', z: p.z, p, rx, ry, node });
      if (node.selectable !== false) {
        hitTargets.push({ id: node.id, sx: p.sx, sy: p.sy, rx, ry, z: p.z });
      }
    });

    // Animated particles (O2, CO2, blood cells, electrons)
    particles.forEach((pt) => {
      const p = project(pt.x, pt.y, pt.z, rot.yaw, rot.pitch, rot.zoom, width, height);
      drawList.push({ kind: 'particle', z: p.z - 2, p, pt });
    });

    // Back-to-front painter's sort
    drawList.sort((a, b) => b.z - a.z);
    projectedRef.current = hitTargets.sort((a, b) => a.z - b.z);

    drawList.forEach((item) => {
      if (item.kind === 'tube') {
        const { p1, p2, tube } = item;
        const isSel = selectedId !== null && tube.id === selectedId;
        ctx.save();
        ctx.strokeStyle = isSel ? '#facc15' : tube.color || '#64748b';
        ctx.lineWidth = Math.max(2, (tube.radius || 6) * ((p1.scale + p2.scale) / 2));
        ctx.lineCap = 'round';
        ctx.globalAlpha = tube.opacity ?? 0.9;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        ctx.restore();
      } else if (item.kind === 'node') {
        const { p, rx, ry, node } = item;
        const isSel = selectedId !== null && node.id === selectedId;
        ctx.save();
        ctx.globalAlpha = node.opacity ?? 0.94;

        // 3D Phong-style radial shading
        const grad = ctx.createRadialGradient(
          p.sx - rx * 0.32,
          p.sy - ry * 0.32,
          Math.max(1, Math.min(rx, ry) * 0.12),
          p.sx,
          p.sy,
          Math.max(rx, ry)
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, node.highlight || node.color || '#38bdf8');
        grad.addColorStop(1, node.shadow || node.color || '#1d4ed8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy, Math.max(2, rx), Math.max(2, ry), node.tilt || 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = isSel ? 3.2 : 1.1;
        ctx.strokeStyle = isSel ? '#facc15' : 'rgba(15, 23, 42, 0.25)';
        ctx.stroke();

        if (node.label && (isSel || node.showLabel !== false)) {
          ctx.globalAlpha = 1;
          ctx.font = `${isSel ? '700' : '600'} 10px Inter, system-ui, sans-serif`;
          const textW = ctx.measureText(node.label).width;
          const lx = p.sx - textW / 2 - 4;
          const ly = p.sy - ry - 16;
          ctx.fillStyle = isSel ? '#1e293b' : 'rgba(255,255,255,0.88)';
          ctx.fillRect(lx, ly, textW + 8, 14);
          ctx.fillStyle = isSel ? '#facc15' : '#1e293b';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, p.sx, ly + 10.5);
        }
        ctx.restore();
      } else if (item.kind === 'particle') {
        const { p, pt } = item;
        ctx.save();
        ctx.fillStyle = pt.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(2, (pt.r || 4) * p.scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }, [nodes, tubes, particles, selectedId, rot, width, height, bgColor]);

  const handlePointerDown = (e) => {
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setRot((prev) => ({
      ...prev,
      yaw: prev.yaw + dx * 0.01,
      pitch: Math.max(-0.85, Math.min(0.85, prev.pitch + dy * 0.008)),
    }));
  };

  const handlePointerUp = (e) => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    if (wasDrag || !onSelect) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = ((e.clientX - rect.left) / rect.width) * width;
    const cy = ((e.clientY - rect.top) / rect.height) * height;

    for (const target of projectedRef.current) {
      const nx = (cx - target.sx) / Math.max(12, target.rx);
      const ny = (cy - target.sy) / Math.max(12, target.ry);
      if (nx * nx + ny * ny <= 1.15) {
        onSelect(target.id);
        break;
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/50 dark:border-navy-700 dark:bg-navy-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          dragRef.current.active = false;
        }}
        className="block h-auto w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-label="Interactive 3D scientific model"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 bg-white/90 px-3 py-1.5 text-[11px] text-slate-600 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300">
        <span>{hintText}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRot((r) => ({ ...r, zoom: Math.min(1.5, r.zoom + 0.12) }))}
            className="rounded-md border border-slate-200 px-1.5 py-0.5 font-bold hover:bg-slate-100 dark:border-navy-700 dark:hover:bg-navy-800"
            aria-label="Zoom in 3D view"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setRot((r) => ({ ...r, zoom: Math.max(0.7, r.zoom - 0.12) }))}
            className="rounded-md border border-slate-200 px-1.5 py-0.5 font-bold hover:bg-slate-100 dark:border-navy-700 dark:hover:bg-navy-800"
            aria-label="Zoom out 3D view"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setRot({ yaw: 0.28, pitch: 0.12, zoom: 1.0 })}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 font-semibold hover:bg-slate-100 dark:border-navy-700 dark:hover:bg-navy-800"
          >
            <RotateCcw className="h-3 w-3" /> Reset 3D
          </button>
        </div>
      </div>
    </div>
  );
}
