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
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="35%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#e8e8e8" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f5deb3" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>

      <text
        x="8"
        y="38"
        fontSize="42"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
        fill="url(#pearlGrad)"
      >
        GHETTO
      </text>

      <text
        x="280"
        y="38"
        fontSize="42"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
        fill="url(#goldGrad)"
      >
        FINANCE
      </text>
    </motion.svg>
  );
}
