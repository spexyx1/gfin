import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const InactivityAnimations: React.FC = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'graffiti' | 'rappers' | null>(null);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [graffiti, setGraffiti] = useState<Array<{ x: number; y: number; rotation: number }>>([]);
  const [showPolice, setShowPolice] = useState(false);
  const [showCleaning, setShowCleaning] = useState(false);

  const resetTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    if (showAnimation) {
      setShowAnimation(false);
      setAnimationType(null);
      setGraffiti([]);
      setShowPolice(false);
      setShowCleaning(false);
    }

    const timer = setTimeout(() => {
      setAnimationType('graffiti');
      setShowAnimation(true);
    }, 30000);

    setInactivityTimer(timer);
  }, [inactivityTimer, showAnimation]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  useEffect(() => {
    if (animationType === 'graffiti' && showAnimation) {
      const graffitiTimer = setTimeout(() => {
        const newGraffiti = Array.from({ length: 8 }, (_, i) => ({
          x: Math.random() * 60 + 20,
          y: Math.random() * 40 + 10,
          rotation: Math.random() * 60 - 30
        }));
        setGraffiti(newGraffiti);
      }, 3000);

      const policeTimer = setTimeout(() => {
        setShowPolice(true);
      }, 5000);

      const cleaningTimer = setTimeout(() => {
        setShowCleaning(true);
        setTimeout(() => {
          setGraffiti([]);
        }, 1000);
      }, 7000);

      const endTimer = setTimeout(() => {
        setShowAnimation(false);
        setAnimationType(null);
        setShowPolice(false);
        setShowCleaning(false);
        setGraffiti([]);

        const nextTimer = setTimeout(() => {
          setAnimationType('rappers');
          setShowAnimation(true);
        }, 60000);
        setInactivityTimer(nextTimer);
      }, 10000);

      return () => {
        clearTimeout(graffitiTimer);
        clearTimeout(policeTimer);
        clearTimeout(cleaningTimer);
        clearTimeout(endTimer);
      };
    }

    if (animationType === 'rappers' && showAnimation) {
      const endTimer = setTimeout(() => {
        setShowAnimation(false);
        setAnimationType(null);

        const nextTimer = setTimeout(() => {
          setAnimationType('graffiti');
          setShowAnimation(true);
        }, 30000);
        setInactivityTimer(nextTimer);
      }, 12000);

      return () => {
        clearTimeout(endTimer);
      };
    }
  }, [animationType, showAnimation]);

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 80%, rgba(0,0,0,0.9) 100%)'
          }}
        >
          {animationType === 'graffiti' && (
            <>
              <motion.div
                initial={{ x: '-10%' }}
                animate={{ x: '110%' }}
                transition={{ duration: 8, ease: 'linear' }}
                className="absolute bottom-20 w-32 h-48"
              >
                <svg viewBox="0 0 100 150" className="w-full h-full">
                  <rect x="35" y="10" width="30" height="30" rx="15" fill="#8B4513" />
                  <rect x="30" y="40" width="40" height="60" fill="#000" />
                  <rect x="25" y="50" width="15" height="40" fill="#8B4513" />
                  <rect x="60" y="50" width="15" height="40" fill="#8B4513" />
                  <rect x="30" y="100" width="15" height="50" fill="#1a1a2e" />
                  <rect x="55" y="100" width="15" height="50" fill="#1a1a2e" />
                  <circle cx="65" cy="60" r="8" fill="#FFD700" />
                  <text x="35" y="30" fontSize="20" fill="#fff">🧢</text>
                </svg>
              </motion.div>

              {graffiti.map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="absolute text-6xl font-bold"
                  style={{
                    left: `${tag.x}%`,
                    top: `${tag.y}%`,
                    transform: `rotate(${tag.rotation}deg)`,
                    color: ['#FF1744', '#00E5FF', '#FFD600', '#76FF03'][index % 4],
                    textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                    fontFamily: 'Impact, sans-serif',
                    WebkitTextStroke: '2px black'
                  }}
                >
                  {['GHETTO', '💀', '👑', '💰', '⚡', '🔥', 'STREET', '✨'][index]}
                </motion.div>
              ))}

              {showPolice && (
                <motion.div
                  initial={{ x: '110%' }}
                  animate={{ x: '-10%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="absolute bottom-20 w-32 h-48"
                >
                  <svg viewBox="0 0 100 150" className="w-full h-full">
                    <rect x="35" y="10" width="30" height="30" rx="15" fill="#FFE0BD" />
                    <rect x="30" y="40" width="40" height="60" fill="#001F3F" />
                    <circle cx="50" cy="45" r="8" fill="#FFD700" />
                    <rect x="25" y="50" width="15" height="40" fill="#FFE0BD" />
                    <rect x="60" y="50" width="15" height="40" fill="#FFE0BD" />
                    <rect x="30" y="100" width="15" height="50" fill="#001F3F" />
                    <rect x="55" y="100" width="15" height="50" fill="#001F3F" />
                    <text x="35" y="25" fontSize="16" fill="#000">👮</text>
                    <circle cx="50" cy="5" r="5" fill="#FF0000" opacity="0.8">
                      <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="50" cy="5" r="5" fill="#0000FF" opacity="0.8">
                      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </motion.div>
              )}

              {showCleaning && graffiti.map((tag, index) => (
                <motion.div
                  key={`clean-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="absolute w-32 h-32 rounded-full bg-white/30"
                  style={{
                    left: `${tag.x}%`,
                    top: `${tag.y}%`,
                    filter: 'blur(20px)'
                  }}
                />
              ))}
            </>
          )}

          {animationType === 'rappers' && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
              >
                <svg width="120" height="150" viewBox="0 0 120 150">
                  <defs>
                    <radialGradient id="fireGradient">
                      <stop offset="0%" stopColor="#FF6B00" />
                      <stop offset="50%" stopColor="#FF8C00" />
                      <stop offset="100%" stopColor="#FFA500" />
                    </radialGradient>
                  </defs>
                  <rect x="40" y="80" width="40" height="60" rx="5" fill="#444" />
                  <motion.path
                    d="M 50 80 Q 45 60 50 50 Q 55 40 50 30 L 55 25 Q 60 35 55 45 Q 60 55 55 70 Z"
                    fill="url(#fireGradient)"
                    animate={{
                      d: [
                        "M 50 80 Q 45 60 50 50 Q 55 40 50 30 L 55 25 Q 60 35 55 45 Q 60 55 55 70 Z",
                        "M 50 80 Q 48 65 52 55 Q 58 45 52 35 L 58 30 Q 62 40 58 50 Q 62 60 58 75 Z",
                        "M 50 80 Q 45 60 50 50 Q 55 40 50 30 L 55 25 Q 60 35 55 45 Q 60 55 55 70 Z"
                      ]
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 55 80 Q 60 65 55 55 Q 50 45 55 35 L 50 30 Q 45 40 50 50 Q 45 60 50 75 Z"
                    fill="url(#fireGradient)"
                    animate={{
                      d: [
                        "M 55 80 Q 60 65 55 55 Q 50 45 55 35 L 50 30 Q 45 40 50 50 Q 45 60 50 75 Z",
                        "M 55 80 Q 58 70 57 60 Q 53 50 57 40 L 53 35 Q 48 45 52 55 Q 48 65 52 78 Z",
                        "M 55 80 Q 60 65 55 55 Q 50 45 55 35 L 50 30 Q 45 40 50 50 Q 45 60 50 75 Z"
                      ]
                    }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 60 80 Q 65 60 60 50 Q 55 40 60 30 L 65 25 Q 70 35 65 45 Q 70 55 65 70 Z"
                    fill="url(#fireGradient)"
                    animate={{
                      d: [
                        "M 60 80 Q 65 60 60 50 Q 55 40 60 30 L 65 25 Q 70 35 65 45 Q 70 55 65 70 Z",
                        "M 60 80 Q 63 68 62 58 Q 58 48 62 38 L 67 33 Q 72 43 67 53 Q 72 63 67 73 Z",
                        "M 60 80 Q 65 60 60 50 Q 55 40 60 30 L 65 25 Q 70 35 65 45 Q 70 55 65 70 Z"
                      ]
                    }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                </svg>
              </motion.div>

              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: -100 }}
                  animate={{
                    x: [40 + i * 100, 60 + i * 100, 40 + i * 100],
                    y: [0, -10, 0, -5, 0]
                  }}
                  exit={{ opacity: 0, x: -200 }}
                  transition={{
                    x: { duration: 2, repeat: Infinity },
                    y: { duration: 1, repeat: Infinity }
                  }}
                  className="absolute bottom-24"
                  style={{ left: `${20 + i * 25}%` }}
                >
                  <svg width="100" height="160" viewBox="0 0 100 160">
                    <rect x="35" y="10" width="30" height="30" rx="15" fill="#3d2817" />
                    <rect x="30" y="40" width="40" height="50" fill={['#FF0000', '#00FF00', '#0000FF'][i]} />
                    <rect x="25" y="50" width="15" height="35" fill="#3d2817" />
                    <rect x="60" y="50" width="15" height="35" fill="#3d2817" />
                    <motion.rect
                      x="60"
                      y="50"
                      width="15"
                      height="35"
                      fill="#3d2817"
                      animate={{
                        rotate: [0, -20, 0, 20, 0]
                      }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <rect x="30" y="90" width="15" height="45" fill="#000" />
                    <rect x="55" y="90" width="15" height="45" fill="#000" />
                    <rect x="27" y="135" width="20" height="10" fill="#fff" />
                    <rect x="53" y="135" width="20" height="10" fill="#fff" />
                    <text x="25" y="30" fontSize="24">🎤</text>
                    <text x="35" y="25" fontSize="20">{['🧢', '👑', '😎'][i]}</text>
                    <motion.text
                      x="45"
                      y="60"
                      fontSize="12"
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    >
                      ♪♫
                    </motion.text>
                  </svg>
                </motion.div>
              ))}

              <motion.div
                initial={{ x: '110%' }}
                animate={{ x: '30%' }}
                transition={{ delay: 4, duration: 2, ease: 'easeInOut' }}
                className="absolute bottom-16"
              >
                <motion.svg
                  width="200"
                  height="120"
                  viewBox="0 0 200 120"
                  animate={{
                    y: [-5, 5, -5, 0, -3, 3, -5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    times: [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1]
                  }}
                >
                  <rect x="20" y="60" width="160" height="40" rx="8" fill="#8B0000" stroke="#FFD700" strokeWidth="2" />
                  <rect x="25" y="50" width="150" height="15" rx="3" fill="#600000" />
                  <rect x="25" y="67" width="150" height="3" fill="#FFD700" />
                  <rect x="25" y="75" width="150" height="3" fill="#FFD700" />
                  <circle cx="40" cy="100" r="18" fill="#1a1a1a" stroke="#FFD700" strokeWidth="3" />
                  <circle cx="40" cy="100" r="10" fill="#333" />
                  <circle cx="40" cy="100" r="5" fill="#FFD700" />
                  <circle cx="160" cy="100" r="18" fill="#1a1a1a" stroke="#FFD700" strokeWidth="3" />
                  <circle cx="160" cy="100" r="10" fill="#333" />
                  <circle cx="160" cy="100" r="5" fill="#FFD700" />
                  <circle cx="45" cy="45" r="3" fill="#FFD700" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="55" cy="45" r="3" fill="#FFD700" opacity="0.8">
                    <animate attributeName="opacity" values="1;0.8;1" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                  <rect x="115" y="55" width="50" height="40" fill="#1a1a2e" opacity="0.3" />
                  <ellipse cx="140" cy="75" rx="15" ry="20" fill="#3d2817" />
                  <circle cx="140" cy="70" r="8" fill="#FFE0BD" />
                  <text x="130" y="73" fontSize="16">😎</text>
                </motion.svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0, 0, 1, 1, 1, 0.8, 0.5, 0] }}
                transition={{ duration: 8, times: [0, 0.4, 0.5, 0.6, 0.65, 0.7, 0.8, 0.85, 0.9, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-8xl">💨</div>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
