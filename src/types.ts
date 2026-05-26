export type LayoutType = 'horizontal' | 'vertical' | 'icon-only' | 'text-only' | 'badge';

export type FontFamilyType = 'sans' | 'display' | 'space' | 'serif' | 'cinzel' | 'mono';

export type TrackingType = 'tight' | 'normal' | 'wide' | 'widest';

export type BadgeShapeType = 'none' | 'circle' | 'square' | 'shield' | 'hexagon' | 'outline-circle';

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string; // Background for logo container
  textPrimary: string;
  textSecondary: string;
  darkContrast: boolean;
  bgHex: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
}

export interface LogoConfig {
  brandName: string;
  tagline: string;
  layout: LayoutType;
  fontFamily: FontFamilyType;
  taglineFontFamily: FontFamilyType;
  fontTracking: TrackingType;
  taglineTracking: TrackingType;
  colorPaletteId: string;
  iconName: string;
  iconSize: number; // 24 to 96
  iconRotation: number; // -180 to 180
  iconStrokeWidth: number; // 1 to 3
  badgeShape: BadgeShapeType;
  textUppercase: boolean;
  taglineUppercase: boolean;
  gridOverlay: boolean;
  contrastMode: boolean; // Swap colors for dark mode testing
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  config: Partial<LogoConfig>;
}

export interface LogoSymbol {
  id: string;
  name: string;
  category: 'core' | 'tech' | 'abstract' | 'retail' | 'nature' | 'shapes';
}
