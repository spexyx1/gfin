interface GraffitiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'header' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<GraffitiLogoProps['size']>, string> = {
  xs: 'h-6',
  sm: 'h-8',
  header: 'h-10',
  md: 'h-12',
  lg: 'h-16',
};

export function GraffitiLogo({ className = '', size = 'header' }: GraffitiLogoProps) {
  return (
    <img
      src="/icons/ghetto_finance_bubble_neon_transparent_cropped.png"
      alt="GHETTO FINANCE"
      className={`w-auto object-contain ${sizeClasses[size]} ${className}`}
    />
  );
}
