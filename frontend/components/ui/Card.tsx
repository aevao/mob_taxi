import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, borderRadius, elevation, spacing } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  /** `plain` sits flat on the canvas, `raised` lifts off it, `filled` is a tinted block. */
  variant?: "plain" | "raised" | "filled";
  padded?: boolean;
  style?: ViewStyle;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      width: "100%",
      borderRadius: borderRadius.lg,
      overflow: "hidden",
    },
    plain: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    raised: {
      backgroundColor: colors.surface,
      ...elevation(colors, "md"),
    },
    filled: {
      backgroundColor: colors.surfaceAlt,
    },
    padded: { padding: spacing.md },
  });
}

export function Card({
  children,
  variant = "plain",
  padded = false,
  style,
}: CardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[styles.base, styles[variant], padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: inset,
      }}
    />
  );
}
