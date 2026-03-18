interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const sizeClasses = {
    xs: 'w-32 h-12',
    sm: 'w-48 h-16',
    md: 'w-64 h-24',
    lg: 'w-96 h-32',
    xl: 'w-[32rem] h-40'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 900 200"
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

          <radialGradient id="sprayEffect3">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.7">
              <animate attributeName="stopOpacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>

          {/* Spray paint particle effect */}
          <radialGradient id="sprayParticle">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ff00ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff00ff" stopOpacity="0" />
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

        {/* Animated spray paint can effect */}
        <g className="spray-can-effect">
          {/* Spray particles emanating from top left */}
          <circle cx="15" cy="30" r="2" fill="url(#sprayParticle)" opacity="0.6">
            <animate attributeName="cx" values="15;35;15" dur="3s" repeatCount="indefinite" />
            <animate attributeName="cy" values="30;50;30" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="2;1;2" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="25" cy="25" r="2.5" fill="url(#sprayParticle)" opacity="0.5">
            <animate attributeName="cx" values="25;50;25" dur="2.8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="25;45;25" dur="2.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.5;1.5;2.5" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="35" r="1.8" fill="url(#sprayParticle)" opacity="0.7">
            <animate attributeName="cx" values="30;45;30" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="35;55;35" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.8;0.8;1.8" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="40" r="2.2" fill="url(#sprayParticle)" opacity="0.6">
            <animate attributeName="cx" values="20;40;20" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="40;60;40" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.2;1;2.2" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* GHETTO text with graffiti wildstyle */}
        <g className="ghetto-text" fontFamily="'Brush Script MT', 'Comic Sans MS', cursive" fontWeight="900" fontSize="76" letterSpacing="-2" fontStyle="italic">

          {/* G - Hot Pink/Magenta - with 3D effect */}
          <text x="20" y="80" fill="#ff1493" stroke="#ff69b4" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-10)">
            G
            <animate attributeName="fill" values="#ff1493;#ff69b4;#ff1493" dur="2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2s" repeatCount="indefinite" additive="sum" />
          </text>
          {/* G shadow */}
          <text x="22" y="82" fill="#990044" stroke="#660033" strokeWidth="2" opacity="0.5" transform="skewX(-10)">
            G
          </text>

          {/* H - Electric Cyan */}
          <text x="88" y="80" fill="#00ffff" stroke="#00bfff" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-8)">
            H
            <animate attributeName="fill" values="#00ffff;#00bfff;#00ffff" dur="2.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.2s" repeatCount="indefinite" begin="0.2s" additive="sum" />
          </text>
          <text x="90" y="82" fill="#006666" stroke="#004444" strokeWidth="2" opacity="0.5" transform="skewX(-8)">
            H
          </text>

          {/* E - Lime Green */}
          <text x="158" y="80" fill="#00ff00" stroke="#32cd32" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-12)">
            E
            <animate attributeName="fill" values="#00ff00;#32cd32;#00ff00" dur="2.4s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.4s" repeatCount="indefinite" begin="0.4s" additive="sum" />
          </text>
          <text x="160" y="82" fill="#006600" stroke="#004400" strokeWidth="2" opacity="0.5" transform="skewX(-12)">
            E
          </text>

          {/* T - Golden Yellow */}
          <text x="216" y="80" fill="#ffd700" stroke="#ffed4e" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-10)">
            T
            <animate attributeName="fill" values="#ffd700;#ffed4e;#ffd700" dur="2.6s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.6s" repeatCount="indefinite" begin="0.6s" additive="sum" />
          </text>
          <text x="218" y="82" fill="#886600" stroke="#664400" strokeWidth="2" opacity="0.5" transform="skewX(-10)">
            T
          </text>

          {/* T - Orange */}
          <text x="268" y="80" fill="#ff6600" stroke="#ff8c00" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-9)">
            T
            <animate attributeName="fill" values="#ff6600;#ff8c00;#ff6600" dur="2.8s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="2.8s" repeatCount="indefinite" begin="0.8s" additive="sum" />
          </text>
          <text x="270" y="82" fill="#884400" stroke="#662200" strokeWidth="2" opacity="0.5" transform="skewX(-9)">
            T
          </text>

          {/* O - Purple */}
          <text x="320" y="80" fill="#9d00ff" stroke="#bf00ff" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-11)">
            O
            <animate attributeName="fill" values="#9d00ff;#bf00ff;#9d00ff" dur="3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" begin="1s" additive="sum" />
          </text>
          <text x="322" y="82" fill="#550088" stroke="#330066" strokeWidth="2" opacity="0.5" transform="skewX(-11)">
            O
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

        {/* FINANCE text with graffiti wildstyle */}
        <g className="finance-text" fontFamily="'Brush Script MT', 'Comic Sans MS', cursive" fontWeight="900" fontSize="76" letterSpacing="-2" fontStyle="italic">

          {/* F - Neon Blue */}
          <text x="20" y="160" fill="#0080ff" stroke="#00a0ff" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-10)">
            F
            <animate attributeName="fill" values="#0080ff;#00a0ff;#0080ff" dur="2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2s" repeatCount="indefinite" additive="sum" />
          </text>
          <text x="22" y="162" fill="#004488" stroke="#003366" strokeWidth="2" opacity="0.5" transform="skewX(-10)">
            F
          </text>

          {/* I - Hot Pink */}
          <text x="73" y="160" fill="#ff1493" stroke="#ff69b4" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-9)">
            I
            <animate attributeName="fill" values="#ff1493;#ff69b4;#ff1493" dur="2.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.2s" repeatCount="indefinite" begin="0.2s" additive="sum" />
          </text>
          <text x="75" y="162" fill="#990044" stroke="#660033" strokeWidth="2" opacity="0.5" transform="skewX(-9)">
            I
          </text>

          {/* N - Bright Red */}
          <text x="105" y="160" fill="#ff0000" stroke="#ff3333" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-11)">
            N
            <animate attributeName="fill" values="#ff0000;#ff3333;#ff0000" dur="2.4s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.4s" repeatCount="indefinite" begin="0.4s" additive="sum" />
          </text>
          <text x="107" y="162" fill="#880000" stroke="#550000" strokeWidth="2" opacity="0.5" transform="skewX(-11)">
            N
          </text>

          {/* A - Aqua */}
          <text x="173" y="160" fill="#00ffaa" stroke="#00ffcc" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-8)">
            A
            <animate attributeName="fill" values="#00ffaa;#00ffcc;#00ffaa" dur="2.6s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.6s" repeatCount="indefinite" begin="0.6s" additive="sum" />
          </text>
          <text x="175" y="162" fill="#008866" stroke="#006644" strokeWidth="2" opacity="0.5" transform="skewX(-8)">
            A
          </text>

          {/* N - Electric Yellow */}
          <text x="241" y="160" fill="#ffff00" stroke="#ffff66" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-12)">
            N
            <animate attributeName="fill" values="#ffff00;#ffff66;#ffff00" dur="2.8s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="2.8s" repeatCount="indefinite" begin="0.8s" additive="sum" />
          </text>
          <text x="243" y="162" fill="#888800" stroke="#666600" strokeWidth="2" opacity="0.5" transform="skewX(-12)">
            N
          </text>

          {/* C - Coral */}
          <text x="309" y="160" fill="#ff7f50" stroke="#ff9966" strokeWidth="3" filter="url(#neonGlow2)" transform="skewX(-10)">
            C
            <animate attributeName="fill" values="#ff7f50;#ff9966;#ff7f50" dur="3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="3s" repeatCount="indefinite" begin="1s" additive="sum" />
          </text>
          <text x="311" y="162" fill="#884422" stroke="#663311" strokeWidth="2" opacity="0.5" transform="skewX(-10)">
            C
          </text>

          {/* E - Violet */}
          <text x="377" y="160" fill="#ee82ee" stroke="#ff99ff" strokeWidth="3" filter="url(#neonGlow1)" transform="skewX(-9)">
            E
            <animate attributeName="fill" values="#ee82ee;#ff99ff;#ee82ee" dur="3.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-2; 0,0" dur="3.2s" repeatCount="indefinite" begin="1.2s" additive="sum" />
          </text>
          <text x="379" y="162" fill="#884488" stroke="#663366" strokeWidth="2" opacity="0.5" transform="skewX(-9)">
            E
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

        {/* GRAFFITI DESIGNS ON THE RIGHT SIDE */}

        {/* Wildstyle arrows and designs */}
        <g className="right-side-graffiti" opacity="0.8">

          {/* Arrow design 1 - Top right */}
          <g transform="translate(550, 40)">
            <path d="M0,0 L30,10 L25,20 L40,30 L30,35 L35,50 L20,40 L15,50 L5,35 Z"
                  fill="#ff1493" stroke="#ff69b4" strokeWidth="2" filter="url(#neonGlow1)">
              <animate attributeName="fill" values="#ff1493;#ff69b4;#ff1493" dur="3s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 20 25; 5 20 25; 0 20 25" dur="4s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Arrow design 2 - Middle right */}
          <g transform="translate(580, 90)">
            <path d="M0,10 L20,0 L25,15 L40,10 L35,25 L50,30 L30,35 L25,50 L15,35 L5,40 Z"
                  fill="#00ffff" stroke="#00bfff" strokeWidth="2" filter="url(#neonGlow2)">
              <animate attributeName="fill" values="#00ffff;#00bfff;#00ffff" dur="3.5s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 25 25; -5 25 25; 0 25 25" dur="5s" repeatCount="indefinite" />
            </path>
          </g>

          {/* 3D block letter tag */}
          <g transform="translate(490, 45)">
            <text x="0" y="0" fontFamily="Impact, Arial Black" fontSize="32" fontWeight="900"
                  fill="#ffd700" stroke="#ffed4e" strokeWidth="2" filter="url(#neonGlow1)" transform="rotate(-15)">
              $
              <animate attributeName="fill" values="#ffd700;#ffed4e;#ffd700" dur="2.5s" repeatCount="indefinite" />
            </text>
            {/* 3D shadow layers */}
            <text x="-2" y="-2" fontFamily="Impact, Arial Black" fontSize="32" fontWeight="900"
                  fill="#886600" stroke="#664400" strokeWidth="1" opacity="0.6" transform="rotate(-15)">
              $
            </text>
          </g>

          {/* Spray cap circle with crown */}
          <g transform="translate(650, 80)">
            <circle cx="0" cy="0" r="25" fill="none" stroke="#ff6600" strokeWidth="3" opacity="0.8">
              <animate attributeName="r" values="25;28;25" dur="2s" repeatCount="indefinite" />
              <animate attributeName="stroke" values="#ff6600;#ff8c00;#ff6600" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Crown inside */}
            <path d="M-10,-5 L-10,-15 L-5,-10 L0,-15 L5,-10 L10,-15 L10,-5 Z"
                  fill="#ff6600" stroke="#ff8c00" strokeWidth="1.5">
              <animate attributeName="fill" values="#ff6600;#ff8c00;#ff6600" dur="2s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Lightning bolt */}
          <g transform="translate(520, 120)">
            <path d="M0,0 L-8,25 L0,25 L-10,50 L15,20 L5,20 L12,0 Z"
                  fill="#00ff00" stroke="#32cd32" strokeWidth="2" filter="url(#neonGlow1)">
              <animate attributeName="fill" values="#00ff00;#32cd32;#00ff00" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.7;1" dur="0.5s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Spray paint can silhouette */}
          <g transform="translate(720, 100)">
            <rect x="-8" y="0" width="16" height="35" rx="2" fill="#9d00ff" stroke="#bf00ff" strokeWidth="2" opacity="0.8">
              <animate attributeName="fill" values="#9d00ff;#bf00ff;#9d00ff" dur="3s" repeatCount="indefinite" />
            </rect>
            <ellipse cx="0" cy="-3" rx="10" ry="5" fill="#9d00ff" stroke="#bf00ff" strokeWidth="2" opacity="0.8" />
            <rect x="-4" y="-8" width="8" height="5" fill="#bf00ff" opacity="0.8" />
            {/* Spray coming out */}
            <g opacity="0.6">
              <circle cx="0" cy="-10" r="2" fill="#ffffff">
                <animate attributeName="cy" values="-10;-25;-10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values="2;0.5;2" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="5" cy="-12" r="1.5" fill="#ffffff">
                <animate attributeName="cy" values="-12;-28;-12" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.5;0.5;1.5" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="-5" cy="-12" r="1.5" fill="#ffffff">
                <animate attributeName="cy" values="-12;-27;-12" dur="2.3s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.5;0.5;1.5" dur="2.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="2.3s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>

          {/* Throw-up bubble letters */}
          <g transform="translate(620, 140)">
            <text x="0" y="0" fontFamily="'Comic Sans MS', cursive" fontSize="28" fontWeight="900"
                  fill="#ff0000" stroke="#ff3333" strokeWidth="2" filter="url(#neonGlow2)" fontStyle="italic">
              GF
              <animate attributeName="fill" values="#ff0000;#ff3333;#ff0000" dur="2.8s" repeatCount="indefinite" />
            </text>
            <text x="2" y="2" fontFamily="'Comic Sans MS', cursive" fontSize="28" fontWeight="900"
                  fill="#880000" stroke="#550000" strokeWidth="1" opacity="0.5" fontStyle="italic">
              GF
            </text>
          </g>

          {/* Star burst design */}
          <g transform="translate(760, 140)">
            <path d="M0,-15 L3,-5 L13,-5 L5,2 L8,12 L0,6 L-8,12 L-5,2 L-13,-5 L-3,-5 Z"
                  fill="#00ffaa" stroke="#00ffcc" strokeWidth="2" filter="url(#neonGlow1)">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#00ffaa;#00ffcc;#00ffaa" dur="2s" repeatCount="indefinite" />
            </path>
            {/* Inner star */}
            <path d="M0,-8 L2,-3 L7,-3 L3,1 L5,6 L0,3 L-5,6 L-3,1 L-7,-3 L-2,-3 Z"
                  fill="#ffffff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Dripping paint effect on right */}
          <g transform="translate(700, 50)" opacity="0.7">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#ff69b4" strokeWidth="3" strokeLinecap="round">
              <animate attributeName="y2" values="20;25;20" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="10" y1="5" x2="10" y2="30" stroke="#00ffff" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="y2" values="30;35;30" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="20" y1="0" x2="20" y2="15" stroke="#ffd700" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="y2" values="15;20;15" dur="2.8s" repeatCount="indefinite" />
            </line>
          </g>

          {/* Tag signature style */}
          <g transform="translate(560, 170)">
            <path d="M0,0 Q10,-5 20,0 T40,0 M20,0 Q25,10 20,20"
                  fill="none" stroke="#ffff00" strokeWidth="3" strokeLinecap="round" filter="url(#neonGlow2)">
              <animate attributeName="stroke" values="#ffff00;#ffff66;#ffff00" dur="2.5s" repeatCount="indefinite" />
            </path>
          </g>

          {/* 3D cube element */}
          <g transform="translate(800, 80)">
            <path d="M0,0 L20,10 L20,30 L0,20 Z" fill="#ff7f50" stroke="#ff9966" strokeWidth="2" opacity="0.8">
              <animate attributeName="fill" values="#ff7f50;#ff9966;#ff7f50" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M0,0 L20,10 L40,0 L20,-10 Z" fill="#ee82ee" stroke="#ff99ff" strokeWidth="2" opacity="0.8">
              <animate attributeName="fill" values="#ee82ee;#ff99ff;#ee82ee" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M20,10 L40,0 L40,20 L20,30 Z" fill="#0080ff" stroke="#00a0ff" strokeWidth="2" opacity="0.8">
              <animate attributeName="fill" values="#0080ff;#00a0ff;#0080ff" dur="3s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Floating graffiti bubbles */}
          <g>
            <circle cx="670" cy="60" r="6" fill="none" stroke="#ff00ff" strokeWidth="2" opacity="0.6">
              <animate attributeName="cy" values="60;50;60" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="750" cy="120" r="8" fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.6">
              <animate attributeName="cy" values="120;110;120" dur="4s" repeatCount="indefinite" />
              <animate attributeName="r" values="8;10;8" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Wildstyle connection lines */}
          <g opacity="0.4">
            <path d="M490,80 Q550,60 620,80" stroke="#ff1493" strokeWidth="2" fill="none" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;10;0" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M550,120 Q620,100 700,120" stroke="#00ffff" strokeWidth="2" fill="none" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;10;0" dur="2.5s" repeatCount="indefinite" />
            </path>
          </g>

        </g>
      </svg>
    </div>
  );
}
