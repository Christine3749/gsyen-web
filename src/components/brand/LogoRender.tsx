import React, { ReactNode } from 'react';
import { LogoConfig } from '../../types';
import { iconMap, logoFallbackIcon } from './logoAssets';

interface LogoIconProps {
  config: LogoConfig;
  /** 图标颜色（class 或 lucide className） */
  colorClass: string;
  /** 覆盖尺寸，不传则用 config.iconSize */
  size?: number;
}

/** 画布中按当前配置渲染选中的标识图标（含旋转） */
export function LogoIcon({ config, colorClass, size }: LogoIconProps) {
  const IconComp = iconMap[config.iconName] || logoFallbackIcon;
  const finalSize = size !== undefined ? size : config.iconSize;
  return (
    <div
      style={{ transform: `rotate(${config.iconRotation}deg)` }}
      className="transition-all duration-300 transform ease-out flex items-center justify-center"
    >
      <IconComp size={finalSize} strokeWidth={config.iconStrokeWidth} className={colorClass} />
    </div>
  );
}

interface LogoBadgeProps {
  config: LogoConfig;
  /** 徽章描边色 */
  paletteSecondary: string;
  children: ReactNode;
  customBg?: string;
}

const badgeClasses: Record<string, string> = {
  circle: 'rounded-full border-3 px-12 py-12 aspect-square flex items-center justify-center transition-all duration-300',
  square: 'rounded-3xl border-3 p-10 aspect-square flex items-center justify-center transition-all duration-300',
  shield: 'border-3 p-10 aspect-square flex items-center justify-center transition-all duration-300 [clip-path:polygon(0%_0%,100%_0%,100%_60%,50%_100%,0%_60%)]',
  hexagon: 'border-3 p-10 aspect-square flex items-center justify-center transition-all duration-300 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]',
  'outline-circle': 'rounded-full border-1 border-dashed px-10 py-10 aspect-square flex items-center justify-center transition-all duration-300',
};

/** 给标识图标套上徽章外框（none 时仅居中包裹） */
export function LogoBadge({ config, paletteSecondary, children, customBg }: LogoBadgeProps) {
  if (config.badgeShape === 'none') {
    return <div className="p-4 flex items-center justify-center">{children}</div>;
  }

  const appliedBg = customBg || (config.contrastMode ? 'bg-transparent' : '');
  const paletteBorder = config.contrastMode ? 'border-amber-400' : 'border-current';

  return (
    <div className="flex items-center justify-center p-3">
      <div
        className={`${badgeClasses[config.badgeShape]} ${paletteBorder} ${appliedBg}`}
        style={{
          borderColor: paletteSecondary,
          minWidth: `${config.iconSize * 1.9}px`,
          minHeight: `${config.iconSize * 1.9}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
