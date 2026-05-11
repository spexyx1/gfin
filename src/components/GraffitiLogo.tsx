import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface GraffitiLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'xs' | 'sm' | 'header' | 'md' | 'lg';
}

// Unique IDs per instance to avoid SVG gradient/filter ID collisions when rendered multiple times
let instanceCounter = 0;

export function GraffitiLogo({ className = '', animated = true, size: _size }: GraffitiLogoProps) {
  const idRef = useRef(`gfl-${++instanceCounter}`);
  const id = idRef.current;

  const ghettoControls = useAnimation();
  const financeControls = useAnimation();
  const shadowControls = useAnimation();
  const hoodControls = useAnimation();

  const ghettoLetters = 'GHETTO'.split('');
  const financeLetters = 'FINANCE'.split('');

  useEffect(() => {
    if (!animated) return;

    let cancelled = false;
    let loopTimer: ReturnType<typeof setTimeout>;

    const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    // --- flicker helper: rapid opacity pulses then land on target ---
    const flicker = async (
      controls: ReturnType<typeof useAnimation>[],
      targetOpacity: number,
      pulses = 5
    ) => {
      for (let i = 0; i < pulses; i++) {
        if (cancelled) return;
        await Promise.all(
          controls.map(c =>
            c.start({ opacity: i % 2 === 0 ? 0 : 0.85, transition: { duration: 0.055 } })
          )
        );
      }
      // land on target
      await Promise.all(
        controls.map(c =>
          c.start({ opacity: targetOpacity, transition: { duration: 0.07 } })
        )
      );
    };

    // --- resume the normal gentle breathing ---
    const resumeBreathing = () => {
      ghettoControls.start({
        opacity: [1, 0.9, 1],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      });
      financeControls.start({
        opacity: [1, 0.9, 1],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
      });
      shadowControls.start({
        opacity: [0.3, 0.22, 0.3],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      });
    };

    // --- full glitch sequence ---
    const runGlitch = async () => {
      if (cancelled) return;

      // 1. stop breathing, flicker out to black
      ghettoControls.stop();
      financeControls.stop();
      shadowControls.stop();

      await flicker([ghettoControls, financeControls, shadowControls], 0, 6);
      if (cancelled) return;

      // 2. reveal "Welcome To Da Hood"
      await hoodControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      });
      if (cancelled) return;

      // 3. hold
      await sleep(2200);
      if (cancelled) return;

      // 4. flicker hood out
      await hoodControls.start({ opacity: 0, transition: { duration: 0.18 } });
      if (cancelled) return;

      // 5. flicker original back in
      // force opacity to 0 first so the flicker is visible
      await Promise.all([
        ghettoControls.start({ opacity: 0, transition: { duration: 0 } }),
        financeControls.start({ opacity: 0, transition: { duration: 0 } }),
      ]);

      await flicker([ghettoControls, financeControls], 1, 5);
      if (cancelled) return;

      // 6. resume breathing
      resumeBreathing();

      // 7. schedule next glitch
      if (!cancelled) {
        loopTimer = setTimeout(runGlitch, 10000);
      }
    };

    // --- initial intro animation ---
    const init = async () => {
      // set hood to hidden/offset before anything plays
      hoodControls.set({ opacity: 0, y: 10 });
      shadowControls.set({ opacity: 0.3 });

      await Promise.all([
        ghettoControls.start(i => ({
          opacity: [0, 1],
          y: [20, 0],
          rotateZ: [5, 0],
          transition: { delay: (i as number) * 0.08, duration: 0.5, ease: 'easeOut' },
        })),
        financeControls.start(i => ({
          opacity: [0, 1],
          y: [20, 0],
          rotateZ: [-5, 0],
          transition: { delay: (i as number) * 0.08 + 0.2, duration: 0.5, ease: 'easeOut' },
        })),
      ]);

      if (cancelled) return;

      resumeBreathing();

      // first glitch fires after initial settle
      loopTimer = setTimeout(runGlitch, 10000);
    };

    init();

    return () => {
      cancelled = true;
      clearTimeout(loopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  // Gradient / filter id helpers scoped to this instance
  const gId = (name: string) => `${id}-${name}`;

  return (
    <motion.svg
      viewBox="0 0 860 100"
      className={`h-8 w-auto ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gId('neonCyan')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f9ff" />
          <stop offset="50%" stopColor="#0080ff" />
          <stop offset="100%" stopColor="#00f9ff" />
        </linearGradient>
        <linearGradient id={gId('neonPink')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="50%" stopColor="#ff4d94" />
          <stop offset="100%" stopColor="#ff006e" />
        </linearGradient>
        <linearGradient id={gId('neonLime')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39ff14" />
          <stop offset="50%" stopColor="#7fff00" />
          <stop offset="100%" stopColor="#39ff14" />
        </linearGradient>
        <linearGradient id={gId('neonOrange')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b00" />
          <stop offset="50%" stopColor="#ffa500" />
          <stop offset="100%" stopColor="#ff6b00" />
        </linearGradient>
        <linearGradient id={gId('neonPurple')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b300ff" />
          <stop offset="50%" stopColor="#ff00ff" />
          <stop offset="100%" stopColor="#b300ff" />
        </linearGradient>
        <linearGradient id={gId('neonRed')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff1744" />
          <stop offset="50%" stopColor="#ff5252" />
          <stop offset="100%" stopColor="#ff1744" />
        </linearGradient>
        {/* Hood-specific gradients */}
        <linearGradient id={gId('hoodCyan')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f9ff" />
          <stop offset="100%" stopColor="#00cfff" />
        </linearGradient>
        <linearGradient id={gId('hoodLime')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#39ff14" />
          <stop offset="100%" stopColor="#b0ff00" />
        </linearGradient>
        <linearGradient id={gId('hoodOrange')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b00" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
        <linearGradient id={gId('hoodPink')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="100%" stopColor="#ff77cc" />
        </linearGradient>

        <filter id={gId('glow')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={gId('hoodGlow')} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={gId('graffiti-blur')}>
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* ── Original GHETTO FINANCE letters ── */}
      <g filter={`url(#${gId('glow')})`}>
        {ghettoLetters.map((letter, i) => (
          <motion.text
            key={`ghetto-${i}`}
            x={20 + i * 58}
            y="75"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            custom={i}
            animate={ghettoControls}
            initial={{ opacity: 0, y: 20, rotateZ: 5 }}
            style={{
              fill: [
                `url(#${gId('neonCyan')})`,
                `url(#${gId('neonPink')})`,
                `url(#${gId('neonLime')})`,
                `url(#${gId('neonOrange')})`,
                `url(#${gId('neonPurple')})`,
                `url(#${gId('neonRed')})`,
              ][i % 6],
              textAnchor: 'start',
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          >
            {letter}
          </motion.text>
        ))}

        {financeLetters.map((letter, i) => (
          <motion.text
            key={`finance-${i}`}
            x={416 + i * 62}
            y="75"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            custom={i}
            animate={financeControls}
            initial={{ opacity: 0, y: 20, rotateZ: -5 }}
            style={{
              fill: [
                `url(#${gId('neonPink')})`,
                `url(#${gId('neonLime')})`,
                `url(#${gId('neonOrange')})`,
                `url(#${gId('neonPurple')})`,
                `url(#${gId('neonRed')})`,
                `url(#${gId('neonCyan')})`,
                `url(#${gId('neonPink')})`,
              ][i % 7],
              textAnchor: 'start',
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          >
            {letter}
          </motion.text>
        ))}
      </g>

      {/* Shadow drip layer */}
      <motion.g animate={shadowControls} initial={{ opacity: 0.3 }} filter={`url(#${gId('graffiti-blur')})`}>
        {ghettoLetters.map((letter, i) => (
          <text
            key={`ghetto-shadow-${i}`}
            x={20 + i * 58 + 2}
            y="77"
            fontSize="80"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            letterSpacing="0"
            fill={`url(#${gId('neonCyan')})`}
            style={{ textAnchor: 'start' }}
          >
            {letter}
          </text>
        ))}
      </motion.g>

      {/* ── "Welcome To Da Hood" easter-egg layer ── */}
      <motion.g
        animate={hoodControls}
        initial={{ opacity: 0, y: 10 }}
        filter={`url(#${gId('hoodGlow')})`}
      >
        {/* Blurred shadow behind for depth */}
        <g opacity="0.35" filter={`url(#${gId('graffiti-blur')})`}>
          <text
            x="430" y="38"
            fontSize="30"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            textAnchor="middle"
            fill={`url(#${gId('hoodCyan')})`}
            dx="2" dy="2"
          >
            WELCOME TO
          </text>
          <text
            x="430" y="88"
            fontSize="52"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            textAnchor="middle"
            fill={`url(#${gId('hoodOrange')})`}
            dx="2" dy="2"
          >
            DA HOOD
          </text>
        </g>

        {/* "WELCOME" */}
        <text
          x="170" y="38"
          fontSize="30"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          textAnchor="start"
          fill={`url(#${gId('hoodCyan')})`}
          style={{
            filter: 'drop-shadow(0 0 6px #00f9ff)',
            letterSpacing: '2px',
          }}
        >
          WELCOME
        </text>

        {/* "TO" */}
        <text
          x="520" y="38"
          fontSize="30"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          textAnchor="start"
          fill={`url(#${gId('hoodLime')})`}
          style={{
            filter: 'drop-shadow(0 0 6px #39ff14)',
            letterSpacing: '2px',
          }}
        >
          TO
        </text>

        {/* "DA" */}
        <text
          x="230" y="88"
          fontSize="52"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          textAnchor="start"
          fill={`url(#${gId('hoodOrange')})`}
          style={{
            filter: 'drop-shadow(0 0 8px #ff6b00)',
            letterSpacing: '3px',
          }}
        >
          DA
        </text>

        {/* "HOOD" */}
        <text
          x="370" y="88"
          fontSize="52"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          textAnchor="start"
          fill={`url(#${gId('hoodPink')})`}
          style={{
            filter: 'drop-shadow(0 0 8px #ff006e)',
            letterSpacing: '3px',
          }}
        >
          HOOD
        </text>
      </motion.g>
    </motion.svg>
  );
}
