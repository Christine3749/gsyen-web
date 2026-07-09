import type { CSSProperties } from 'react';

interface BrandWordmarkProps {
  tone?: 'ink' | 'light';
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const WORDMARK_RATIO = 760 / 136;

export default function BrandWordmark({ tone = 'ink', height = 32, className, style }: BrandWordmarkProps) {
  const assetBase = import.meta.env.BASE_URL;
  const src = assetBase + (tone === 'light' ? 'brand/gsyen-wordmark-light.svg' : 'brand/gsyen-wordmark-primary.svg');

  return (
    <img
      src={src}
      alt="GSYEN"
      className={className}
      draggable={false}
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      style={{
        display: 'block',
        width: Math.round(height * WORDMARK_RATIO),
        height,
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
    />
  );
}
