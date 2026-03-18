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
        viewBox="0 0 600 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Individual color filters for each letter */}
          <filter id="neonGlow1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="neonGlow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Animated gradients for spray paint effect */}
          <radialGradient id="sprayEffect1">
            <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#ff00ff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="sprayEffect2">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background spray paint circles */}
        <g opacity="0.3">
          <circle cx="100" cy="60" r="40" fill="url(#sprayEffect1)">
            <animate attributeName="r" values="40;50;40" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="500" cy="140" r="50" fill="url(#sprayEffect2)">
            <animate attributeName="r" values="50;60;50" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* GHETTO text with graffiti style */}
        <g className="ghetto-text" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="72" letterSpacing="2">

          {/* G - Hot Pink/Magenta */}
          <text x="20" y="80" fill="#ff1493" stroke="#ff69b4" strokeWidth="2" filter="url(#neonGlow1)">
            G
            <animate attributeName="fill" values="#ff1493;#ff69b4;#ff1493" dur="2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2s" repeatCount="indefinite" />
          </text>

          {/* H - Electric Cyan */}
          <text x="90" y="80" fill="#00ffff" stroke="#00bfff" strokeWidth="2" filter="url(#neonGlow2)">
            H
            <animate attributeName="fill" values="#00ffff;#00bfff;#00ffff" dur="2.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
          </text>

          {/* E - Lime Green */}
          <text x="160" y="80" fill="#00ff00" stroke="#32cd32" strokeWidth="2" filter="url(#neonGlow1)">
            E
            <animate attributeName="fill" values="#00ff00;#32cd32;#00ff00" dur="2.4s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.4s" repeatCount="indefinite" begin="0.4s" />
          </text>

          {/* T - Golden Yellow */}
          <text x="220" y="80" fill="#ffd700" stroke="#ffed4e" strokeWidth="2" filter="url(#neonGlow2)">
            T
            <animate attributeName="fill" values="#ffd700;#ffed4e;#ffd700" dur="2.6s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
          </text>

          {/* T - Orange */}
          <text x="275" y="80" fill="#ff6600" stroke="#ff8c00" strokeWidth="2" filter="url(#neonGlow1)">
            T
            <animate attributeName="fill" values="#ff6600;#ff8c00;#ff6600" dur="2.8s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.8s" repeatCount="indefinite" begin="0.8s" />
          </text>

          {/* O - Purple */}
          <text x="330" y="80" fill="#9d00ff" stroke="#bf00ff" strokeWidth="2" filter="url(#neonGlow2)">
            O
            <animate attributeName="fill" values="#9d00ff;#bf00ff;#9d00ff" dur="3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" begin="1s" />
          </text>
        </g>

        {/* Drip effects */}
        <g opacity="0.7">
          <line x1="120" y1="85" x2="120" y2="105" stroke="#ff69b4" strokeWidth="4" strokeLinecap="round">
            <animate attributeName="y2" values="105;110;105" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="255" y1="85" x2="255" y2="110" stroke="#ffed4e" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="y2" values="110;115;110" dur="2.5s" repeatCount="indefinite" />
          </line>
        </g>

        {/* FINANCE text with graffiti style */}
        <g className="finance-text" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="72" letterSpacing="2">

          {/* F - Neon Blue */}
          <text x="20" y="160" fill="#0080ff" stroke="#00a0ff" strokeWidth="2" filter="url(#neonGlow1)">
            F
            <animate attributeName="fill" values="#0080ff;#00a0ff;#0080ff" dur="2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2s" repeatCount="indefinite" />
          </text>

          {/* I - Hot Pink */}
          <text x="75" y="160" fill="#ff1493" stroke="#ff69b4" strokeWidth="2" filter="url(#neonGlow2)">
            I
            <animate attributeName="fill" values="#ff1493;#ff69b4;#ff1493" dur="2.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
          </text>

          {/* N - Bright Red */}
          <text x="110" y="160" fill="#ff0000" stroke="#ff3333" strokeWidth="2" filter="url(#neonGlow1)">
            N
            <animate attributeName="fill" values="#ff0000;#ff3333;#ff0000" dur="2.4s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.4s" repeatCount="indefinite" begin="0.4s" />
          </text>

          {/* A - Aqua */}
          <text x="180" y="160" fill="#00ffaa" stroke="#00ffcc" strokeWidth="2" filter="url(#neonGlow2)">
            A
            <animate attributeName="fill" values="#00ffaa;#00ffcc;#00ffaa" dur="2.6s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
          </text>

          {/* N - Electric Yellow */}
          <text x="250" y="160" fill="#ffff00" stroke="#ffff66" strokeWidth="2" filter="url(#neonGlow1)">
            N
            <animate attributeName="fill" values="#ffff00;#ffff66;#ffff00" dur="2.8s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.8s" repeatCount="indefinite" begin="0.8s" />
          </text>

          {/* C - Coral */}
          <text x="320" y="160" fill="#ff7f50" stroke="#ff9966" strokeWidth="2" filter="url(#neonGlow2)">
            C
            <animate attributeName="fill" values="#ff7f50;#ff9966;#ff7f50" dur="3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="3s" repeatCount="indefinite" begin="1s" />
          </text>

          {/* E - Violet */}
          <text x="390" y="160" fill="#ee82ee" stroke="#ff99ff" strokeWidth="2" filter="url(#neonGlow1)">
            E
            <animate attributeName="fill" values="#ee82ee;#ff99ff;#ee82ee" dur="3.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="3.2s" repeatCount="indefinite" begin="1.2s" />
          </text>
        </g>

        {/* More drip effects */}
        <g opacity="0.7">
          <line x1="155" y1="165" x2="155" y2="185" stroke="#ff3333" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="y2" values="185;190;185" dur="2.2s" repeatCount="indefinite" />
          </line>
          <line x1="285" y1="165" x2="285" y2="180" stroke="#ffff66" strokeWidth="4" strokeLinecap="round">
            <animate attributeName="y2" values="180;185;180" dur="2.7s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Floating stars and sparkles */}
        <g className="sparkles">
          <circle cx="410" cy="50" r="3" fill="#ff00ff" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="460" cy="70" r="4" fill="#00ffff" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>

          <circle cx="500" cy="90" r="3" fill="#ffd700" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* Star shapes */}
          <g transform="translate(480, 130)">
            <path d="M0,-8 L2,-2 L8,-2 L3,2 L5,8 L0,4 L-5,8 L-3,2 L-8,-2 L-2,-2 Z"
                  fill="#ff1493" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
            </path>
          </g>

          <g transform="translate(530, 110)">
            <path d="M0,-6 L1.5,-1.5 L6,-1.5 L2,1.5 L3.5,6 L0,3 L-3.5,6 L-2,1.5 L-6,-1.5 L-1.5,-1.5 Z"
                  fill="#00ffff" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2.5s" repeatCount="indefinite" />
            </path>
          </g>
        </g>

        {/* Floating bubbles */}
        <g className="bubbles">
          <circle cx="50" cy="120" r="8" fill="none" stroke="#ff00ff" strokeWidth="2" opacity="0.6">
            <animate attributeName="cy" values="120;100;120" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
          </circle>

          <circle cx="550" cy="80" r="10" fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.6">
            <animate attributeName="cy" values="80;60;80" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="5s" repeatCount="indefinite" />
          </circle>

          <circle cx="480" cy="160" r="6" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.6">
            <animate attributeName="cy" values="160;145;160" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Background tag/throw-up element */}
        <g opacity="0.15">
          <ellipse cx="300" cy="100" rx="200" ry="80" fill="#ff00ff">
            <animate attributeName="rx" values="200;210;200" dur="5s" repeatCount="indefinite" />
            <animate attributeName="ry" values="80;85;80" dur="5s" repeatCount="indefinite" />
          </ellipse>
        </g>
      </svg>
    </div>
  );
}
