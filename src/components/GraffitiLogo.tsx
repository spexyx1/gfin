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
        <linearGradient id="pearlWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f0" />
          <stop offset="50%" stopColor="#e8e8e0" />
          <stop offset="100%" stopColor="#f5f5f0" />
        </linearGradient>
        <linearGradient id="pearlGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e6d5a8" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#e6d5a8" />
        </linearGradient>
      </defs>

      <text
        x="20"
        y="75"
        fontSize="80"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
        letterSpacing="4"
        fill="url(#pearlWhiteGrad)"
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
        fill="url(#pearlGoldGrad)"
        textAnchor="start"
      >
        FINANCE
      </text>
    </motion.svg>
  );
}
