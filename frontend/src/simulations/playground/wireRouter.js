/**
 * Intelligent Orthogonal Wire Routing & Geometry Engine for LabXAI Physics Playground.
 * Keeps logical electrical connections separate from computed SVG wire routes.
 *
 * Features:
 * - Outward terminal normal stubs respecting component rotation
 * - Obstacle-aware orthogonal routing avoiding component bodies
 * - Rounded SVG corner path generation (Q curves)
 * - User-draggable bend points (waypoints) with orthogonal preservation
 * - Exact polyline arc-length sampling for animated electron flow
 * - Magnetic terminal snapping & compatibility checking
 */

import { getComponentDef } from './circuitSolver';

export const WIRE_COLORS = [
  { id: 'blue', name: 'Ocean Blue', hex: '#2563eb' },
  { id: 'red', name: 'Positive Red', hex: '#ef4444' },
  { id: 'green', name: 'Leaf Green', hex: '#16a34a' },
  { id: 'amber', name: 'Warm Orange', hex: '#f97316' },
  { id: 'violet', name: 'Lavender', hex: '#7c3aed' },
  { id: 'slate', name: 'Ground Slate', hex: '#334155' },
];

export function getTerminalGeometry(comp, terminalId) {
  const def = getComponentDef(comp.type);
  const idx = def.terminals.indexOf(terminalId);
  const sign = idx === 0 ? -1 : 1;
  const localX = sign * 44;
  const rad = ((comp.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: Math.round((comp.x + localX * cos) * 10) / 10,
    y: Math.round((comp.y + localX * sin) * 10) / 10,
    nx: Math.round(sign * cos),
    ny: Math.round(sign * sin),
  };
}

export function getComponentBounds(comp, padding = 10) {
  const rot = (((comp.rotation || 0) % 360) + 360) % 360;
  const vertical = rot === 90 || rot === 270;
  const halfW = (vertical ? 28 : 42) + padding;
  const halfH = (vertical ? 42 : 28) + padding;
  return {
    id: comp.id,
    left: comp.x - halfW,
    right: comp.x + halfW,
    top: comp.y - halfH,
    bottom: comp.y + halfH,
  };
}

export function segmentIntersectsBox(a, b, box) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX <= box.left || minX >= box.right || maxY <= box.top || minY >= box.bottom) {
    return false;
  }
  return true;
}

export function simplifyOrthogonalPath(points) {
  if (!points || points.length <= 2) return points || [];
  const deduped = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = deduped[deduped.length - 1];
    if (Math.hypot(points[i].x - prev.x, points[i].y - prev.y) > 0.5) {
      deduped.push(points[i]);
    }
  }
  if (deduped.length <= 2) return deduped;
  const result = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i += 1) {
    const p0 = result[result.length - 1];
    const p1 = deduped[i];
    const p2 = deduped[i + 1];
    const sameX = Math.abs(p0.x - p1.x) < 0.5 && Math.abs(p1.x - p2.x) < 0.5;
    const sameY = Math.abs(p0.y - p1.y) < 0.5 && Math.abs(p1.y - p2.y) < 0.5;
    if (!sameX && !sameY) {
      result.push(p1);
    }
  }
  result.push(deduped[deduped.length - 1]);
  return result;
}

function pathScore(points, obstacles) {
  let length = 0;
  let collisions = 0;
  const bends = Math.max(0, points.length - 2);
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    length += Math.hypot(b.x - a.x, b.y - a.y);
    for (const box of obstacles) {
      if (segmentIntersectsBox(a, b, box)) {
        collisions += 1;
      }
    }
  }
  return collisions * 2500 + bends * 18 + length;
}

function connectOrthogonal(a, b, preferHorizontal = true) {
  if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) {
    return [a, b];
  }
  if (preferHorizontal) {
    return [a, { x: b.x, y: a.y }, b];
  }
  return [a, { x: a.x, y: b.y }, b];
}

/**
 * Compute an obstacle-avoiding orthogonal polyline between two terminal geometries
 * (or between a terminal and a free pointer position for live drawing previews).
 */
