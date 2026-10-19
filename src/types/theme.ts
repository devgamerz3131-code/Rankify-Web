export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type UiPreset = 'Minimal' | 'Material 3' | 'Modern Flat' | 'Professional' | 'High Contrast';
export type RadiusPreset = 'Small' | 'Medium' | 'Large' | 'Extra Large';
export type AnimationLevel = 'Off' | 'Low' | 'Normal' | 'High' | 'Ultra';
export type CardDensity = 'Compact' | 'Comfortable' | 'Spacious';
export type ShadowIntensity = 'Off' | 'Soft' | 'Medium' | 'Strong';
export type BackgroundStyle = 'Solid' | 'Subtle Surface' | 'Gradient' | 'Dynamic';
export type AccentColor =
  | 'Purple'
  | 'Blue'
  | 'Green'
  | 'Orange'
  | 'Red'
  | 'Pink'
  | 'Teal'
  | 'Dynamic System Color';
export type IconStyle = 'Rounded' | 'Material' | 'Modern';
export type FontSize = 'Small' | 'Normal' | 'Large' | 'Extra Large';
export type UiScale = '90%' | '100%' | '110%' | '125%';
export type PerformanceMode = 'Battery Saver' | 'Balanced' | 'Best Quality';

export interface AppearanceSettings {
  uiPreset: UiPreset;
  radiusPreset: RadiusPreset;
  animationLevel: AnimationLevel;
  cardDensity: CardDensity;
  shadowIntensity: ShadowIntensity;
  backgroundStyle: BackgroundStyle;
  accentColor: AccentColor;
  iconStyle: IconStyle;
  fontSize: FontSize;
  uiScale: UiScale;
  reduceMotion: boolean;
  performanceMode: PerformanceMode;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  uiPreset: 'Material 3',
  radiusPreset: 'Large',
  animationLevel: 'Normal',
  cardDensity: 'Comfortable',
  shadowIntensity: 'Soft',
  backgroundStyle: 'Solid',
  accentColor: 'Purple',
  iconStyle: 'Rounded',
  fontSize: 'Normal',
  uiScale: '100%',
  reduceMotion: false,
  performanceMode: 'Balanced',
};

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  appearance: AppearanceSettings;
  updateAppearance: (partial: Partial<AppearanceSettings>) => void;
  applyPreset: (preset: UiPreset) => void;
  resetAppearance: () => void;
  saveAsAdminDefault?: () => Promise<void>;
}
