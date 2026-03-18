interface GraffitiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GraffitiLogo({ size = 'md', className = '' }: GraffitiLogoProps) {
  const sizeConfig = {
    xs: {
      fontSize: 'text-xl',
      spacing: 'space-x-0.5',
      height: 'h-8',
    },
    sm: {
      fontSize: 'text-3xl',
      spacing: 'space-x-1',
      height: 'h-12',
    },
    md: {
      fontSize: 'text-5xl',
      spacing: 'space-x-1.5',
      height: 'h-20',
    },
    lg: {
      fontSize: 'text-7xl',
      spacing: 'space-x-2',
      height: 'h-28',
    },
    xl: {
      fontSize: 'text-8xl',
      spacing: 'space-x-3',
      height: 'h-36',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`${className} relative inline-flex flex-col items-center justify-center ${config.height}`}>
      {/* GHETTO text */}
      <div className={`${config.fontSize} font-bold tracking-tight select-none`}
        style={{
          fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
          color: '#000000',
          textShadow: '2px 2px 0px rgba(255, 255, 255, 0.9)',
          letterSpacing: '-0.02em',
          fontWeight: 900,
          WebkitTextStroke: '0.5px #000',
        }}
      >
        GHETTO
      </div>

      {/* FINANCE text */}
      <div className={`${config.fontSize} font-bold tracking-tight select-none -mt-2`}
        style={{
          fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
          color: '#000000',
          textShadow: '2px 2px 0px rgba(255, 255, 255, 0.9)',
          letterSpacing: '-0.02em',
          fontWeight: 900,
          WebkitTextStroke: '0.5px #000',
        }}
      >
        FINANCE
      </div>
    </div>
  );
}
