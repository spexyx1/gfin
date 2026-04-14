import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface GraffitiLogoProps {
  className?: string;
  animated?: boolean;
}

export function GraffitiLogo({ className = '', animated = true }: GraffitiLogoProps) {
  const ghettoControls = useAnimation();
  const financeControls = useAnimation();

  useEffect(() => {
    if (!animated) return;

    const ghettoLetters = 'GHETTO'.split('');
    const financeLetters = 'FINANCE'.split('');

    const animateLetters = async () => {
      await Promise.all([
        ghettoControls.start(i => ({
          opacity: [0, 1],
          y: [20, 0],
          rotateZ: [5, 0],
          transition: {
            delay: i * 0.08,
            duration: 0.5,
            ease: 'easeOut',
          },
        })),
        financeControls.start(i => ({
          opacity: [0, 1],
          y: [20, 0],
          rotateZ: [-5, 0],
          transition: {
            delay: i * 0.08 + 0.2,
            duration: 0.5,
            ease: 'easeOut',
          },
        })),
      ]);

      ghettoControls.start({
        opacity: [1, 0.9, 1],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      });

      financeControls.start({
        opacity: [1, 0.9, 1],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
      });
    };

    animateLetters();
  }, [animated, ghettoControls, financeControls]);

  const ghettoLetters = 'GHETTO'.split('');
  const financeLetters = 'FINANCE'.split('');

  return (
    <motion.svg
      viewBox="0 0 600 100"
      className={`h-8 w-auto ${className}`}
    >
      <defs>
        <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f9ff" />
          <stop offset="50%" stopColor="#0080ff" />
          <stop offset="100%" stopColor="#00f9ff" />
        </linearGradient>
        <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="50%" stopColor="#ff4d94" />
          <stop offset="100%" stopColor="#ff006e" />
        </linearGradient>
        <linearGradient id="neonLime" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39ff14" />
          <stop offset="50%" stopColor="#7fff00" />
          <stop offset="100%" stopColor="#39ff14" />
        </linearGradient>
        <linearGradient id="neonOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b00" />
          <stop offset="50%" stopColor="#ffa500" />
          <stop offset="100%" stopColor="#ff6b00" />
        </linearGradient>
        <linearGradient id="neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b300ff" />
          <stop offset="50%" stopColor="#ff00ff" />
          <stop offset="100%" stopColor="#b300ff" />
        </linearGradient>
        <linearGradient id="neonRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff1744" />
          <stop offset="50%" stopColor="#ff5252" />
          <stop offset="100%" stopColor="#ff1744" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="graffiti-blur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      <g filter="url(#glow)">
        {ghettoLetters.map((letter, i) => (
          <motion.text
            key={`ghetto-${i}`}
            x={20 + i * 52}
            y="75"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            custom={i}
            animate={ghettoControls}
            initial={{ opacity: 0, y: 20, rotateZ: 5 }}
            style={{
              fill: [
                'url(#neonCyan)',
                'url(#neonPink)',
                'url(#neonLime)',
                'url(#neonOrange)',
                'url(#neonPurple)',
                'url(#neonRed)',
              ][i % 6],
              textAnchor: 'start',
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          >
            {letter}
          </motion.text>
        ))}

        {financeLetters.map((letter, i) => (
          <motion.text
            key={`finance-${i}`}
            x={20 + i * 72}
            y="75"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            custom={i}
            animate={financeControls}
            initial={{ opacity: 0, y: 20, rotateZ: -5 }}
            style={{
              fill: [
                'url(#neonPink)',
                'url(#neonLime)',
                'url(#neonOrange)',
                'url(#neonPurple)',
                'url(#neonRed)',
                'url(#neonCyan)',
                'url(#neonPink)',
              ][i % 7],
              textAnchor: 'start',
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          >
            {letter}
          </motion.text>
        ))}
      </g>

      <g opacity="0.3" filter="url(#graffiti-blur)">
        {ghettoLetters.map((letter, i) => (
          <text
            key={`ghetto-shadow-${i}`}
            x={20 + i * 52 + 2}
            y="77"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            fill="url(#neonCyan)"
            style={{ textAnchor: 'start' }}
          >
            {letter}
          </text>
        ))}
      </g>
    </motion.svg>
  );
}
