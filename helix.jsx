/* global React */
// Double-helix vertical SVG. Two strands (teal + gold) phase-offset by π,
// linked by occasional rungs. Used as page spine.
const { useEffect, useRef, useState } = React;

function Helix({
  height = 1200,
  width = 140,
  segments = 80,
  amplitude = 38,
  thickness = 1.2,
  rungEvery = 6,
  showRungs = true,
  tealColor = "var(--teal-glow)",
  goldColor = "var(--gold)",
  fadeTop = false,
  fadeBottom = false,
  scrollProgress = 0, // 0..1 — drives the rotation of the helix
  rotations = 6,
  className = "",
  style = {},
}) {
  // Build two strand polylines along height, sine-offset.
  const cx = width / 2;
  const dy = height / segments;
  const phaseShift = scrollProgress * Math.PI * 2 * rotations * 0.2;

  // Strand A and B path points (z-depth via sin)
  const ptsA = [];
  const ptsB = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * rotations + phaseShift;
    const xa = cx + Math.sin(angle) * amplitude;
    const xb = cx + Math.sin(angle + Math.PI) * amplitude;
    const za = Math.cos(angle); // -1..1
    const zb = Math.cos(angle + Math.PI);
    const y = i * dy;
    ptsA.push({ x: xa, y, z: za });
    ptsB.push({ x: xb, y, z: zb });
  }

  // We render the strands as a series of short line segments so we can
  // depth-sort: segments with higher z (closer) get drawn later (on top),
  // and far ones get dimmer + thinner.
  const allSegs = [];
  for (let i = 0; i < segments; i++) {
    const a1 = ptsA[i], a2 = ptsA[i + 1];
    const b1 = ptsB[i], b2 = ptsB[i + 1];
    allSegs.push({
      type: "A",
      x1: a1.x, y1: a1.y, x2: a2.x, y2: a2.y,
      z: (a1.z + a2.z) / 2,
    });
    allSegs.push({
      type: "B",
      x1: b1.x, y1: b1.y, x2: b2.x, y2: b2.y,
      z: (b1.z + b2.z) / 2,
    });
    if (showRungs && i % rungEvery === 0) {
      allSegs.push({
        type: "R",
        x1: a1.x, y1: a1.y, x2: b1.x, y2: b1.y,
        z: Math.min(a1.z, b1.z), // rungs sit on the back-most strand
      });
    }
  }
  allSegs.sort((p, q) => p.z - q.z);

  const colorFor = (s) => {
    if (s.type === "A") return goldColor;
    if (s.type === "B") return tealColor;
    return "var(--gold-dim, rgba(201,163,92,0.35))";
  };

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="helix-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={fadeTop ? 0 : 1} />
          <stop offset="0.08" stopColor="#000" stopOpacity="1" />
          <stop offset="0.92" stopColor="#000" stopOpacity="1" />
          <stop offset="1" stopColor="#000" stopOpacity={fadeBottom ? 0 : 1} />
        </linearGradient>
        <mask id="helix-mask">
          <rect x="0" y="0" width={width} height={height} fill="url(#helix-fade)" />
        </mask>
      </defs>
      <g mask="url(#helix-mask)">
        {allSegs.map((s, i) => {
          const depth = (s.z + 1) / 2; // 0..1 (0=back, 1=front)
          const opacity = s.type === "R"
            ? 0.18 + depth * 0.25
            : 0.35 + depth * 0.6;
          const w = s.type === "R"
            ? thickness * 0.8
            : thickness * (0.6 + depth * 1.1);
          return (
            <line
              key={i}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={colorFor(s)}
              strokeWidth={w}
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </g>
    </svg>
  );
}

// Compact, expressive double-helix for the hero — bigger amplitude, glow.
function HeroHelix({ progress = 0 }) {
  const ref = useRef(null);
  const [{ w, h }, setSize] = useState({ w: 600, h: 900 });
  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={ref} className="hero-helix-wrap" aria-hidden="true">
      <Helix
        width={w || 600}
        height={h || 900}
        segments={Math.max(60, Math.floor((h || 900) / 14))}
        amplitude={Math.min(w * 0.32, 180)}
        thickness={1.6}
        rungEvery={5}
        showRungs={true}
        scrollProgress={progress}
        rotations={5}
        fadeTop={false}
        fadeBottom={true}
      />
    </div>
  );
}

// Vertical spine helix that follows the page on desktop, scroll-rotated.
function SpineHelix({ progress = 0 }) {
  const ref = useRef(null);
  const [h, setH] = useState(900);
  useEffect(() => {
    const update = () => setH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return (
    <div ref={ref} className="spine-helix" aria-hidden="true">
      <Helix
        width={90}
        height={h}
        segments={70}
        amplitude={28}
        thickness={1.1}
        rungEvery={7}
        scrollProgress={progress * 4}
        rotations={4}
        fadeTop
        fadeBottom
      />
    </div>
  );
}

Object.assign(window, { Helix, HeroHelix, SpineHelix });
