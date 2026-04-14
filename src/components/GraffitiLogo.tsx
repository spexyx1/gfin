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
      viewBox="0 0 600 100"
      className={`h-8 w-auto ${className}`}
      animate={animated ? controls : undefined}
    >
      <defs>
        <linearGradient id="pearlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="35%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b7000" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>

      <text
        x="20"
        y="75"
        fontSize="80"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        letterSpacing="4"
        fill="url(#pearlGrad)"
        textAnchor="start"
      >
        GHETTO
      </text>

      <text
        x="350"
        y="75"
        fontSize="80"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        letterSpacing="4"
        fill="url(#goldGrad)"
        textAnchor="start"
      >
        FINANCE
      </text>
    </motion.svg>
  );
}
