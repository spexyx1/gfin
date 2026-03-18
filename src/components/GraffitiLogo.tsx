import { useEffect, useState } from 'react';

interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const ghettoLetters = [
    { char: 'G', gradient: 'linear-gradient(135deg, #ff0080 0%, #ff1493 50%, #ff6699 100%)', shadow: '#ff1493' },
    { char: 'H', gradient: 'linear-gradient(135deg, #00d4ff 0%, #00ffff 50%, #6fffff 100%)', shadow: '#00ffff' },
    { char: 'E', gradient: 'linear-gradient(135deg, #00dd00 0%, #00ff00 50%, #66ff66 100%)', shadow: '#00ff00' },
    { char: 'T', gradient: 'linear-gradient(135deg, #ffaa00 0%, #ffd700 50%, #ffee55 100%)', shadow: '#ffd700' },
    { char: 'T', gradient: 'linear-gradient(135deg, #ff4400 0%, #ff6600 50%, #ff9944 100%)', shadow: '#ff6600' },
    { char: 'O', gradient: 'linear-gradient(135deg, #dd0000 0%, #ff0000 50%, #ff5555 100%)', shadow: '#ff0000' },
  ];

  const financeLetters = [
    { char: 'F', gradient: 'linear-gradient(135deg, #0066ff 0%, #0080ff 50%, #4499ff 100%)', shadow: '#0080ff' },
    { char: 'I', gradient: 'linear-gradient(135deg, #ff0080 0%, #ff1493 50%, #ff6699 100%)', shadow: '#ff1493' },
    { char: 'N', gradient: 'linear-gradient(135deg, #dd0000 0%, #ff0000 50%, #ff5555 100%)', shadow: '#ff0000' },
    { char: 'A', gradient: 'linear-gradient(135deg, #00cc88 0%, #00ffaa 50%, #66ffcc 100%)', shadow: '#00ffaa' },
    { char: 'N', gradient: 'linear-gradient(135deg, #eeee00 0%, #ffff00 50%, #ffff66 100%)', shadow: '#ffff00' },
    { char: 'C', gradient: 'linear-gradient(135deg, #ff5522 0%, #ff7f50 50%, #ffaa77 100%)', shadow: '#ff7f50' },
    { char: 'E', gradient: 'linear-gradient(135deg, #00dd00 0%, #00ff00 50%, #66ff66 100%)', shadow: '#00ff00' },
  ];

  const sizeConfig = {
    xs: {
      container: 'w-32 h-12',
      fontSize: 'text-lg',
      letterSpacing: '-0.03em',
      shadowIntensity: 'small',
      showDecorations: false,
      strokeWidth: '1px',
    },
    sm: {
      container: 'w-48 h-16',
      fontSize: 'text-2xl',
      letterSpacing: '-0.03em',
      shadowIntensity: 'medium',
      showDecorations: false,
      strokeWidth: '1.5px',
    },
    md: {
      container: 'w-64 h-24',
      fontSize: 'text-4xl',
      letterSpacing: '-0.04em',
      shadowIntensity: 'large',
      showDecorations: true,
      strokeWidth: '2px',
    },
    lg: {
      container: 'w-96 h-32',
      fontSize: 'text-6xl',
      letterSpacing: '-0.04em',
      shadowIntensity: 'large',
      showDecorations: true,
      strokeWidth: '3px',
    },
    xl: {
      container: 'w-[32rem] h-40',
      fontSize: 'text-7xl',
      letterSpacing: '-0.05em',
      shadowIntensity: 'xlarge',
      showDecorations: true,
      strokeWidth: '4px',
    },
  };

  const config = sizeConfig[size];

  const getShadow = (color: string, intensity: string, isHover: boolean) => {
    const multiplier = isHover ? 1.5 : 1;
    switch (intensity) {
      case 'small':
        return `0 0 ${5 * multiplier}px ${color}, 0 0 ${10 * multiplier}px ${color}, 2px 2px 4px rgba(0,0,0,0.8)`;
      case 'medium':
        return `0 0 ${7 * multiplier}px ${color}, 0 0 ${15 * multiplier}px ${color}, 0 0 ${25 * multiplier}px ${color}, 2px 2px 6px rgba(0,0,0,0.8)`;
      case 'large':
        return `0 0 ${7 * multiplier}px ${color}, 0 0 ${20 * multiplier}px ${color}, 0 0 ${40 * multiplier}px ${color}, 0 0 ${60 * multiplier}px ${color}, 3px 3px 8px rgba(0,0,0,0.9)`;
      case 'xlarge':
        return `0 0 ${10 * multiplier}px ${color}, 0 0 ${25 * multiplier}px ${color}, 0 0 ${50 * multiplier}px ${color}, 0 0 ${80 * multiplier}px ${color}, 0 0 ${100 * multiplier}px ${color}, 4px 4px 10px rgba(0,0,0,0.9)`;
      default:
        return `0 0 ${7 * multiplier}px ${color}, 0 0 ${20 * multiplier}px ${color}, 0 0 ${40 * multiplier}px ${color}, 3px 3px 8px rgba(0,0,0,0.8)`;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [animationKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHasAnimated(false);
      setAnimationKey((prev) => prev + 1);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 400);
  };

  return (
    <div
      className={`${config.container} ${className} relative group cursor-pointer select-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Background brick wall texture */}
      <div
        className="absolute inset-0 opacity-10 rounded-lg pointer-events-none"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              #4a4a4a 0px,
              #4a4a4a 8px,
              #3a3a3a 8px,
              #3a3a3a 10px
            ),
            repeating-linear-gradient(
              90deg,
              #555 0px,
              #555 30px,
              #444 30px,
              #444 32px
            )
          `
        }}
      />

      {/* Animated spray paint mist background */}
      {config.showDecorations && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 150"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: isHovered ? 'brightness(1.3)' : 'brightness(1)' }}
        >
          <defs>
            <radialGradient id="sprayMist1">
              <stop offset="0%" stopColor="#ff1493" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ff1493" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff1493" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sprayMist2">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#00ffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sprayMist3">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffd700" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sprayMist4">
              <stop offset="0%" stopColor="#00ff00" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#00ff00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00ff00" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Floating spray clouds */}
          <g opacity="0.4" style={{ animation: 'sprayDrift 10s ease-in-out infinite' }}>
            <circle cx="40" cy="35" r="35" fill="url(#sprayMist1)" />
            <circle cx="150" cy="65" r="40" fill="url(#sprayMist2)" />
            <circle cx="280" cy="45" r="38" fill="url(#sprayMist3)" />
            <circle cx="360" cy="70" r="32" fill="url(#sprayMist4)" />
          </g>

          {/* Additional drifting clouds */}
          <g opacity="0.3" style={{ animation: 'sprayDrift 14s ease-in-out infinite reverse' }}>
            <circle cx="100" cy="80" r="28" fill="url(#sprayMist1)" />
            <circle cx="240" cy="30" r="33" fill="url(#sprayMist3)" />
            <circle cx="320" cy="90" r="30" fill="url(#sprayMist2)" />
          </g>

          {/* Paint drips */}
          <g opacity="0.7">
            <line x1="65" y1="78" x2="65" y2="105" stroke="#ff1493" strokeWidth="4" strokeLinecap="round"
              style={{ animation: 'dripGrow 2s ease-out forwards 0.5s', transformOrigin: 'top' }} />
            <circle cx="65" cy="105" r="3" fill="#ff1493"
              style={{ animation: 'dripGrow 2s ease-out forwards 0.5s' }} />

            <line x1="190" y1="78" x2="190" y2="110" stroke="#ffd700" strokeWidth="3.5" strokeLinecap="round"
              style={{ animation: 'dripGrow 2.3s ease-out forwards 0.7s', transformOrigin: 'top' }} />
            <circle cx="190" cy="110" r="2.5" fill="#ffd700"
              style={{ animation: 'dripGrow 2.3s ease-out forwards 0.7s' }} />

            <line x1="315" y1="75" x2="315" y2="98" stroke="#00ffff" strokeWidth="3" strokeLinecap="round"
              style={{ animation: 'dripGrow 2.1s ease-out forwards 0.6s', transformOrigin: 'top' }} />
            <circle cx="315" cy="98" r="2" fill="#00ffff"
              style={{ animation: 'dripGrow 2.1s ease-out forwards 0.6s' }} />
          </g>

          {/* Sparkles and paint splatters */}
          <g>
            <circle cx="350" cy="25" r="3" fill="#ff1493" opacity="0.9"
              style={{ animation: 'sparkleRotate 3.5s linear infinite' }} />
            <circle cx="380" cy="55" r="4" fill="#00ffff" opacity="0.9"
              style={{ animation: 'sparkleRotate 4.2s linear infinite 0.5s' }} />
            <circle cx="365" cy="85" r="3.5" fill="#ffd700" opacity="0.9"
              style={{ animation: 'sparkleRotate 3.8s linear infinite 1s' }} />

            {/* Star shapes */}
            <g transform="translate(330, 35)">
              <path d="M0,-8 L2,-2 L8,-2 L3,2 L5,8 L0,4 L-5,8 L-3,2 L-8,-2 L-2,-2 Z"
                fill="#ff6600" opacity="0.8"
                style={{ animation: 'sparkleRotate 5s linear infinite', transformOrigin: 'center' }} />
            </g>
            <g transform="translate(370, 100)">
              <path d="M0,-6 L1.5,-1.5 L6,-1.5 L2,1.5 L3.5,6 L0,3 L-3.5,6 L-2,1.5 L-6,-1.5 L-1.5,-1.5 Z"
                fill="#00ff00" opacity="0.8"
                style={{ animation: 'sparkleRotate 4.5s linear infinite 0.8s', transformOrigin: 'center' }} />
            </g>

            {/* Small paint splatters */}
            <circle cx="30" cy="95" r="2" fill="#ff0000" opacity="0.6" />
            <circle cx="120" cy="105" r="2.5" fill="#00ffaa" opacity="0.6" />
            <circle cx="260" cy="100" r="2" fill="#ffff00" opacity="0.6" />
          </g>
        </svg>
      )}

      {/* Main text container */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full transition-all duration-300 ${
          isHovered ? 'scale-105' : 'scale-100'
        } ${isClicked ? 'animate-logoShake' : ''}`}
        style={{
          filter: isClicked ? 'brightness(1.5) drop-shadow(0 0 20px white)' : 'brightness(1)',
        }}
      >
        {/* GHETTO text */}
        <div
          className={`font-graffiti ${config.fontSize} font-black flex items-center justify-center`}
          style={{
            letterSpacing: config.letterSpacing,
            transform: 'rotate(-3deg) skewX(-6deg)',
          }}
        >
          {ghettoLetters.map((letter, index) => (
            <span
              key={`ghetto-${index}-${animationKey}`}
              className="inline-block relative"
              style={{
                background: letter.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `hue-rotate(${isHovered ? '10deg' : '0deg'})`,
                textShadow: getShadow(letter.shadow, config.shadowIntensity, isHovered),
                transform: `skewX(-15deg) rotate(${Math.random() * 8 - 4}deg) scaleY(${0.92 + Math.random() * 0.18})`,
                fontWeight: 900,
                WebkitTextStroke: `${config.strokeWidth} rgba(0, 0, 0, 0.9)`,
                paintOrder: 'stroke fill',
                animation: hasAnimated
                  ? `letterBounce 2.8s ease-in-out infinite ${index * 0.12}s, glowPulse 3.5s ease-in-out infinite ${index * 0.18}s, neonFlicker 5s ease-in-out infinite ${index * 0.6}s, colorShift 8s ease-in-out infinite ${index * 0.3}s`
                  : `sprayIn 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${index * 0.09}s`,
                willChange: 'transform, filter',
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>

        {/* FINANCE text */}
        <div
          className={`font-graffiti ${config.fontSize} font-black flex items-center justify-center -mt-1`}
          style={{
            letterSpacing: config.letterSpacing,
            transform: 'rotate(-2deg) skewX(-6deg)',
          }}
        >
          {financeLetters.map((letter, index) => (
            <span
              key={`finance-${index}-${animationKey}`}
              className="inline-block relative"
              style={{
                background: letter.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `hue-rotate(${isHovered ? '10deg' : '0deg'})`,
                textShadow: getShadow(letter.shadow, config.shadowIntensity, isHovered),
                transform: `skewX(-15deg) rotate(${Math.random() * 8 - 4}deg) scaleY(${0.92 + Math.random() * 0.18})`,
                fontWeight: 900,
                WebkitTextStroke: `${config.strokeWidth} rgba(0, 0, 0, 0.9)`,
                paintOrder: 'stroke fill',
                animation: hasAnimated
                  ? `letterBounce 2.8s ease-in-out infinite ${(index + 6) * 0.12}s, glowPulse 3.5s ease-in-out infinite ${(index + 6) * 0.18}s, neonFlicker 5s ease-in-out infinite ${(index + 6) * 0.6}s, colorShift 8s ease-in-out infinite ${(index + 6) * 0.3}s`
                  : `sprayIn 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards ${(index + 6) * 0.09}s`,
                willChange: 'transform, filter',
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
