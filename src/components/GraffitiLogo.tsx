interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const sizeClasses = {
    xs: 'w-24 h-12',
    sm: 'w-32 h-16',
    md: 'w-48 h-24',
    lg: 'w-64 h-32',
    xl: 'w-80 h-40'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 400 120"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clean yellow-orange gradient */}
          <linearGradient id="yellowOrangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFEA00" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>

          {/* Subtle glow filter */}
          <filter id="subtleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* GHETTO text - clean, modern style */}
        <g transform="translate(10, 20)">
          {/* G */}
          <path
            d="M8 12 Q8 5 15 5 L25 5 Q32 5 32 12 L32 20 L22 20 L22 15 L27 15 M32 20 Q32 28 25 28 L15 28 Q8 28 8 20 L8 12"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* H */}
          <path
            d="M42 5 Q45 5 45 8 L45 15 L55 15 L55 8 Q55 5 58 5 Q61 5 61 8 L61 25 Q61 28 58 28 Q55 28 55 25 L55 20 L45 20 L45 25 Q45 28 42 28 Q39 28 39 25 L39 8 Q39 5 42 5"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* E */}
          <path
            d="M71 8 Q71 5 74 5 L88 5 Q91 5 91 8 Q91 11 88 11 L76 11 L76 15 L85 15 Q88 15 88 18 Q88 21 85 21 L76 21 L76 25 L88 25 Q91 25 91 28 Q91 31 88 31 L74 31 Q71 31 71 28 L71 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* T */}
          <path
            d="M101 8 Q101 5 104 5 L124 5 Q127 5 127 8 Q127 11 124 11 L117 11 L117 25 Q117 28 114 28 Q111 28 111 25 L111 11 L104 11 Q101 11 101 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* T */}
          <path
            d="M137 8 Q137 5 140 5 L160 5 Q163 5 163 8 Q163 11 160 11 L153 11 L153 25 Q153 28 150 28 Q147 28 147 25 L147 11 L140 11 Q137 11 137 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* O */}
          <circle
            cx="185"
            cy="18"
            r="18"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />
          <circle
            cx="185"
            cy="18"
            r="10"
            fill="#0a0a0a"
          />
        </g>

        {/* FINANCE text - clean, modern style */}
        <g transform="translate(10, 65)">
          {/* F */}
          <path
            d="M8 8 Q8 5 11 5 L25 5 Q28 5 28 8 Q28 11 25 11 L13 11 L13 15 L22 15 Q25 15 25 18 Q25 21 22 21 L13 21 L13 28 Q13 31 10 31 Q7 31 7 28 L7 8 Q7 5 8 5"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* I */}
          <path
            d="M35 8 Q35 5 38 5 L48 5 Q51 5 51 8 Q51 11 48 11 L45 11 L45 25 L48 25 Q51 25 51 28 Q51 31 48 31 L38 31 Q35 31 35 28 Q35 25 38 25 L41 25 L41 11 L38 11 Q35 11 35 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* N */}
          <path
            d="M61 8 Q61 5 64 5 Q67 5 67 8 L67 20 L75 8 Q77 5 80 5 Q83 5 83 8 L83 28 Q83 31 80 31 Q77 31 77 28 L77 16 L69 28 Q67 31 64 31 Q61 31 61 28 L61 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* A */}
          <path
            d="M93 28 Q93 31 96 31 Q99 31 99 28 L101 20 L107 20 L109 28 Q109 31 112 31 Q115 31 115 28 L108 8 Q107 5 104 5 Q101 5 100 8 L93 28 M102 15 L106 15"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* N */}
          <path
            d="M125 8 Q125 5 128 5 Q131 5 131 8 L131 20 L139 8 Q141 5 144 5 Q147 5 147 8 L147 28 Q147 31 144 31 Q141 31 141 28 L141 16 L133 28 Q131 31 128 31 Q125 31 125 28 L125 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* C */}
          <path
            d="M167 12 Q167 5 174 5 L182 5 Q185 5 185 8 Q185 11 182 11 L174 11 Q171 11 171 14 L171 22 Q171 25 174 25 L182 25 Q185 25 185 28 Q185 31 182 31 L174 31 Q167 31 167 24 L167 12"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />

          {/* E */}
          <path
            d="M195 8 Q195 5 198 5 L212 5 Q215 5 215 8 Q215 11 212 11 L200 11 L200 15 L209 15 Q212 15 212 18 Q212 21 209 21 L200 21 L200 25 L212 25 Q215 25 215 28 Q215 31 212 31 L198 31 Q195 31 195 28 L195 8"
            fill="url(#yellowOrangeGradient)"
            filter="url(#subtleGlow)"
          />
        </g>

        {/* Clean minimal accents */}
        <g opacity="0.6">
          {/* Simple star */}
          <path
            d="M235 20 L237 25 L242 25 L238 28 L240 33 L235 30 L230 33 L232 28 L228 25 L233 25 Z"
            fill="url(#yellowOrangeGradient)"
          />

          {/* Dollar sign in circle */}
          <circle
            cx="270"
            cy="25"
            r="12"
            fill="url(#yellowOrangeGradient)"
            opacity="0.3"
          />
          <path
            d="M267 20 L273 20 M270 15 L270 35 M267 25 L273 25 M267 30 L273 30"
            fill="none"
            stroke="url(#yellowOrangeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Clean underline */}
        <path
          d="M10 105 L390 105"
          fill="none"
          stroke="url(#yellowOrangeGradient)"
          strokeWidth="2"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