export function computeWireRoute(
  start,
  end,
  components = [],
  ignoreIds = [],
  customWaypoints = []
) {
  const stubLen = 22;
  const s1 = {
    x: start.x + (start.nx || 0) * stubLen,
    y: start.y + (start.ny || 0) * stubLen,
  };
  const hasEndNormal = (end.nx || 0) !== 0 || (end.ny || 0) !== 0;
  const e1 = hasEndNormal
    ? { x: end.x + end.nx * stubLen, y: end.y + end.ny * stubLen }
    : { x: end.x, y: end.y };

  // If the student placed manual bend points (waypoints), route orthogonally through them
  if (Array.isArray(customWaypoints) && customWaypoints.length > 0) {
    const chain = [start, s1];
    let cursor = s1;
    for (const wp of customWaypoints) {
      const seg = connectOrthogonal(cursor, wp, Math.abs(wp.x - cursor.x) >= Math.abs(wp.y - cursor.y));
      chain.push(...seg.slice(1));
      cursor = wp;
    }
    const tail = connectOrthogonal(cursor, e1, true);
    chain.push(...tail.slice(1), end);
    return simplifyOrthogonalPath(chain);
  }

  const ignoreSet = new Set(ignoreIds);
  const obstacles = components
    .filter((c) => !ignoreSet.has(c.id))
    .map((c) => getComponentBounds(c, 8));

  const midX = (s1.x + e1.x) / 2;
  const midY = (s1.y + e1.y) / 2;

  const candidates = [
    // Simple L-routes
    [start, s1, { x: e1.x, y: s1.y }, e1, end],
    [start, s1, { x: s1.x, y: e1.y }, e1, end],
    // Centered Z-routes
    [start, s1, { x: midX, y: s1.y }, { x: midX, y: e1.y }, e1, end],
    [start, s1, { x: s1.x, y: midY }, { x: e1.x, y: midY }, e1, end],
  ];

  // Add detour corridors above/below/left/right of any obstacles between start and end
  const relevantBoxes = obstacles.filter(
    (b) =>
      b.right >= Math.min(s1.x, e1.x) - 30 &&
      b.left <= Math.max(s1.x, e1.x) + 30 &&
      b.bottom >= Math.min(s1.y, e1.y) - 30 &&
      b.top <= Math.max(s1.y, e1.y) + 30
  );

  // Also include own component clearance corridors when terminals face away from each other
  const ownBoxes = components
    .filter((c) => ignoreSet.has(c.id))
    .map((c) => getComponentBounds(c, 14));
  const corridorBoxes = [...relevantBoxes, ...ownBoxes];

  for (const box of corridorBoxes) {
    const topY = box.top - 12;
    const botY = box.bottom + 12;
    const leftX = box.left - 12;
    const rightX = box.right + 12;
    candidates.push([start, s1, { x: s1.x, y: topY }, { x: e1.x, y: topY }, e1, end]);
    candidates.push([start, s1, { x: s1.x, y: botY }, { x: e1.x, y: botY }, e1, end]);
    candidates.push([start, s1, { x: leftX, y: s1.y }, { x: leftX, y: e1.y }, e1, end]);
    candidates.push([start, s1, { x: rightX, y: s1.y }, { x: rightX, y: e1.y }, e1, end]);
  }

  let best = simplifyOrthogonalPath(candidates[0]);
  let bestScore = pathScore(best, obstacles);

  for (let i = 1; i < candidates.length; i += 1) {
    const simplified = simplifyOrthogonalPath(candidates[i]);
    const sc = pathScore(simplified, obstacles);
    if (sc < bestScore) {
      bestScore = sc;
      best = simplified;
    }
  }

  return best;
}

/**
 * Convert an orthogonal polyline into a smooth SVG path string with rounded corners.
 */
export function buildRoundedSvgPath(points, radius = 10) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y);

    const r = Math.min(radius, len1 / 2, len2 / 2);
    if (r < 1) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const pStartX = curr.x + (v1x / len1) * r;
    const pStartY = curr.y + (v1y / len1) * r;
    const pEndX = curr.x + (v2x / len2) * r;
    const pEndY = curr.y + (v2y / len2) * r;

    d += ` L ${pStartX.toFixed(1)} ${pStartY.toFixed(1)} Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${pEndX.toFixed(1)} ${pEndY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Sample an exact point along a polyline by normalized distance t in [0, 1].
 */
export function samplePolyline(points, fraction = 0.5) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  let total = 0;
  const segLens = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const l = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLens.push(l);
    total += l;
  }
  if (total < 1e-4) return points[0];
  let target = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < segLens.length; i += 1) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const f = segLens[i] > 1e-4 ? target / segLens[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}

/**
 * Find the nearest component terminal within snapRadius for magnetic wire snapping.
 */
export function findNearestTerminal(pt, components, sourceTerminal = null, snapRadius = 26) {
  let nearest = null;
  let bestDist = snapRadius;

  for (const comp of components) {
    const def = getComponentDef(comp.type);
    for (const terminalId of def.terminals) {
      const geom = getTerminalGeometry(comp, terminalId);
      const dist = Math.hypot(pt.x - geom.x, pt.y - geom.y);
      if (dist < bestDist) {
        bestDist = dist;
        const isSameComp = sourceTerminal && sourceTerminal.componentId === comp.id;
        nearest = {
          componentId: comp.id,
          terminalId,
          ...geom,
          dist,
          compatible: !isSameComp,
          reason: isSameComp ? 'Cannot connect a component to its own terminal' : '',
        };
      }
    }
  }
  return nearest;
}
