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
        viewBox="0 0 500 150"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF00FF">
              <animate attributeName="stop-color" values="#FF00FF;#00FFFF;#FFFF00;#FF00FF" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="33%" stopColor="#00FFFF">
              <animate attributeName="stop-color" values="#00FFFF;#FFFF00;#FF00FF;#00FFFF" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="66%" stopColor="#FFFF00">
              <animate attributeName="stop-color" values="#FFFF00;#FF00FF;#00FFFF;#FFFF00" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#FF00FF">
              <animate attributeName="stop-color" values="#FF00FF;#00FFFF;#FFFF00;#FF00FF" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="bubbleEffect" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Animated spray paint background */}
        <g className="spray-background" opacity="0.3">
          <circle cx="50" cy="30" r="20" fill="url(#rainbowGradient)" opacity="0.4">
            <animate attributeName="r" values="20;25;20" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="450" cy="120" r="25" fill="url(#neonGradient)" opacity="0.4">
            <animate attributeName="r" values="25;30;25" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Floating bubbles */}
        <g className="floating-bubbles">
          <circle cx="30" cy="80" r="8" fill="none" stroke="url(#rainbowGradient)" strokeWidth="2" opacity="0.6">
            <animate attributeName="cy" values="80;60;80" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="470" cy="50" r="10" fill="none" stroke="url(#neonGradient)" strokeWidth="2" opacity="0.6">
            <animate attributeName="cy" values="50;30;50" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Background waves */}
        <g className="background-waves" opacity="0.2">
          <path d="M0,75 Q125,50 250,75 T500,75" fill="none" stroke="url(#rainbowGradient)" strokeWidth="3">
            <animate attributeName="d"
              values="M0,75 Q125,50 250,75 T500,75;M0,75 Q125,100 250,75 T500,75;M0,75 Q125,50 250,75 T500,75"
              dur="6s"
              repeatCount="indefinite" />
          </path>
        </g>

        {/* GHETTO text with graffiti style */}
        <g transform="translate(20, 20)" className="graffiti-letter">
          <text x="0" y="40" fontFamily="Impact, sans-serif" fontSize="38" fontWeight="bold"
                fill="url(#rainbowGradient)" filter="url(#glow)" stroke="#000" strokeWidth="2">
            GHETTO
          </text>
        </g>

        {/* Graffiti decorations around GHETTO */}
        <g className="graffiti-decorations">
          <circle cx="195" cy="35" r="4" fill="#00ff88">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="205" cy="28" r="3" fill="#d4af37">
            <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <path d="M190,45 Q195,50 200,45" fill="none" stroke="#ff00ff" strokeWidth="2" opacity="0.8">
            <animate attributeName="d" values="M190,45 Q195,50 200,45;M190,45 Q195,55 200,45;M190,45 Q195,50 200,45" dur="3s" repeatCount="indefinite" />
          </path>
        </g>

        {/* FINANCE text with street style */}
        <g transform="translate(20, 70)" className="graffiti-letter">
          <text x="0" y="40" fontFamily="Impact, sans-serif" fontSize="36" fontWeight="bold"
                fill="url(#neonGradient)" filter="url(#glow)" stroke="#000" strokeWidth="2">
            FINANCE
          </text>
        </g>

        {/* Decorative stars and symbols */}
        <g>
          <g transform="translate(260, 35)" className="graffiti-decorations">
            <path d="M0,-8 L2,-2 L8,-2 L3,2 L5,8 L0,4 L-5,8 L-3,2 L-8,-2 L-2,-2 Z"
                  fill="url(#rainbowGradient)" filter="url(#bubbleEffect)">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />
            </path>
          </g>

          <g transform="translate(310, 100)" className="graffiti-decorations">
            <circle cx="0" cy="0" r="12" fill="url(#neonGradient)" opacity="0.7" filter="url(#bubbleEffect)">
              <animate attributeName="r" values="12;15;12" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x="-7" y="6" fontFamily="Impact" fontSize="18" fontWeight="bold" fill="#000">$</text>
          </g>

          <g transform="translate(350, 35)" className="graffiti-decorations">
            <polygon points="0,-10 3,-3 10,-3 4,2 6,10 0,5 -6,10 -4,2 -10,-3 -3,-3"
                     fill="url(#rainbowGradient)" opacity="0.8" filter="url(#bubbleEffect)">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="10s" repeatCount="indefinite" />
            </polygon>
          </g>
        </g>

        {/* Drip effect lines */}
        <g opacity="0.6" className="graffiti-decorations">
          <line x1="90" y1="55" x2="90" y2="65" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="y2" values="65;70;65" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="160" y1="55" x2="160" y2="68" stroke="url(#neonGradient)" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="y2" values="68;73;68" dur="2.5s" repeatCount="indefinite" />
          </line>
          <line x1="130" y1="105" x2="130" y2="115" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="y2" values="115;120;115" dur="3s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Additional bubble decorations */}
        <g className="floating-bubbles">
          <circle cx="240" cy="65" r="6" fill="none" stroke="url(#neonGradient)" strokeWidth="2" opacity="0.7">
            <animate attributeName="cy" values="65;55;65" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="280" cy="90" r="5" fill="none" stroke="url(#rainbowGradient)" strokeWidth="2" opacity="0.7">
            <animate attributeName="cy" values="90;80;90" dur="4s" repeatCount="indefinite" />
            <animate attributeName="r" values="5;7;5" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Sparkle effects */}
        <g className="graffiti-decorations">
          <path d="M400,40 L402,45 L407,45 L403,48 L405,53 L400,50 L395,53 L397,48 L393,45 L398,45 Z"
                fill="#00ff88" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path d="M420,90 L421,93 L424,93 L422,95 L423,98 L420,96 L417,98 L418,95 L416,93 L419,93 Z"
                fill="#d4af37" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>
  );
}
