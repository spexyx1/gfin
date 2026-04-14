import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'header';
  className?: string;
  animated?: boolean;
}

const sizeMap: Record<string, { scale: number }> = {
  xs: { scale: 0.4 },
  sm: { scale: 0.6 },
  header: { scale: 1 },
  md: { scale: 1.5 },
  lg: { scale: 2.2 },
  xl: { scale: 2.8 },
};

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const { scale } = sizeMap[size] ?? sizeMap['md'];
  const controls = useAnimation();

  useEffect(() => {
    if (!animated) return;
    controls.start({
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [animated, controls]);

  const svgScale = 50 * scale;

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <motion.svg
        viewBox="0 0 400 120"
        style={{
          width: `${svgScale}px`,
          height: 'auto',
          display: 'block',
        }}
        animate={animated ? controls : undefined}
      >
        <defs>
          <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00CCFF" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#FF3300" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <text
          x="15"
          y="70"
          fontSize="60"
          fontWeight="900"
          fontFamily="Impact, sans-serif"
          fill="url(#ghostGrad)"
          stroke="#000"
          strokeWidth="2"
          filter="url(#glow)"
        >
          GHETTO
        </text>

        <text
          x="15"
          y="110"
          fontSize="60"
          fontWeight="900"
          fontFamily="Impact, sans-serif"
          fill="url(#goldGrad)"
          stroke="#000"
          strokeWidth="2"
          filter="url(#glow)"
        >
          FINANCE
        </text>
      </motion.svg>
    </div>
  );
}
