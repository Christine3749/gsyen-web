/**
 * buildSvgMarkup — 把当前 LogoConfig + 解析后的调色板颜色，渲染成可复制/导出的 <svg> 源码串。
 * 从 App 组件的 svgMarkupString useMemo 抽出为纯函数（同样的逻辑，无副作用）。
 */
import { LogoConfig } from '../../types';
import { PaletteColors } from './palette';
import { getIconPaths } from './iconPaths';

export function buildSvgMarkup(config: LogoConfig, colors: PaletteColors): string {
  const { primary: colorP, secondary: colorS, bg: paletteBg, text: colorText, tagline: colorTagline } = colors;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%" style="background-color: ${paletteBg};">
  <style>
    .brand-title {
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 700;
      fill: ${colorText};
      text-anchor: middle;
    }
    .brand-tagline {
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.15em;
      fill: ${colorTagline};
      text-anchor: middle;
    }
    .logo-icon {
      stroke: ${colorP};
      stroke-width: ${config.iconStrokeWidth};
      fill: none;
      transform-origin: center;
    }
  </style>

  <!-- Background Grid Decorator if desired -->
  ${config.gridOverlay ? `
  <g opacity="0.1" stroke="${colorP}" stroke-width="0.5">
    <line x1="50" y1="0" x2="50" y2="400" />
    <line x1="150" y1="0" x2="150" y2="400" />
    <line x1="250" y1="0" x2="250" y2="400" />
    <line x1="350" y1="0" x2="350" y2="400" />
    <line x1="450" y1="0" x2="450" y2="400" />
    <line x1="0" y1="100" x2="500" y2="100" />
    <line x1="0" y1="200" x2="500" y2="200" />
    <line x1="0" y1="300" x2="500" y2="300" />
  </g>` : ''}

  <!-- Badge / Framing element -->
  ${config.badgeShape !== 'none' ? `
  <g transform="translate(250, 160)" fill="none" stroke="${colorS}" stroke-width="2" opacity="0.8">
    ${config.badgeShape === 'circle' ? `<circle r="75" fill="${paletteBg}" stroke-width="3" />` : ''}
    ${config.badgeShape === 'square' ? `<rect x="-65" y="-65" width="130" height="130" rx="12" fill="${paletteBg}" />` : ''}
    ${config.badgeShape === 'hexagon' ? `<polygon points="0,-75 65,-37.5 65,37.5 0,75 -65,37.5 -65,-37.5" fill="${paletteBg}" />` : ''}
    ${config.badgeShape === 'shield' ? `<path d="M-60,-65 L60,-65 C60,-65 60,10 0,65 C-60,10 -60,-65 -60,-65 Z" fill="${paletteBg}" />` : ''}
  </g>` : ''}

  <!-- Core Icon -->
  <g transform="translate(250, 160)" stroke="${colorP}" stroke-width="${config.iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <g transform="rotate(${config.iconRotation}) scale(${config.iconSize / 24})">
      <g transform="translate(-12, -12)">
        ${getIconPaths(config.iconName)}
      </g>
    </g>
  </g>

  <!-- Typography -->
  <text x="250" y="275" font-size="28" letter-spacing="1.5" class="brand-title">${config.brandName}</text>
  <text x="250" y="305" class="brand-tagline">${config.tagline}</text>
</svg>`;
}
