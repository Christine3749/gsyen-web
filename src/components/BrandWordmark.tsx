import type { CSSProperties } from 'react';
import { publicAsset } from '../utils/publicAsset';

interface BrandWordmarkProps {
  tone?: 'ink' | 'light';
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const WORDMARK_RATIO = 760 / 136;

export default function BrandWordmark({ tone = 'ink', height = 32, className, style }: BrandWordmarkProps) {
  const src = tone === 'light'
    ? publicAsset('brand/gsyen-wordmark-light.svg')
    : publicAsset('brand/gsyen-wordmark-primary.svg');

  return (
    <img
      src={src}
      alt="疆域 GSYEN"
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
