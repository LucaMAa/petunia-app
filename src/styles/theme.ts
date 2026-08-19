import { StyleSheet, Platform } from "react-native";

export const colors = {
  primary: "#C4714A", // warm terracotta
  primaryDark: "#9D5535", // burnt sienna — for pressed states
  primaryDeep: "#7A3D22", // deep earth — for text on light
  primaryLight: "#F5EAE2", // peach blush — tinted backgrounds
  primaryMid: "#E8C4AC", // soft tan — borders & dividers
  primaryGlow: "rgba(196, 113, 74, 0.15)",

  secondary: "#7B9E87", // sage green
  secondaryLight: "#EAF2EC", // mint mist
  secondaryDark: "#4E7A60", // forest — for text

  accent: "#C8973D", // dusty gold
  accentLight: "#F7EDD6", // champagne
  accentDark: "#8A6120", // dark gold — for text

  // ── Surfaces ────────────────────────────────────────────────────────────────
  background: "#FAF6F1", // warm ivory — main bg
  backgroundAlt: "#F2EBE1", // linen — section bgs
  backgroundDeep: "#EBE0D4", // deeper linen
  surface: "#FFFDF9", // near-white warm — cards
  surfaceAlt: "#FFF8F1", // peach-tinted surface
  surfaceGlass: "rgba(255, 253, 249, 0.92)",

  // ── Text ────────────────────────────────────────────────────────────────────
  text: "#1F0E05", // near-black espresso
  textSecondary: "#5C3D27", // mocha
  textTertiary: "#8A6650", // latte
  textMuted: "#B09580", // cream — placeholders
  textOnPrimary: "#FFFDF9",
  textOnDark: "#FAF6F1",

  // ── Borders ─────────────────────────────────────────────────────────────────
  border: "#E5D9CF", // soft warm border
  borderMid: "#D4C4B8", // medium border
  borderStrong: "#B89F90", // strong border
  borderFocus: "#C4714A", // primary focus

  // ── Semantic ────────────────────────────────────────────────────────────────
  success: "#5A8E6E",
  successLight: "#E4F2EB",
  error: "#B83232",
  errorLight: "#FAEAEA",
  warning: "#C8973D",
  warningLight: "#F7EDD6",

  // ── Overlay ─────────────────────────────────────────────────────────────────
  overlay: "rgba(31, 14, 5, 0.55)",
  overlayLight: "rgba(250, 246, 241, 0.88)",

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  tabBar: "#FFFDF9"
} as const ;

export const spacing = {
  xxs: 2,
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
} as const ;

export const radius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 48,
  pill: 999
} as const ;

// ── Typography ────────────────────────────────────────────────────────────────
// Mixing display weight for editorial energy
export const typography = {
  display: {
    fontSize: 38,
    fontWeight: "800" as const,
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 44
  },
  h1: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 36
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 30
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    lineHeight: 24
  },
  h4: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    lineHeight: 22
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.text,
    lineHeight: 22
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.text,
    lineHeight: 22
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: colors.textSecondary,
    lineHeight: 19
  },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const
  },
  caption: {
    fontSize: 11,
    fontWeight: "400" as const,
    color: colors.textMuted,
    lineHeight: 16
  },
  mono: {
    fontSize: 13,
    fontWeight: "500" as const
  },
  overline: {
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.primary
  }
} as const ;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadow = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#3D1A08",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1
  },
  sm: {
    shadowColor: "#3D1A08",
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  md: {
    shadowColor: "#3D1A08",
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 6
  },
  lg: {
    shadowColor: "#3D1A08",
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 12
  },
  brand: {
    shadowColor: "#C4714A",
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8
  },
  inset: {
    shadowColor: "#3D1A08",
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0
  }
});

// ── Layout helpers ────────────────────────────────────────────────────────────
export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.md,
  sectionGap: spacing.md,
  headerHeight: 56,
  tabBarHeight: Platform.OS === "ios"
    ? 82
    : 64,
  inputHeight: 52,
  buttonHeightLg: 54,
  buttonHeightMd: 46,
  buttonHeightSm: 36
} as const ;

// ── Animation presets ─────────────────────────────────────────────────────────
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400
} as const ;
