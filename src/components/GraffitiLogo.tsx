import { motion } from 'framer-motion';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const sizeConfig = {
    xs: {
      fontSize: 'text-sm',
      spacing: 'space-x-0.5',
      height: 'h-8',
      gap: '-mt-0.5',
    },
    sm: {
      fontSize: 'text-lg',
      spacing: 'space-x-1',
      height: 'h-10',
      gap: '-mt-1',
    },
    md: {
      fontSize: 'text-5xl',
      spacing: 'space-x-1.5',
      height: 'h-20',
      gap: '-mt-2',
    },
    lg: {
      fontSize: 'text-7xl',
      spacing: 'space-x-2',
      height: 'h-28',
      gap: '-mt-3',
    },
    xl: {
      fontSize: 'text-8xl',
      spacing: 'space-x-3',
      height: 'h-36',
      gap: '-mt-4',
    },
  };

  const config = sizeConfig[size];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8,
      rotate: -5,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  };

  const glowVariants = {
    initial: {
      opacity: 0.6,
    },
    animate: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const splitText = (text: string) => text.split('').map((char, index) => (
    <motion.span
      key={`${char}-${index}`}
      variants={animated ? letterVariants : {}}
      className="inline-block"
      style={{ display: 'inline-block' }}
    >
      {char}
    </motion.span>
  ));

  const MotionDiv = animated ? motion.div : 'div';
  const containerProps = animated ? {
    variants: containerVariants,
    initial: 'hidden',
    animate: 'visible',
  } : {};

  return (
    <div className={`${className} relative inline-flex flex-col items-center justify-center ${config.height}`}>
      <style>{`
        @keyframes spray-paint {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }

        .graffiti-text {
          position: relative;
          background: linear-gradient(135deg, #ff0080 0%, #ff8c00 25%, #40e0d0 50%, #9d4edd 75%, #ff0080 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease infinite;
          filter: drop-shadow(0 0 10px rgba(255, 0, 128, 0.5))
                  drop-shadow(0 0 20px rgba(64, 224, 208, 0.3))
                  drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .spray-effect {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(255, 0, 128, 0.1) 0%, transparent 70%);
          animation: spray-paint 2s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Spray paint effect background */}
      <div className="spray-effect" />

      {/* GHETTO text */}
      <MotionDiv
        className={`${config.fontSize} font-bold tracking-tight select-none graffiti-text relative`}
        style={{
          fontFamily: "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive",
          letterSpacing: '-0.02em',
          fontWeight: 900,
          transform: 'rotate(-2deg)',
        }}
        {...containerProps}
      >
        {animated ? splitText('GHETTO') : 'GHETTO'}
      </MotionDiv>

      {/* FINANCE text */}
      <MotionDiv
        className={`${config.fontSize} font-bold tracking-tight select-none graffiti-text ${config.gap} relative`}
        style={{
          fontFamily: "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive",
          letterSpacing: '-0.02em',
          fontWeight: 900,
          transform: 'rotate(1deg)',
        }}
        {...containerProps}
      >
        {animated ? splitText('FINANCE') : 'FINANCE'}
      </MotionDiv>

      {/* Glow effect overlay */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 128, 0.1) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          variants={glowVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );
}
