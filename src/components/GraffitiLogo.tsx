interface GraffitiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const sizeClasses = {
    sm: 'w-32 h-16',
    md: 'w-48 h-24',
    lg: 'w-64 h-32',
    xl: 'w-80 h-40'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden`}>
      <svg
        viewBox="0 0 400 120"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Advanced filters and effects */}
        <defs>
          {/* Bubble glow filter */}
          <filter id="bubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feColorMatrix in="coloredBlur" type="matrix" 
              values="1.5 0 0 0 0  0 1.5 0 0 0  0 0 1.5 0 0  0 0 0 1 0">
              <animate attributeName="values" 
                values="1.5 0 0 0 0  0 1.5 0 0 0  0 0 1.5 0 0  0 0 0 1 0;
                        2.5 0 0 0 0  0 2.5 0 0 0  0 0 2.5 0 0  0 0 0 1 0;
                        1.5 0 0 0 0  0 1.5 0 0 0  0 0 1.5 0 0  0 0 0 1 0"
                dur="2s" repeatCount="indefinite"/>
            </feColorMatrix>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Rainbow bubble gradient */}
          <linearGradient id="rainbowBubble1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0080">
              <animate attributeName="stop-color" 
                values="#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#8000FF;#FF0080" 
                dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#00FFFF">
              <animate attributeName="stop-color" 
                values="#00FFFF;#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#00FFFF" 
                dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#FFFF00">
              <animate attributeName="stop-color" 
                values="#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#8000FF;#FF0080;#FF4000;#FF8000;#FFFF00" 
                dur="3s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="rainbowBubble2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4000">
              <animate attributeName="stop-color" 
                values="#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#8000FF;#FF0080;#FF4000" 
                dur="3.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#80FF00">
              <animate attributeName="stop-color" 
                values="#80FF00;#00FF80;#0080FF;#4000FF;#8000FF;#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00" 
                dur="3.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#8000FF">
              <animate attributeName="stop-color" 
                values="#8000FF;#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#8000FF" 
                dur="3.5s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="rainbowBubble3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF80">
              <animate attributeName="stop-color" 
                values="#00FF80;#0080FF;#4000FF;#8000FF;#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80" 
                dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#FF0080">
              <animate attributeName="stop-color" 
                values="#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF;#4000FF;#8000FF;#FF0080" 
                dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#0080FF">
              <animate attributeName="stop-color" 
                values="#0080FF;#4000FF;#8000FF;#FF0080;#FF4000;#FF8000;#FFFF00;#80FF00;#00FF80;#0080FF" 
                dur="4s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          {/* Psychedelic gradients */}
          <radialGradient id="psychedelicBubble1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF1493">
              <animate attributeName="stop-color" 
                values="#FF1493;#00FFFF;#FF69B4;#32CD32;#FF1493" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#00FFFF">
              <animate attributeName="stop-color" 
                values="#00FFFF;#FF69B4;#32CD32;#FF1493;#00FFFF" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
          </radialGradient>

          <radialGradient id="psychedelicBubble2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#32CD32">
              <animate attributeName="stop-color" 
                values="#32CD32;#FF1493;#00FFFF;#FF69B4;#32CD32" 
                dur="2.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#FF69B4">
              <animate attributeName="stop-color" 
                values="#FF69B4;#32CD32;#FF1493;#00FFFF;#FF69B4" 
                dur="2.5s" repeatCount="indefinite"/>
            </stop>
          </radialGradient>

          {/* Electric gradients */}
          <linearGradient id="electricGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00BFFF">
              <animate attributeName="stop-color" 
                values="#00BFFF;#1E90FF;#0080FF;#00BFFF" 
                dur="1.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#1E90FF">
              <animate attributeName="stop-color" 
                values="#1E90FF;#0080FF;#00BFFF;#1E90FF" 
                dur="1.5s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="electricGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF1493">
              <animate attributeName="stop-color" 
                values="#FF1493;#FF69B4;#FF20B2;#FF1493" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#FF69B4">
              <animate attributeName="stop-color" 
                values="#FF69B4;#FF20B2;#FF1493;#FF69B4" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="electricGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#32CD32">
              <animate attributeName="stop-color" 
                values="#32CD32;#7FFF00;#ADFF2F;#32CD32" 
                dur="2.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#7FFF00">
              <animate attributeName="stop-color" 
                values="#7FFF00;#ADFF2F;#32CD32;#7FFF00" 
                dur="2.5s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="electricGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFFF">
              <animate attributeName="stop-color" 
                values="#00FFFF;#40E0D0;#00CED1;#00FFFF" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#40E0D0">
              <animate attributeName="stop-color" 
                values="#40E0D0;#00CED1;#00FFFF;#40E0D0" 
                dur="2s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="electricGradient5" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4500">
              <animate attributeName="stop-color" 
                values="#FF4500;#FF6347;#FF7F50;#FF4500" 
                dur="1.8s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#FF6347">
              <animate attributeName="stop-color" 
                values="#FF6347;#FF7F50;#FF4500;#FF6347" 
                dur="1.8s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          <linearGradient id="electricGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9400D3">
              <animate attributeName="stop-color" 
                values="#9400D3;#8A2BE2;#9932CC;#9400D3" 
                dur="2.2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#8A2BE2">
              <animate attributeName="stop-color" 
                values="#8A2BE2;#9932CC;#9400D3;#8A2BE2" 
                dur="2.2s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
        </defs>

        {/* Background spray effect */}
        <g className="spray-background" opacity="0.4">
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={i}
              cx={20 + i * 12 + Math.random() * 15}
              cy={15 + Math.random() * 90}
              r={1 + Math.random() * 4}
              fill={`url(#rainbowBubble${(i % 3) + 1})`}
              opacity={0.3 + Math.random() * 0.5}
            >
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur={`${1.5 + Math.random() * 3}s`}
                repeatCount="indefinite"
                begin={`${Math.random() * 2}s`}
              />
              <animate
                attributeName="r"
                values="1;4;1"
                dur={`${2 + Math.random() * 2}s`}
                repeatCount="indefinite"
                begin={`${Math.random() * 1}s`}
              />
            </circle>
          ))}
        </g>

        {/* GHETTO text with bubble graffiti style */}
        <g transform="translate(10, 20)">
          {/* G - bubble style with outline */}
          <g>
            {/* Shadow */}
            <path
              d="M8 12 Q8 5 15 5 L25 5 Q32 5 32 12 L32 20 L22 20 L22 15 L27 15 M32 20 Q32 28 25 28 L15 28 Q8 28 8 20 L8 12"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            {/* Main bubble */}
            <path
              d="M8 12 Q8 5 15 5 L25 5 Q32 5 32 12 L32 20 L22 20 L22 15 L27 15 M32 20 Q32 28 25 28 L15 28 Q8 28 8 20 L8 12"
              fill="url(#rainbowBubble1)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.05,1.05;1,1"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
            {/* Outline */}
            <path
              d="M8 12 Q8 5 15 5 L25 5 Q32 5 32 12 L32 20 L22 20 L22 15 L27 15 M32 20 Q32 28 25 28 L15 28 Q8 28 8 20 L8 12"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
          
          {/* H - bubble style */}
          <g>
            <path
              d="M42 5 Q45 5 45 8 L45 15 L55 15 L55 8 Q55 5 58 5 Q61 5 61 8 L61 25 Q61 28 58 28 Q55 28 55 25 L55 20 L45 20 L45 25 Q45 28 42 28 Q39 28 39 25 L39 8 Q39 5 42 5"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            <path
              d="M42 5 Q45 5 45 8 L45 15 L55 15 L55 8 Q55 5 58 5 Q61 5 61 8 L61 25 Q61 28 58 28 Q55 28 55 25 L55 20 L45 20 L45 25 Q45 28 42 28 Q39 28 39 25 L39 8 Q39 5 42 5"
              fill="url(#psychedelicBubble1)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.08,1.08;1,1"
                dur="2.5s"
                repeatCount="indefinite"
                begin="0.5s"
              />
            </path>
            <path
              d="M42 5 Q45 5 45 8 L45 15 L55 15 L55 8 Q55 5 58 5 Q61 5 61 8 L61 25 Q61 28 58 28 Q55 28 55 25 L55 20 L45 20 L45 25 Q45 28 42 28 Q39 28 39 25 L39 8 Q39 5 42 5"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
          
          {/* E - bubble style */}
          <g>
            <path
              d="M71 8 Q71 5 74 5 L88 5 Q91 5 91 8 Q91 11 88 11 L76 11 L76 15 L85 15 Q88 15 88 18 Q88 21 85 21 L76 21 L76 25 L88 25 Q91 25 91 28 Q91 31 88 31 L74 31 Q71 31 71 28 L71 8"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            <path
              d="M71 8 Q71 5 74 5 L88 5 Q91 5 91 8 Q91 11 88 11 L76 11 L76 15 L85 15 Q88 15 88 18 Q88 21 85 21 L76 21 L76 25 L88 25 Q91 25 91 28 Q91 31 88 31 L74 31 Q71 31 71 28 L71 8"
              fill="url(#electricGradient1)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.06,1.06;1,1"
                dur="2.8s"
                repeatCount="indefinite"
                begin="1s"
              />
            </path>
            <path
              d="M71 8 Q71 5 74 5 L88 5 Q91 5 91 8 Q91 11 88 11 L76 11 L76 15 L85 15 Q88 15 88 18 Q88 21 85 21 L76 21 L76 25 L88 25 Q91 25 91 28 Q91 31 88 31 L74 31 Q71 31 71 28 L71 8"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
          
          {/* T - bubble style */}
          <g>
            <path
              d="M101 8 Q101 5 104 5 L124 5 Q127 5 127 8 Q127 11 124 11 L117 11 L117 25 Q117 28 114 28 Q111 28 111 25 L111 11 L104 11 Q101 11 101 8"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            <path
              d="M101 8 Q101 5 104 5 L124 5 Q127 5 127 8 Q127 11 124 11 L117 11 L117 25 Q117 28 114 28 Q111 28 111 25 L111 11 L104 11 Q101 11 101 8"
              fill="url(#electricGradient2)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 114 16.5;3 114 16.5;-3 114 16.5;0 114 16.5"
                dur="4s"
                repeatCount="indefinite"
                begin="1.5s"
              />
            </path>
            <path
              d="M101 8 Q101 5 104 5 L124 5 Q127 5 127 8 Q127 11 124 11 L117 11 L117 25 Q117 28 114 28 Q111 28 111 25 L111 11 L104 11 Q101 11 101 8"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
          
          {/* T - second T */}
          <g>
            <path
              d="M137 8 Q137 5 140 5 L160 5 Q163 5 163 8 Q163 11 160 11 L153 11 L153 25 Q153 28 150 28 Q147 28 147 25 L147 11 L140 11 Q137 11 137 8"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            <path
              d="M137 8 Q137 5 140 5 L160 5 Q163 5 163 8 Q163 11 160 11 L153 11 L153 25 Q153 28 150 28 Q147 28 147 25 L147 11 L140 11 Q137 11 137 8"
              fill="url(#electricGradient3)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 150 16.5;-3 150 16.5;3 150 16.5;0 150 16.5"
                dur="4s"
                repeatCount="indefinite"
                begin="2s"
              />
            </path>
            <path
              d="M137 8 Q137 5 140 5 L160 5 Q163 5 163 8 Q163 11 160 11 L153 11 L153 25 Q153 28 150 28 Q147 28 147 25 L147 11 L140 11 Q137 11 137 8"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
          
          {/* O - bubble circle */}
          <g>
            <circle
              cx="185"
              cy="18"
              r="18"
              fill="#000"
              opacity="0.3"
              transform="translate(3,3)"
            />
            <circle
              cx="185"
              cy="18"
              r="18"
              fill="url(#psychedelicBubble2)"
              filter="url(#bubbleGlow)"
            >
              <animate
                attributeName="r"
                values="18;22;18"
                dur="3s"
                repeatCount="indefinite"
                begin="2.5s"
              />
            </circle>
            <circle
              cx="185"
              cy="18"
              r="10"
              fill="#000"
              opacity="0.8"
            >
              <animate
                attributeName="r"
                values="10;8;10"
                dur="3s"
                repeatCount="indefinite"
                begin="2.5s"
              />
            </circle>
            <circle
              cx="185"
              cy="18"
              r="18"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
        </g>

        {/* FINANCE text with bubble graffiti style */}
        <g transform="translate(10, 65)">
          {/* F */}
          <g>
            <path
              d="M8 8 Q8 5 11 5 L25 5 Q28 5 28 8 Q28 11 25 11 L13 11 L13 15 L22 15 Q25 15 25 18 Q25 21 22 21 L13 21 L13 28 Q13 31 10 31 Q7 31 7 28 L7 8 Q7 5 8 5"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M8 8 Q8 5 11 5 L25 5 Q28 5 28 8 Q28 11 25 11 L13 11 L13 15 L22 15 Q25 15 25 18 Q25 21 22 21 L13 21 L13 28 Q13 31 10 31 Q7 31 7 28 L7 8 Q7 5 8 5"
              fill="url(#electricGradient1)"
              filter="url(#bubbleGlow)"
            >
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M8 8 Q8 5 11 5 L25 5 Q28 5 28 8 Q28 11 25 11 L13 11 L13 15 L22 15 Q25 15 25 18 Q25 21 22 21 L13 21 L13 28 Q13 31 10 31 Q7 31 7 28 L7 8 Q7 5 8 5"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* I */}
          <g>
            <path
              d="M35 8 Q35 5 38 5 L48 5 Q51 5 51 8 Q51 11 48 11 L45 11 L45 25 L48 25 Q51 25 51 28 Q51 31 48 31 L38 31 Q35 31 35 28 Q35 25 38 25 L41 25 L41 11 L38 11 Q35 11 35 8"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M35 8 Q35 5 38 5 L48 5 Q51 5 51 8 Q51 11 48 11 L45 11 L45 25 L48 25 Q51 25 51 28 Q51 31 48 31 L38 31 Q35 31 35 28 Q35 25 38 25 L41 25 L41 11 L38 11 Q35 11 35 8"
              fill="url(#electricGradient2)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.1,1.1;1,1"
                dur="2.2s"
                repeatCount="indefinite"
                begin="0.3s"
              />
            </path>
            <path
              d="M35 8 Q35 5 38 5 L48 5 Q51 5 51 8 Q51 11 48 11 L45 11 L45 25 L48 25 Q51 25 51 28 Q51 31 48 31 L38 31 Q35 31 35 28 Q35 25 38 25 L41 25 L41 11 L38 11 Q35 11 35 8"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* N */}
          <g>
            <path
              d="M61 8 Q61 5 64 5 Q67 5 67 8 L67 20 L75 8 Q77 5 80 5 Q83 5 83 8 L83 28 Q83 31 80 31 Q77 31 77 28 L77 16 L69 28 Q67 31 64 31 Q61 31 61 28 L61 8"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M61 8 Q61 5 64 5 Q67 5 67 8 L67 20 L75 8 Q77 5 80 5 Q83 5 83 8 L83 28 Q83 31 80 31 Q77 31 77 28 L77 16 L69 28 Q67 31 64 31 Q61 31 61 28 L61 8"
              fill="url(#electricGradient3)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="skewX"
                values="0;2;-2;0"
                dur="3.5s"
                repeatCount="indefinite"
                begin="0.8s"
              />
            </path>
            <path
              d="M61 8 Q61 5 64 5 Q67 5 67 8 L67 20 L75 8 Q77 5 80 5 Q83 5 83 8 L83 28 Q83 31 80 31 Q77 31 77 28 L77 16 L69 28 Q67 31 64 31 Q61 31 61 28 L61 8"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* A */}
          <g>
            <path
              d="M93 28 Q93 31 96 31 Q99 31 99 28 L101 20 L107 20 L109 28 Q109 31 112 31 Q115 31 115 28 L108 8 Q107 5 104 5 Q101 5 100 8 L93 28 M102 15 L106 15"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M93 28 Q93 31 96 31 Q99 31 99 28 L101 20 L107 20 L109 28 Q109 31 112 31 Q115 31 115 28 L108 8 Q107 5 104 5 Q101 5 100 8 L93 28 M102 15 L106 15"
              fill="url(#electricGradient4)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.07,1.07;1,1"
                dur="2.7s"
                repeatCount="indefinite"
                begin="1.2s"
              />
            </path>
            <path
              d="M93 28 Q93 31 96 31 Q99 31 99 28 L101 20 L107 20 L109 28 Q109 31 112 31 Q115 31 115 28 L108 8 Q107 5 104 5 Q101 5 100 8 L93 28 M102 15 L106 15"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* N */}
          <g>
            <path
              d="M125 8 Q125 5 128 5 Q131 5 131 8 L131 20 L139 8 Q141 5 144 5 Q147 5 147 8 L147 28 Q147 31 144 31 Q141 31 141 28 L141 16 L133 28 Q131 31 128 31 Q125 31 125 28 L125 8"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M125 8 Q125 5 128 5 Q131 5 131 8 L131 20 L139 8 Q141 5 144 5 Q147 5 147 8 L147 28 Q147 31 144 31 Q141 31 141 28 L141 16 L133 28 Q131 31 128 31 Q125 31 125 28 L125 8"
              fill="url(#electricGradient5)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="skewX"
                values="0;-2;2;0"
                dur="3.2s"
                repeatCount="indefinite"
                begin="1.8s"
              />
            </path>
            <path
              d="M125 8 Q125 5 128 5 Q131 5 131 8 L131 20 L139 8 Q141 5 144 5 Q147 5 147 8 L147 28 Q147 31 144 31 Q141 31 141 28 L141 16 L133 28 Q131 31 128 31 Q125 31 125 28 L125 8"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* C */}
          <g>
            <path
              d="M167 12 Q167 5 174 5 L182 5 Q185 5 185 8 Q185 11 182 11 L174 11 Q171 11 171 14 L171 22 Q171 25 174 25 L182 25 Q185 25 185 28 Q185 31 182 31 L174 31 Q167 31 167 24 L167 12"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M167 12 Q167 5 174 5 L182 5 Q185 5 185 8 Q185 11 182 11 L174 11 Q171 11 171 14 L171 22 Q171 25 174 25 L182 25 Q185 25 185 28 Q185 31 182 31 L174 31 Q167 31 167 24 L167 12"
              fill="url(#electricGradient6)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.05,1.05;1,1"
                dur="2.3s"
                repeatCount="indefinite"
                begin="2.2s"
              />
            </path>
            <path
              d="M167 12 Q167 5 174 5 L182 5 Q185 5 185 8 Q185 11 182 11 L174 11 Q171 11 171 14 L171 22 Q171 25 174 25 L182 25 Q185 25 185 28 Q185 31 182 31 L174 31 Q167 31 167 24 L167 12"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
          
          {/* E */}
          <g>
            <path
              d="M195 8 Q195 5 198 5 L212 5 Q215 5 215 8 Q215 11 212 11 L200 11 L200 15 L209 15 Q212 15 212 18 Q212 21 209 21 L200 21 L200 25 L212 25 Q215 25 215 28 Q215 31 212 31 L198 31 Q195 31 195 28 L195 8"
              fill="#000"
              opacity="0.3"
              transform="translate(2,2)"
            />
            <path
              d="M195 8 Q195 5 198 5 L212 5 Q215 5 215 8 Q215 11 212 11 L200 11 L200 15 L209 15 Q212 15 212 18 Q212 21 209 21 L200 21 L200 25 L212 25 Q215 25 215 28 Q215 31 212 31 L198 31 Q195 31 195 28 L195 8"
              fill="url(#rainbowBubble3)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1;1.04,1.04;1,1"
                dur="2.6s"
                repeatCount="indefinite"
                begin="2.8s"
              />
            </path>
            <path
              d="M195 8 Q195 5 198 5 L212 5 Q215 5 215 8 Q215 11 212 11 L200 11 L200 15 L209 15 Q212 15 212 18 Q212 21 209 21 L200 21 L200 25 L212 25 Q215 25 215 28 Q215 31 212 31 L198 31 Q195 31 195 28 L195 8"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>
        </g>

        {/* Animated graffiti decorations */}
        <g className="graffiti-decorations">
          {/* Colorful stars */}
          <g>
            <path
              d="M230 15 L232 20 L237 20 L233 23 L235 28 L230 25 L225 28 L227 23 L223 20 L228 20 Z"
              fill="url(#rainbowBubble1)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 230 21;360 230 21"
                dur="6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          
          <g>
            <path
              d="M250 85 L251.5 88 L255 88 L252.5 90 L254 93 L250 91 L246 93 L247.5 90 L245 88 L248.5 88 Z"
              fill="url(#psychedelicBubble1)"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="360 250 89;0 250 89"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          
          {/* Colorful lightning bolt */}
          <path
            d="M270 8 L265 23 L270 23 L265 38 L275 23 L270 23 L275 8 Z"
            fill="url(#electricGradient1)"
            filter="url(#bubbleGlow)"
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="0.3s"
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1;1.3,1.3;1,1"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Colorful dollar sign */}
          <g>
            <circle
              cx="295"
              cy="25"
              r="12"
              fill="url(#psychedelicBubble2)"
              filter="url(#bubbleGlow)"
            >
              <animate
                attributeName="r"
                values="12;15;12"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <path
              d="M290 20 L300 20 M295 15 L295 35 M290 25 L300 25 M290 30 L300 30"
              fill="none"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            >
              <animate
                attributeName="stroke-width"
                values="3;4;3"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          
          {/* Animated colorful spray paint dots */}
          <g className="spray-dots">
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={320 + (i % 6) * 8}
                cy={20 + Math.floor(i / 6) * 10}
                r={2 + Math.random() * 3}
                fill={`url(#rainbowBubble${(i % 3) + 1})`}
                opacity={0.7}
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur={`${1 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  begin={`${Math.random() * 3}s`}
                />
                <animate
                  attributeName="r"
                  values="2;5;2"
                  dur={`${2 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  begin={`${Math.random() * 2}s`}
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0;0,-5;0,0"
                  dur={`${3 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  begin={`${Math.random() * 2}s`}
                />
              </circle>
            ))}
          </g>
          
          {/* Colorful graffiti swirls */}
          <path
            d="M360 25 Q365 20 370 25 Q365 30 360 25 Q355 20 360 15 Q365 10 370 15"
            fill="none"
            stroke="url(#rainbowBubble2)"
            strokeWidth="4"
            opacity="0.8"
            filter="url(#bubbleGlow)"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0,80;80,0;0,80"
              dur="4s"
              repeatCount="indefinite"
              begin="1s"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 365 22;360 365 22"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Colorful triangles */}
          <path
            d="M355 80 L365 75 L360 85 Z"
            fill="url(#electricGradient2)"
            opacity="0.9"
            filter="url(#bubbleGlow)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 360 80;120 360 80;240 360 80;360 360 80"
              dur="5s"
              repeatCount="indefinite"
            />
          </path>
          
          <path
            d="M375 85 L380 75 L385 85 Z"
            fill="url(#electricGradient3)"
            opacity="0.9"
            filter="url(#bubbleGlow)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="360 380 80;240 380 80;120 380 80;0 380 80"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Animated colorful underline with wave effect */}
        <path
          d="M10 105 Q100 100 200 105 Q300 110 390 105"
          fill="none"
          stroke="url(#rainbowBubble1)"
          strokeWidth="4"
          opacity="0.9"
          filter="url(#bubbleGlow)"
        >
          <animate
            attributeName="d"
            values="M10 105 Q100 100 200 105 Q300 110 390 105;
                    M10 105 Q100 110 200 100 Q300 105 390 110;
                    M10 105 Q100 100 200 105 Q300 110 390 105"
            dur="5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dasharray"
            values="0,500;500,0;0,500"
            dur="8s"
            repeatCount="indefinite"
          />
        </path>
        
        {/* Floating colorful bubbles */}
        <g className="floating-bubbles">
          {Array.from({ length: 12 }, (_, i) => (
            <circle
              key={i}
              cx={40 + i * 30}
              cy={60}
              r="3"
              fill={`url(#rainbowBubble${(i % 3) + 1})`}
              opacity="0.7"
              filter="url(#bubbleGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0;0,-25;0,0`}
                dur={`${4 + Math.random() * 3}s`}
                repeatCount="indefinite"
                begin={`${Math.random() * 4}s`}
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                dur={`${4 + Math.random() * 3}s`}
                repeatCount="indefinite"
                begin={`${Math.random() * 4}s`}
              />
              <animate
                attributeName="r"
                values="3;6;3"
                dur={`${3 + Math.random() * 2}s`}
                repeatCount="indefinite"
                begin={`${Math.random() * 2}s`}
              />
            </circle>
          ))}
        </g>

        {/* Psychedelic background waves */}
        <g className="background-waves" opacity="0.2">
          <path
            d="M0 60 Q100 50 200 60 Q300 70 400 60 L400 120 L0 120 Z"
            fill="url(#rainbowBubble1)"
          >
            <animate
              attributeName="d"
              values="M0 60 Q100 50 200 60 Q300 70 400 60 L400 120 L0 120 Z;
                      M0 60 Q100 70 200 50 Q300 60 400 70 L400 120 L0 120 Z;
                      M0 60 Q100 50 200 60 Q300 70 400 60 L400 120 L0 120 Z"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 80 Q100 70 200 80 Q300 90 400 80 L400 120 L0 120 Z"
            fill="url(#psychedelicBubble1)"
          >
            <animate
              attributeName="d"
              values="M0 80 Q100 70 200 80 Q300 90 400 80 L400 120 L0 120 Z;
                      M0 80 Q100 90 200 70 Q300 80 400 90 L400 120 L0 120 Z;
                      M0 80 Q100 70 200 80 Q300 90 400 80 L400 120 L0 120 Z"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>
  );
}