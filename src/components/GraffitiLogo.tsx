import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface GraffitiLogoProps {
  className?: string;
  animated?: boolean;
}

export function GraffitiLogo({ className = '', animated = true }: GraffitiLogoProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (!animated) return;
    controls.start({
      opacity: [1, 0.95, 1],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [animated, controls]);

  return (
    <motion.svg
      viewBox="0 0 480 50"
      className={`h-8 w-auto ${className}`}
      animate={animated ? controls : undefined}
    >
      <defs>
        <linearGradient id="pearlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="40%" stopColor="#000000" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#000000" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b8860b" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#daa520" />
        </linearGradient>
      </defs>

      <text
        x="8"
        y="36"
        fontSize="44"
        fontWeight="bold"
        fontFamily="Arial Black, sans-serif"
        letterSpacing="1"
        fill="url(#pearlGrad)"
        textAnchor="start"
      >
        GHETTO
      </text>

      <text
        x="265"
        y="36"
        fontSize="44"
        fontWeight="bold"
        fontFamily="Arial Black, sans-serif"
        letterSpacing="1"
        fill="url(#goldGrad)"
        textAnchor="start"
      >
        FINANCE
      </text>
    </motion.svg>
  );
}
