import { Platform, ViewStyle } from "react-native";

export type ThemeMode = "light" | "dark";

/**
 * Brand palette — change the app's primary color here only.
 * White button labels sit on `primary`; don't go lighter than ~4.4:1 contrast.
 */
const BRAND_PALETTE = {
  primary: "#6467F2",
  pressed: "#4F52DB",
  tintLight: "#EEEEFE",
  tintDark: "#1E1F45",
  heroLight: "#F4F4FE",
  heroDark: "#15163A",
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  cardHover: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentGold: string;
  brand: string;
  brandDark: string;
  brandMuted: string;
  onBrand: string;
  success: string;
  successMuted: string;
  warning: string;
  error: string;
  errorMuted: string;
  overlay: string;
  scrim: string;
  shadow: string;
  skeleton: string;
  mapGrid: string;
  mapRoad: string;
  mapRoadMain: string;
  mapWater: string;
  mapPark: string;
  pinPickup: string;
  pinDropoff: string;
  inputBg: string;
  /** Buttons / chips floating over the map — readable in both themes. */
  mapControl: string;
  heroGradientStart: string;
  heroGradientEnd: string;
  /** Content over full-bleed photos — fixed in both themes, the photo is always dark. */
  onMedia: string;
  onMediaMuted: string;
  mediaShade: string;
  glass: string;
  glassPressed: string;
  glassBorder: string;
}

const MEDIA_COLORS = {
  onMedia: "#FFFFFF",
  onMediaMuted: "rgba(255, 255, 255, 0.78)",
  mediaShade: "#05060C",
  glass: "rgba(255, 255, 255, 0.16)",
  glassPressed: "rgba(255, 255, 255, 0.28)",
  glassBorder: "rgba(255, 255, 255, 0.24)",
} as const;

export const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F6F8",
  card: "#FFFFFF",
  cardHover: "#F5F6F8",
  border: "#E7E9EC",
  borderLight: "#D3D7DD",
  text: "#0D0E11",
  textSecondary: "#63676F",
  textMuted: "#9AA0A8",
  textInverse: "#FFFFFF",
  accent: "#0D0E11",
  accentGold: "#B4802A",
  brand: BRAND_PALETTE.primary,
  brandDark: BRAND_PALETTE.pressed,
  brandMuted: BRAND_PALETTE.tintLight,
  onBrand: "#FFFFFF",
  success: "#00875A",
  successMuted: "#E4F5EE",
  warning: "#B4802A",
  error: "#D3372B",
  errorMuted: "#FDECEA",
  overlay: "rgba(255, 255, 255, 0.94)",
  scrim: "rgba(13, 14, 17, 0.45)",
  shadow: "rgba(13, 14, 17, 0.10)",
  skeleton: "#EDEFF2",
  mapGrid: "#E4E9EF",
  mapRoad: "#FFFFFF",
  mapRoadMain: "#D4DCE6",
  mapWater: "#CFE3F0",
  mapPark: "#DCEBDB",
  pinPickup: BRAND_PALETTE.primary,
  pinDropoff: "#0D0E11",
  inputBg: "#F5F6F8",
  mapControl: "#FFFFFF",
  heroGradientStart: BRAND_PALETTE.heroLight,
  heroGradientEnd: "#FFFFFF",
  ...MEDIA_COLORS,
};

export const darkColors: ThemeColors = {
  background: "#0B0C0E",
  surface: "#16181C",
  surfaceAlt: "#1F2226",
  card: "#16181C",
  cardHover: "#22252A",
  border: "#26292F",
  borderLight: "#363A41",
  text: "#FFFFFF",
  textSecondary: "#9BA1AA",
  textMuted: "#6B7079",
  textInverse: "#0B0C0E",
  accent: "#FFFFFF",
  accentGold: "#E0B25C",
  brand: BRAND_PALETTE.primary,
  brandDark: BRAND_PALETTE.pressed,
  brandMuted: BRAND_PALETTE.tintDark,
  onBrand: "#FFFFFF",
  success: "#2ED18A",
  successMuted: "#122E23",
  warning: "#E0B25C",
  error: "#FF6257",
  errorMuted: "#31191A",
  overlay: "rgba(11, 12, 14, 0.90)",
  scrim: "rgba(0, 0, 0, 0.60)",
  shadow: "rgba(0, 0, 0, 0.45)",
  skeleton: "#22252A",
  mapGrid: "#141619",
  mapRoad: "#22252A",
  mapRoadMain: "#2E3238",
  mapWater: "#14252E",
  mapPark: "#16241B",
  pinPickup: BRAND_PALETTE.primary,
  pinDropoff: "#FFFFFF",
  inputBg: "#1F2226",
  mapControl: "#22252A",
  heroGradientStart: BRAND_PALETTE.heroDark,
  heroGradientEnd: "#0B0C0E",
  ...MEDIA_COLORS,
};

/** @deprecated read colors from useTheme() so dark mode works */
export const colors = lightColors;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700" as const, letterSpacing: -0.6 },
  h1: { fontSize: 27, lineHeight: 33, fontWeight: "700" as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const, letterSpacing: -0.2 },
  bodyLarge: { fontSize: 17, lineHeight: 24, fontWeight: "400" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  bodySmallMedium: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 0.2 },
} as const;

type ElevationLevel = "none" | "sm" | "md" | "lg";

/**
 * Android ignores shadow offset/radius, so elevation is tuned separately
 * to keep both platforms visually close.
 */
export function elevation(colors: ThemeColors, level: ElevationLevel): ViewStyle {
  if (level === "none") return {};

  const presets = {
    sm: { height: 1, radius: 3, android: 1 },
    md: { height: 4, radius: 12, android: 4 },
    lg: { height: 12, radius: 28, android: 10 },
  } as const;

  const preset = presets[level];

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: preset.height },
      shadowOpacity: 1,
      shadowRadius: preset.radius,
    },
    android: { elevation: preset.android },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: preset.height },
      shadowOpacity: 1,
      shadowRadius: preset.radius,
    },
  }) as ViewStyle;
}

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}
