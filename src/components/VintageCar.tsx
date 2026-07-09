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
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const isLight = tone === 'light';
  const assetBase = import.meta.env.BASE_URL;
  const transparentSrc = isLight
    ? `${assetBase}brand/gsyen-logo-car-light-transparent.png`
    : `${assetBase}brand/gsyen-logo-car-ink-transparent.png`;
  const pngSrc = isLight ? `${assetBase}brand/gsyen-logo-car-light.png` : `${assetBase}brand/gsyen-logo-car-ink.png`;
  const svgSrc = isLight ? `${assetBase}brand/gsyen-logo-car-light.svg` : `${assetBase}brand/gsyen-logo-car-ink.svg`;
  const src = fallbackLevel === 0 ? transparentSrc : fallbackLevel === 1 ? pngSrc : svgSrc;
  const logoRatio = isLight ? 360 / 272 : 489 / 304;

  const handleClick = (_event: MouseEvent<HTMLImageElement>) => {
    setKicking(false);
    requestAnimationFrame(() => setKicking(true));
  };

  return (
    <img
      src={src}
      alt="GSYEN vintage frontier automobile"
      className={`${className ?? ''} gsyen-vintage-car ${kicking ? 'is-kicking' : ''}`}
      width={Math.round(size * logoRatio)}
      height={size}
      draggable={false}
      onClick={handleClick}
      onError={() => setFallbackLevel(level => Math.min(level + 1, 2))}
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
