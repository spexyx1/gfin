import { motion, useAnimation } from 'framer-motion';
import { useEffect, useMemo } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: { scale: 0.28, height: 'h-8' },
  sm: { scale: 0.42, height: 'h-12' },
  md: { scale: 0.8, height: 'h-24' },
  lg: { scale: 1.1, height: 'h-36' },
  xl: { scale: 1.4, height: 'h-44' },
};

interface DripDef {
  x: number;
  startY: number;
  len: number;
  w: number;
  color: string;
  delay: number;
  blob: number;
}

interface SplatDef {
  cx: number;
  cy: number;
  r: number;
  color: string;
  delay: number;
}

const DRIPS: DripDef[] = [
  { x: 50, startY: 72, len: 26, w: 4.5, color: '#FF3300', delay: 0.8, blob: 6 },
  { x: 135, startY: 76, len: 20, w: 3.5, color: '#00CCFF', delay: 1.5, blob: 5 },
  { x: 210, startY: 70, len: 30, w: 5, color: '#FFD700', delay: 0.5, blob: 7 },
  { x: 288, startY: 74, len: 22, w: 4, color: '#FF6B00', delay: 1.9, blob: 5.5 },
  { x: 370, startY: 76, len: 28, w: 4.5, color: '#00E676', delay: 1.1, blob: 6 },
  { x: 440, startY: 72, len: 18, w: 3.5, color: '#FF1493', delay: 2.1, blob: 4.5 },
  { x: 520, startY: 74, len: 24, w: 4, color: '#00BCD4', delay: 1.6, blob: 5.5 },
  { x: 600, startY: 70, len: 22, w: 3.5, color: '#FF5722', delay: 0.9, blob: 5 },
  { x: 660, startY: 76, len: 26, w: 4, color: '#FFEA00', delay: 2.3, blob: 5 },
  { x: 95, startY: 78, len: 16, w: 3, color: '#E91E63', delay: 2.6, blob: 4 },
  { x: 490, startY: 78, len: 15, w: 3, color: '#AA00FF', delay: 2.8, blob: 4 },
];

const SPLATS: SplatDef[] = [
  { cx: 20, cy: 15, r: 5, color: '#FF3300', delay: 0.2 },
  { cx: 710, cy: 12, r: 4.5, color: '#FFD700', delay: 0.5 },
  { cx: 8, cy: 68, r: 3.5, color: '#00E676', delay: 0.8 },
  { cx: 720, cy: 60, r: 4, color: '#00CCFF', delay: 1.0 },
  { cx: 350, cy: 6, r: 3, color: '#FF1493', delay: 0.4 },
  { cx: 680, cy: 80, r: 3.5, color: '#FF6B00', delay: 1.3 },
  { cx: 70, cy: 82, r: 3, color: '#E91E63', delay: 0.6 },
  { cx: 550, cy: 8, r: 2.5, color: '#00BCD4', delay: 0.9 },
  { cx: 180, cy: 4, r: 3.5, color: '#FFEA00', delay: 1.1 },
  { cx: 460, cy: 84, r: 3, color: '#76FF03', delay: 1.5 },
];

const GHETTO_LETTERS = [
  { char: 'G', x: 0, y: 0, color1: '#FF3300', color2: '#FF6600', color3: '#FF9900', color4: '#FFCC00' },
  { char: 'H', x: 1, y: -2, color1: '#00AAFF', color2: '#00DDFF', color3: '#00FFCC', color4: '#00FF88' },
  { char: 'E', x: 2, y: 2, color1: '#FFD700', color2: '#FFAA00', color3: '#FF7700', color4: '#FF4400' },
  { char: 'T', x: 3, y: -4, color1: '#FF6B00', color2: '#FF3D00', color3: '#DD2C00', color4: '#FF1744' },
  { char: 'T', x: 4, y: 1, color1: '#00E676', color2: '#00BFA5', color3: '#00ACC1', color4: '#0091EA' },
  { char: 'O', x: 5, y: -1, color1: '#E91E63', color2: '#FF1744', color3: '#FF4081', color4: '#FF80AB' },
];

const FINANCE_LETTERS = [
  { char: 'F', x: 0, y: 2, color1: '#FF1493', color2: '#E91E63', color3: '#FF4081', color4: '#FF80AB' },
  { char: 'I', x: 1, y: -3, color1: '#00E5FF', color2: '#00B8D4', color3: '#0097A7', color4: '#00BCD4' },
  { char: 'N', x: 2, y: 1, color1: '#FFEA00', color2: '#FFD600', color3: '#FFC400', color4: '#FFB300' },
  { char: 'A', x: 3, y: -2, color1: '#76FF03', color2: '#64DD17', color3: '#00E676', color4: '#00C853' },
  { char: 'N', x: 4, y: 3, color1: '#FF6D00', color2: '#FF9100', color3: '#FFAB00', color4: '#FFC400' },
  { char: 'C', x: 5, y: -1, color1: '#AA00FF', color2: '#D500F9', color3: '#E040FB', color4: '#EA80FC' },
  { char: 'E', x: 6, y: 2, color1: '#FF3D00', color2: '#FF6E40', color3: '#FF5722', color4: '#FFAB91' },
];

