import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

export function GraffitiLogo({ size = 'md', className = '', animated = true }: GraffitiLogoProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dripPositions, setDripPositions] = useState<number[]>([]);

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

  // Generate random paint splatters
  useEffect(() => {
    if (!animated) return;

    const generateParticle = () => {
      const colors = ['#00e5ff', '#40e0d0', '#ff6b6b', '#ff1744', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#9c27b0', '#e91e63'];
      return {
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 12 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 2 + 1,
      };
    };

    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = [...prev, generateParticle()];
        return newParticles.slice(-15); // Keep last 15 particles
      });
    }, 500);

    return () => clearInterval(interval);
  }, [animated]);

  // Generate paint drips
  useEffect(() => {
    if (!animated) return;

    const generateDrips = () => {
      const numDrips = Math.floor(Math.random() * 3) + 2;
      const positions = Array.from({ length: numDrips }, () => Math.random() * 100);
      setDripPositions(positions);
    };

    generateDrips();
    const interval = setInterval(generateDrips, 4000);

    return () => clearInterval(interval);
  }, [animated]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
        duration: 0.5,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.3,
      rotate: -15,
      filter: 'blur(10px)',
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: Math.random() * 6 - 3,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 8,
        stiffness: 150,
        delay: i * 0.05,
      },
    }),
    hover: {
      y: -5,
      scale: 1.15,
      rotate: Math.random() * 10 - 5,
      transition: {
        type: 'spring',
        damping: 5,
        stiffness: 300,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -8, 0],
      rotate: [-1, 1, -1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const splitText = (text: string, startIndex: number = 0) =>
    text.split('').map((char, index) => (
      <motion.span
        key={`${char}-${index}`}
        custom={startIndex + index}
        variants={animated ? letterVariants : {}}
        whileHover={animated ? 'hover' : {}}
        className="inline-block cursor-default relative"
        style={{
          display: 'inline-block',
          position: 'relative',
        }}
      >
        {char}
        {/* Individual letter drip effect */}
        {animated && Math.random() > 0.7 && (
          <motion.div
            className="absolute left-1/2 top-full w-1 bg-gradient-to-b from-current to-transparent"
            style={{ height: '8px', marginLeft: '-2px' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              repeatDelay: Math.random() * 5 + 3,
            }}
          />
        )}
      </motion.span>
    ));

  const MotionDiv = animated ? motion.div : 'div';
  const containerProps = animated
    ? {
        variants: containerVariants,
        initial: 'hidden',
        animate: 'visible',
      }
    : {};

  return (
    <div className={`${className} relative inline-flex flex-col items-center justify-center ${config.height}`}>
      <style>{`
        @keyframes spray-mist {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.2; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        @keyframes neon-glow-shift {
          0% {
            text-shadow:
              0 0 5px rgba(255, 255, 255, 1),
              0 0 10px rgba(255, 0, 128, 1),
              0 0 20px rgba(255, 0, 128, 0.8),
              0 0 30px rgba(255, 0, 128, 0.6),
              0 0 40px rgba(255, 0, 128, 0.4),
              2px 2px 3px rgba(0, 0, 0, 0.8);
          }
          25% {
            text-shadow:
              0 0 5px rgba(255, 255, 255, 1),
              0 0 10px rgba(255, 140, 0, 1),
              0 0 20px rgba(255, 215, 0, 0.8),
              0 0 30px rgba(255, 215, 0, 0.6),
              0 0 40px rgba(255, 140, 0, 0.4),
              2px 2px 3px rgba(0, 0, 0, 0.8);
          }
          50% {
            text-shadow:
              0 0 5px rgba(255, 255, 255, 1),
              0 0 10px rgba(0, 229, 255, 1),
              0 0 20px rgba(64, 224, 208, 0.8),
              0 0 30px rgba(0, 229, 255, 0.6),
              0 0 40px rgba(64, 224, 208, 0.4),
              2px 2px 3px rgba(0, 0, 0, 0.8);
          }
          75% {
            text-shadow:
              0 0 5px rgba(255, 255, 255, 1),
              0 0 10px rgba(157, 78, 221, 1),
              0 0 20px rgba(157, 78, 221, 0.8),
              0 0 30px rgba(157, 78, 221, 0.6),
              0 0 40px rgba(157, 78, 221, 0.4),
              2px 2px 3px rgba(0, 0, 0, 0.8);
          }
          100% {
            text-shadow:
              0 0 5px rgba(255, 255, 255, 1),
              0 0 10px rgba(255, 0, 128, 1),
              0 0 20px rgba(255, 0, 128, 0.8),
              0 0 30px rgba(255, 0, 128, 0.6),
              0 0 40px rgba(255, 0, 128, 0.4),
              2px 2px 3px rgba(0, 0, 0, 0.8);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg) translateX(0); }
          25% { transform: rotate(-3deg) translateX(-1px); }
          75% { transform: rotate(-1deg) translateX(1px); }
        }

        .graffiti-text {
          position: relative;
          font-style: italic;
          letter-spacing: 0.05em;
        }

        .graffiti-ghetto {
          color: #00e5ff;
          text-shadow:
            -3px -3px 0 #000,
            3px -3px 0 #000,
            -3px 3px 0 #000,
            3px 3px 0 #000,
            0 0 20px rgba(0, 229, 255, 0.8),
            0 0 40px rgba(0, 229, 255, 0.6),
            0 0 60px rgba(0, 229, 255, 0.4),
            4px 4px 8px rgba(0, 0, 0, 0.8);
          background: linear-gradient(180deg, #00e5ff 0%, #40e0d0 30%, #ff6b6b 70%, #ff1744 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .graffiti-finance {
          color: #ffeb3b;
          text-shadow:
            -3px -3px 0 #000,
            3px -3px 0 #000,
            -3px 3px 0 #000,
            3px 3px 0 #000,
            0 0 20px rgba(255, 235, 59, 0.8),
            0 0 40px rgba(255, 193, 7, 0.6),
            0 0 60px rgba(255, 152, 0, 0.4),
            4px 4px 8px rgba(0, 0, 0, 0.8);
          background: linear-gradient(180deg, #ffeb3b 0%, #ffc107 30%, #ff9800 70%, #ff5722 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .spray-mist {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: spray-mist 2s ease-out forwards;
        }

        .shimmer-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }

        .wiggle-container {
          animation: wiggle 4s ease-in-out infinite;
        }

        @keyframes drip-fall {
          0% { transform: translateY(0) scaleY(0); opacity: 1; }
          50% { transform: translateY(20px) scaleY(1); opacity: 0.8; }
          100% { transform: translateY(40px) scaleY(0.5); opacity: 0; }
        }

        .paint-drip {
          position: absolute;
          width: 3px;
          height: 20px;
          bottom: -5px;
          background: linear-gradient(to bottom, currentColor, transparent);
          animation: drip-fall 2s ease-in forwards;
          border-radius: 0 0 50% 50%;
        }
      `}</style>

      {/* Multiple spray mist layers */}
      {animated && (
        <>
          {[...Array(6)].map((_, i) => {
            const gradients = [
              'rgba(0, 229, 255, 0.12), rgba(64, 224, 208, 0.08)',
              'rgba(255, 235, 59, 0.1), rgba(255, 193, 7, 0.07)',
              'rgba(255, 107, 107, 0.09), rgba(255, 23, 68, 0.06)',
              'rgba(255, 152, 0, 0.11), rgba(255, 87, 34, 0.08)',
              'rgba(156, 39, 176, 0.08), rgba(233, 30, 99, 0.06)',
              'rgba(64, 224, 208, 0.1), rgba(0, 229, 255, 0.07)',
            ];
            return (
              <motion.div
                key={`mist-${i}`}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${25 + i * 12}% ${35 + i * 8}%,
                    ${gradients[i]} 0%,
                    transparent 65%)`,
                  filter: 'blur(20px)',
                }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 3.5 + i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                }}
              />
            );
          })}
        </>
      )}

      {/* Animated particles/splatters */}
      {animated &&
        particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full spray-mist"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: 0.4,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: particle.duration }}
          />
        ))}

      {/* Radial burst effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 128, 0.15) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main container with floating animation */}
      <motion.div
        className="relative wiggle-container"
        variants={animated ? floatingVariants : {}}
        animate={animated ? 'animate' : {}}
      >
        {/* GHETTO text */}
        <motion.div
          variants={animated ? pulseVariants : {}}
          animate={animated ? 'animate' : {}}
        >
          <MotionDiv
            className={`${config.fontSize} font-bold tracking-tight select-none graffiti-text graffiti-ghetto relative`}
            style={{
              fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
              letterSpacing: '0.05em',
              fontWeight: 900,
              transform: 'rotate(-3deg) skewY(-2deg)',
              textTransform: 'uppercase',
            }}
            {...containerProps}
          >
            {animated ? splitText('GHETTO', 0) : 'GHETTO'}
            {animated && <div className="shimmer-effect" />}
          </MotionDiv>
        </motion.div>

        {/* FINANCE text */}
        <motion.div
          variants={animated ? pulseVariants : {}}
          animate={animated ? 'animate' : {}}
        >
          <MotionDiv
            className={`${config.fontSize} font-bold tracking-tight select-none graffiti-text graffiti-finance ${config.gap} relative`}
            style={{
              fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
              letterSpacing: '0.05em',
              fontWeight: 900,
              transform: 'rotate(2deg) skewY(1deg)',
              textTransform: 'uppercase',
            }}
            {...containerProps}
          >
            {animated ? splitText('FINANCE', 6) : 'FINANCE'}
            {animated && (
              <div
                className="shimmer-effect"
                style={{ animationDelay: '1.5s' }}
              />
            )}
          </MotionDiv>
        </motion.div>

        {/* Paint drips */}
        {animated &&
          dripPositions.map((pos, i) => (
            <motion.div
              key={`drip-${i}-${pos}`}
              className="paint-drip"
              style={{
                left: `${pos}%`,
                background: 'linear-gradient(to bottom, rgba(255, 0, 128, 0.8), transparent)',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 0.5], opacity: [0, 1, 0] }}
              transition={{
                duration: 2,
                ease: 'easeOut',
              }}
            />
          ))}
      </motion.div>

      {/* Chromatic aberration effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [-2, 2, -2],
            y: [-1, 1, -1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Enhanced glow pulse */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 128, 0.2) 0%, rgba(64, 224, 208, 0.1) 50%, transparent 70%)',
            filter: 'blur(25px)',
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Spray paint can icon */}
      {animated && size !== 'xs' && (
        <motion.div
          className="absolute -right-8 top-0"
          initial={{ opacity: 0, x: -20, rotate: -45 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [-20, 0, 0, 20],
            rotate: [-45, -30, -30, -15],
            y: [0, -5, 5, 10]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        >
          <div className="relative">
            <Sparkles
              className="w-8 h-8 text-cyan-400"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))',
              }}
            />
            <motion.div
              className="absolute -bottom-2 left-1/2 w-1 h-3 bg-gradient-to-b from-cyan-400 to-transparent rounded-full"
              style={{ marginLeft: '-2px' }}
              animate={{
                scaleY: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
