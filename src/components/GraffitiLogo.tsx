import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: { height: 'h-8', width: 'w-auto' },
  sm: { height: 'h-12', width: 'w-auto' },
  md: { height: 'h-24', width: 'w-auto' },
  lg: { height: 'h-36', width: 'w-auto' },
  xl: { height: 'h-44', width: 'w-auto' },
};

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const { height, width } = sizeMap[size];
  const controls = useAnimation();

  useEffect(() => {
    if (!animated) return;
    controls.start({
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [animated, controls]);

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <motion.img
        src="/icons/ChatGPT_Image_Mar_19,_2026,_06_39_11_AM.png"
        alt="Ghetto Finance"
        className={`${height} ${width} object-contain`}
        animate={animated ? controls : undefined}
      />
    </div>
  );
}
