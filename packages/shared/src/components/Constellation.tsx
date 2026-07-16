import * as React from "react";

// TUT brand colors
const GREY = "#d1d5db";
const ORANGE = "hsl(14, 100%, 57%)";

// Each shape must have exactly 8 nodes so they can morph between each other.
// `accent` marks the orange accent nodes at each shape index.
const shapes: { nodes: { x: number; y: number }[]; accent: number[]; edges: [number, number][] }[] = [
  {
    nodes: [
      { x: 15, y: 20 }, { x: 35, y: 45 }, { x: 60, y: 25 }, { x: 78, y: 55 },
      { x: 25, y: 75 }, { x: 50, y: 65 }, { x: 82, y: 80 }, { x: 68, y: 15 },
    ],
    accent: [1, 5],
    edges: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 3], [5, 6], [2, 7], [3, 6]],
  },
  {
    // Rough "big dipper" / arc
    nodes: [
      { x: 12, y: 68 }, { x: 26, y: 55 }, { x: 42, y: 48 }, { x: 58, y: 42 },
      { x: 72, y: 30 }, { x: 82, y: 18 }, { x: 50, y: 78 }, { x: 68, y: 62 },
    ],
    accent: [3, 6],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 3]],
  },
  {
    // Loose diamond / kite
    nodes: [
      { x: 50, y: 12 }, { x: 22, y: 40 }, { x: 78, y: 40 }, { x: 50, y: 88 },
      { x: 35, y: 58 }, { x: 65, y: 58 }, { x: 50, y: 45 }, { x: 15, y: 70 },
    ],
    accent: [0, 3],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [4, 6], [5, 6], [4, 7], [1, 4], [2, 5]],
  },
  {
    // Scattered network
    nodes: [
      { x: 20, y: 30 }, { x: 45, y: 20 }, { x: 70, y: 35 }, { x: 85, y: 60 },
      { x: 60, y: 70 }, { x: 30, y: 82 }, { x: 15, y: 55 }, { x: 48, y: 50 },
    ],
    accent: [2, 5],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 1], [7, 4], [7, 6]],
  },
];

/**
 * Animated, morphing constellation of connected nodes with a centered
 * caption. No app logo is rendered here — just the animation and caption.
 */
export function Constellation() {
  const [positions, setPositions] = React.useState(shapes[0].nodes);
  const [shapeIndex, setShapeIndex] = React.useState(0);
  const currentEdges = shapes[shapeIndex].edges;
  const currentAccent = shapes[shapeIndex].accent;

  React.useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const DURATION = 8000; // ms per morph
    const HOLD = 6000; // pause between morphs

    const runMorph = (from: { x: number; y: number }[], toIdx: number) => {
      const target = shapes[toIdx].nodes;
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / DURATION);
        // easeInOutCubic
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setPositions(from.map((p, i) => ({
          x: p.x + (target[i].x - p.x) * e,
          y: p.y + (target[i].y - p.y) * e,
        })));
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          setShapeIndex(toIdx);
          setTimeout(() => {
            if (cancelled) return;
            runMorph(target, (toIdx + 1) % shapes.length);
          }, HOLD);
        }
      };
      raf = requestAnimationFrame(step);
    };

    const timer = setTimeout(() => runMorph(shapes[0].nodes, 1), HOLD);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden w-full h-full bg-white">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {currentEdges.map(([a, b], i) => (
          <line
            key={i}
            x1={positions[a].x}
            y1={positions[a].y}
            x2={positions[b].x}
            y2={positions[b].y}
            stroke={GREY}
            strokeWidth="0.12"
            opacity="0.6"
          />
        ))}
        {positions.map((n, i) => {
          const isAccent = currentAccent.includes(i);
          const color = isAccent ? ORANGE : GREY;
          const baseR = isAccent ? 1.0 : 0.75;
          const delay = `${(i * 0.35).toFixed(2)}s`;
          return (
            <g key={i}>
              {/* ripple ring 1 */}
              <circle cx={n.x} cy={n.y} r={baseR} fill="none" stroke={color} strokeWidth="0.15" opacity="0.35">
                <animate attributeName="r" from={baseR} to={baseR * 5} dur="6.4s" begin={delay} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.35" to="0" dur="6.4s" begin={delay} repeatCount="indefinite" />
              </circle>
              {/* ripple ring 2 (offset) */}
              <circle cx={n.x} cy={n.y} r={baseR} fill="none" stroke={color} strokeWidth="0.12" opacity="0.25">
                <animate attributeName="r" from={baseR} to={baseR * 4} dur="6.4s" begin={`${(i * 0.35 + 2.8).toFixed(2)}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.25" to="0" dur="6.4s" begin={`${(i * 0.35 + 2.8).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
              {/* pulsing core dot */}
              <circle cx={n.x} cy={n.y} r={baseR} fill={color} opacity={isAccent ? 0.85 : 0.55}>
                <animate
                  attributeName="r"
                  values={`${baseR};${baseR * 1.5};${baseR}`}
                  dur="4.8s"
                  begin={delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values={`${isAccent ? 0.85 : 0.55};${isAccent ? 1 : 0.8};${isAccent ? 0.85 : 0.55}`}
                  dur="4.8s"
                  begin={delay}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </svg>
      <style>{`
        @keyframes constellationCaptionIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="relative z-10 flex h-full w-full items-center justify-center text-center px-10">
        <div style={{ animation: "constellationCaptionIn 1s ease-out both" }}>
          <p className="text-2xl md:text-3xl font-semibold tracking-tight uppercase text-slate-800">
            A connected campus
          </p>
          <div className="mx-auto mt-3 h-[2px] w-10 rounded-full" style={{ backgroundColor: ORANGE }} />
          <p className="mt-3 text-sm md:text-base font-medium tracking-[0.2em] uppercase" style={{ color: ORANGE }}>
            Report · Respond · Resolve
          </p>
        </div>
      </div>
    </div>
  );
}

export default Constellation;
