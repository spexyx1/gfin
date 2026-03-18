import { useEffect, useState } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const ghettoLetters = [
    { char: 'G', color: '#ff1493', shadow: '#ff1493' },
    { char: 'H', color: '#00ffff', shadow: '#00ffff' },
    { char: 'E', color: '#00ff00', shadow: '#00ff00' },
    { char: 'T', color: '#ffd700', shadow: '#ffd700' },
    { char: 'T', color: '#ff6600', shadow: '#ff6600' },
    { char: 'O', color: '#ff0000', shadow: '#ff0000' },
  ];

  const financeLetters = [
    { char: 'F', color: '#0080ff', shadow: '#0080ff' },
    { char: 'I', color: '#ff1493', shadow: '#ff1493' },
    { char: 'N', color: '#ff0000', shadow: '#ff0000' },
    { char: 'A', color: '#00ffaa', shadow: '#00ffaa' },
    { char: 'N', color: '#ffff00', shadow: '#ffff00' },
    { char: 'C', color: '#ff7f50', shadow: '#ff7f50' },
    { char: 'E', color: '#00ff00', shadow: '#00ff00' },
  ];

  const sizeConfig = {
    xs: {
      container: 'w-32 h-12',
      fontSize: 'text-lg',
      letterSpacing: '-0.05em',
      shadowIntensity: 'small',
      showDecorations: false,
    },
    sm: {
      container: 'w-48 h-16',
      fontSize: 'text-2xl',
      letterSpacing: '-0.05em',
      shadowIntensity: 'medium',
      showDecorations: false,
    },
    md: {
      container: 'w-64 h-24',
      fontSize: 'text-4xl',
      letterSpacing: '-0.06em',
      shadowIntensity: 'large',
      showDecorations: true,
    },
    lg: {
      container: 'w-96 h-32',
      fontSize: 'text-6xl',
      letterSpacing: '-0.06em',
      shadowIntensity: 'large',
      showDecorations: true,
    },
    xl: {
      container: 'w-[32rem] h-40',
      fontSize: 'text-7xl',
      letterSpacing: '-0.07em',
      shadowIntensity: 'xlarge',
      showDecorations: true,
    },
  };

  const config = sizeConfig[size];

  const getShadow = (color: string, intensity: string) => {
    switch (intensity) {
      case 'small':
        return `0 0 5px ${color}, 0 0 10px ${color}`;
      case 'medium':
        return `0 0 7px ${color}, 0 0 15px ${color}, 0 0 25px ${color}`;
      case 'large':
        return `0 0 7px ${color}, 0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`;
      case 'xlarge':
        return `0 0 10px ${color}, 0 0 25px ${color}, 0 0 50px ${color}, 0 0 80px ${color}`;
      default:
        return `0 0 7px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 1300);

    return () => clearTimeout(timer);
  }, [animationKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHasAnimated(false);
      setAnimationKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${config.container} ${className} relative group cursor-pointer`}>
      {config.showDecorations && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 150"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="sprayCloud1">
              <stop offset="0%" stopColor="#ff1493" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff1493" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sprayCloud2">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sprayCloud3">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g opacity="0.3" style={{ animation: 'sprayDrift 8s ease-in-out infinite' }}>
            <circle cx="50" cy="40" r="30" fill="url(#sprayCloud1)" />
            <circle cx="200" cy="70" r="35" fill="url(#sprayCloud2)" />
            <circle cx="350" cy="50" r="28" fill="url(#sprayCloud3)" />
          </g>

          <g opacity="0.6">
            <line x1="80" y1="75" x2="80" y2="95" stroke="#ff1493" strokeWidth="3" strokeLinecap="round"
              style={{ animation: 'dripGrow 2s ease-out forwards', transformOrigin: 'top' }} />
            <line x1="200" y1="75" x2="200" y2="100" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'dripGrow 2.5s ease-out forwards', transformOrigin: 'top' }} />
          </g>

          <g>
            <circle cx="320" cy="30" r="3" fill="#ff1493"
              style={{ animation: 'sparkleRotate 4s linear infinite' }} />
            <circle cx="370" cy="60" r="4" fill="#00ffff"
              style={{ animation: 'sparkleRotate 5s linear infinite' }} />
            <circle cx="340" cy="90" r="3" fill="#ffd700"
              style={{ animation: 'sparkleRotate 4.5s linear infinite' }} />
          </g>

          <g transform="translate(310, 40)">
            <path d="M0,-6 L1.5,-1.5 L6,-1.5 L2,1.5 L3.5,6 L0,3 L-3.5,6 L-2,1.5 L-6,-1.5 L-1.5,-1.5 Z"
              fill="#ff6600" opacity="0.8"
              style={{ animation: 'sparkleRotate 6s linear infinite', transformOrigin: 'center' }} />
          </g>
        </svg>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center h-full transition-transform duration-300 group-hover:scale-105">
        <div className={`font-graffiti ${config.fontSize} font-black flex items-center justify-center`}
          style={{
            letterSpacing: config.letterSpacing,
            transform: 'rotate(-2deg) skewX(-5deg)',
            fontStretch: 'expanded',
          }}>
          {ghettoLetters.map((letter, index) => (
            <span
              key={`ghetto-${index}-${animationKey}`}
              className="inline-block"
              style={{
                color: letter.color,
                textShadow: getShadow(letter.shadow, config.shadowIntensity),
                transform: `skewX(-12deg) rotate(${Math.random() * 6 - 3}deg) scaleY(${0.95 + Math.random() * 0.15})`,
                fontWeight: 900,
                WebkitTextStroke: '2px rgba(0, 0, 0, 0.8)',
                paintOrder: 'stroke fill',
                animation: hasAnimated
                  ? `letterBounce 2.5s ease-in-out infinite ${index * 0.15}s, glowPulse 3s ease-in-out infinite ${index * 0.2}s, neonFlicker 4s ease-in-out infinite ${index * 0.5}s`
                  : `sprayIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${index * 0.08}s`,
                willChange: 'transform, opacity',
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>

        <div className={`font-graffiti ${config.fontSize} font-black flex items-center justify-center -mt-2`}
          style={{
            letterSpacing: config.letterSpacing,
            transform: 'rotate(-2deg) skewX(-5deg)',
            fontStretch: 'expanded',
          }}>
          {financeLetters.map((letter, index) => (
            <span
              key={`finance-${index}-${animationKey}`}
              className="inline-block"
              style={{
                color: letter.color,
                textShadow: getShadow(letter.shadow, config.shadowIntensity),
                transform: `skewX(-12deg) rotate(${Math.random() * 6 - 3}deg) scaleY(${0.95 + Math.random() * 0.15})`,
                fontWeight: 900,
                WebkitTextStroke: '2px rgba(0, 0, 0, 0.8)',
                paintOrder: 'stroke fill',
                animation: hasAnimated
                  ? `letterBounce 2.5s ease-in-out infinite ${(index + 6) * 0.15}s, glowPulse 3s ease-in-out infinite ${(index + 6) * 0.2}s, neonFlicker 4s ease-in-out infinite ${(index + 6) * 0.5}s`
                  : `sprayIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${(index + 6) * 0.08}s`,
                willChange: 'transform, opacity',
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .group:hover span {
          text-shadow: ${ghettoLetters.concat(financeLetters).map(l =>
            `0 0 30px ${l.shadow}, 0 0 60px ${l.shadow}, 0 0 90px ${l.shadow}`
          ).join(', ')};
          transition: text-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
}
