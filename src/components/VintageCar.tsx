import { useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

interface VintageCarProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  tone?: 'ink' | 'light';
}

const VintageCar = ({ size = 24, className, style, tone = 'ink' }: VintageCarProps) => {
  const [kicking, setKicking] = useState(false);
  const [fallback, setFallback] = useState(false);
  const isLight = tone === 'light';
  const svgSrc = isLight ? '/brand/gsyen-logo-car-light.svg' : '/brand/gsyen-logo-car-ink.svg';
  const pngSrc = isLight ? '/brand/gsyen-logo-car-light.png' : '/brand/gsyen-logo-car-ink.png';
  const logoRatio = isLight ? 360 / 272 : 489 / 304;

  const handleClick = (_event: MouseEvent<HTMLImageElement>) => {
    setKicking(false);
    requestAnimationFrame(() => setKicking(true));
  };

  return (
    <img
      src={fallback ? pngSrc : svgSrc}
      alt="GSYEN vintage frontier automobile"
      className={`${className ?? ''} gsyen-vintage-car ${kicking ? 'is-kicking' : ''}`}
      width={Math.round(size * logoRatio)}
      height={size}
      draggable={false}
      onClick={handleClick}
      onError={() => setFallback(true)}
      onAnimationEnd={() => setKicking(false)}
      style={{
        display: 'block',
        width: Math.round(size * logoRatio),
        height: size,
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
    />
  );
};

export default VintageCar;
