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

  const handleClick = (_event: MouseEvent<HTMLImageElement>) => {
    setKicking(false);
    requestAnimationFrame(() => setKicking(true));
  };

  return (
    <img
      src={tone === 'light' ? '/brand/gsyen-frontier-car-left-white.png' : '/brand/gsyen-frontier-car-left-transparent.png'}
      alt="GSYEN vintage frontier automobile"
      className={`${className ?? ''} gsyen-vintage-car ${kicking ? 'is-kicking' : ''}`}
      width={Math.round(size * 1.42)}
      height={size}
      draggable={false}
      onClick={handleClick}
      onAnimationEnd={() => setKicking(false)}
      style={{
        display: 'block',
        width: Math.round(size * 1.42),
        height: size,
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
    />
  );
};

export default VintageCar;
