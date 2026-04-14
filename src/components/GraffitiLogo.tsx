import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'header';
  className?: string;
  animated?: boolean;
}

const sizeMap: Record<string, { height: string; maxWidth: string }> = {
  xs: { height: 'h-9', maxWidth: 'max-w-[90px]' },
  sm: { height: 'h-12', maxWidth: 'max-w-[140px]' },
  header: { height: 'h-16', maxWidth: 'max-w-[260px]' },
  md: { height: 'h-24', maxWidth: 'max-w-[320px]' },
  lg: { height: 'h-36', maxWidth: 'max-w-[440px]' },
  xl: { height: 'h-44', maxWidth: 'max-w-[540px]' },
};

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const { height, maxWidth } = sizeMap[size] ?? sizeMap['md'];
  const controls = useAnimation();

  useEffect(() => {
    if (!animated) return;
    controls.start({
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [animated, controls]);

  return (
    <div
      className={`${className} relative flex items-center`}
      style={{ mixBlendMode: 'multiply', backgroundColor: 'white', borderRadius: '4px' }}
    >
      <motion.img
        src="/icons/ChatGPT_Image_Mar_19,_2026,_06_39_11_AM.png"
        alt="Ghetto Finance"
        className={`${height} ${maxWidth} w-auto object-contain`}
        animate={animated ? controls : undefined}
      />
    </div>
  );
}
