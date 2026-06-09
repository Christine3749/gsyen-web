/**
 * 品牌调色板解析——把"选中的调色板 + 对比模式开关"解析成实际用到的 5 个颜色。
 * 原本散落在 App 组件里的 5 个三元表达式，集中到这里，svgMarkup 与预览组件共用。
 */
import { ColorPalette } from '../../types';
import { COLOR_PALETTES } from '../../data';

export interface PaletteColors {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  tagline: string;
}

export function getActivePalette(id: string): ColorPalette {
  return COLOR_PALETTES.find(p => p.id === id) || COLOR_PALETTES[0];
}

export function resolvePaletteColors(p: ColorPalette, contrastMode: boolean): PaletteColors {
  return {
    primary:  contrastMode ? p.bgHex : p.primaryHex,
    secondary: contrastMode ? p.textSecondary : p.secondaryHex,
    bg:       contrastMode ? p.primaryHex : p.bgHex,
    text:     contrastMode ? p.secondaryHex : p.textPrimary,
    tagline:  contrastMode ? p.bgHex : p.secondaryHex,
  };
}