function Drip({ d, animated }: { d: DripDef; animated: boolean }) {
  if (!animated) {
    return (
      <g>
        <rect x={d.x - d.w / 2} y={d.startY} width={d.w} height={d.len} rx={d.w / 2} fill={d.color} opacity={0.85} />
        <circle cx={d.x} cy={d.startY + d.len} r={d.blob} fill={d.color} opacity={0.75} />
      </g>
    );
  }
  return (
    <g>
      <motion.rect
        x={d.x - d.w / 2} y={d.startY} width={d.w} rx={d.w / 2}
        fill={d.color} opacity={0.85}
        initial={{ height: 0 }}
        animate={{ height: [0, d.len, d.len * 0.8] }}
        transition={{ duration: 2.4, delay: d.delay, repeat: Infinity, repeatDelay: 6 + d.delay, ease: 'easeOut' }}
      />
      <motion.circle
        cx={d.x} r={d.blob} fill={d.color}
        initial={{ cy: d.startY, opacity: 0 }}
        animate={{
          cy: [d.startY, d.startY + d.len + d.blob, d.startY + d.len + d.blob + 10],
          scale: [0, 1, 0.6],
          opacity: [0, 0.85, 0],
        }}
        transition={{ duration: 3, delay: d.delay + 0.8, repeat: Infinity, repeatDelay: 6 + d.delay, ease: 'easeIn' }}
      />
    </g>
  );
}

function Splat({ s, animated }: { s: SplatDef; animated: boolean }) {
  if (!animated) {
    return <circle cx={s.cx} cy={s.cy} r={s.r} fill={s.color} opacity={0.45} />;
  }
  return (
    <motion.circle
      cx={s.cx} cy={s.cy} r={s.r} fill={s.color}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 1], opacity: [0, 0.65, 0.35] }}
      transition={{ duration: 1.2, delay: s.delay, repeat: Infinity, repeatDelay: 7 + s.delay * 2, ease: 'easeOut' }}
    />
  );
}

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const { scale, height } = sizeMap[size];
  const controls = useAnimation();
  const drips = useMemo(() => DRIPS, []);
  const splats = useMemo(() => SPLATS, []);

  useEffect(() => {
    if (!animated) return;
    controls.start({
      y: [0, -3, 0],
      rotate: [-0.3, 0.3, -0.3],
      transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [animated, controls]);

  const vw = 730;
  const vh = 95;
  const ghLetterW = 55;
  const finLetterW = 48;
  const ghStartX = 20;
  const finStartX = ghStartX + GHETTO_LETTERS.length * ghLetterW + 30;
  const fontSize = 76;
  const finFontSize = 70;
  const baseY = 68;

  return (
    <div className={`${className} relative inline-flex items-center justify-center ${height}`}>
      <motion.svg
        viewBox={`0 0 ${vw} ${vh}`}
        style={{ width: `${vw * scale}px`, height: `${vh * scale}px`, overflow: 'visible' }}
        animate={animated ? controls : undefined}
      >
        <defs>
          <filter id="gf-blur"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="gf-glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <linearGradient id="gf-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {GHETTO_LETTERS.map((l, i) => (
            <linearGradient key={`gg${i}`} id={`gg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={l.color1} />
              <stop offset="35%" stopColor={l.color2} />
              <stop offset="70%" stopColor={l.color3} />
              <stop offset="100%" stopColor={l.color4} />
            </linearGradient>
          ))}
          {FINANCE_LETTERS.map((l, i) => (
            <linearGradient key={`gf${i}`} id={`gf${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={l.color1} />
              <stop offset="35%" stopColor={l.color2} />
              <stop offset="70%" stopColor={l.color3} />
              <stop offset="100%" stopColor={l.color4} />
            </linearGradient>
          ))}
        </defs>

        {animated && [
          { cx: 90, cy: 40, c: 'rgba(255,51,0,0.09)', r: 55 },
          { cx: 250, cy: 35, c: 'rgba(0,204,255,0.08)', r: 65 },
          { cx: 420, cy: 40, c: 'rgba(255,215,0,0.09)', r: 50 },
          { cx: 580, cy: 35, c: 'rgba(0,230,118,0.08)', r: 58 },
          { cx: 160, cy: 45, c: 'rgba(255,20,147,0.07)', r: 45 },
          { cx: 650, cy: 38, c: 'rgba(170,0,255,0.06)', r: 48 },
        ].map((m, i) => (
          <motion.circle
            key={`mist${i}`} cx={m.cx} cy={m.cy} r={m.r}
            fill={m.c} filter="url(#gf-blur)"
            animate={{ r: [m.r, m.r * 1.25, m.r], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
          />
        ))}

        {splats.map((s, i) => <Splat key={`sp${i}`} s={s} animated={animated} />)}

        <g filter="url(#gf-glow)">
          {GHETTO_LETTERS.map((l, i) => (
            <text
              key={`gh${i}`}
              x={ghStartX + i * ghLetterW}
              y={baseY + l.y}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: "'Bungee Shade', 'Impact', 'Arial Black', sans-serif",
                fontWeight: 900,
                stroke: '#000',
                strokeWidth: 9,
                strokeLinejoin: 'round',
                fill: `url(#gg${i})`,
                paintOrder: 'stroke',
              }}
            >
              {l.char}
            </text>
          ))}

          {FINANCE_LETTERS.map((l, i) => (
            <text
              key={`fn${i}`}
              x={finStartX + i * finLetterW}
              y={baseY + l.y}
              style={{
                fontSize: `${finFontSize}px`,
                fontFamily: "'Bungee Shade', 'Impact', 'Arial Black', sans-serif",
                fontWeight: 900,
                stroke: '#000',
                strokeWidth: 8,
                strokeLinejoin: 'round',
                fill: `url(#gf${i})`,
                paintOrder: 'stroke',
              }}
            >
              {l.char}
            </text>
          ))}
        </g>

        {animated && (
          <motion.rect
            y={15} width={70} height={55} rx={10}
            fill="url(#gf-shimmer)" opacity={0.25}
            animate={{ x: [-80, vw + 80] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />
        )}

        {drips.map((d, i) => <Drip key={`dr${i}`} d={d} animated={animated} />)}
      </motion.svg>
    </div>
  );
}
