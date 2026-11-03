import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";

type BadgeTone = "neutral" | "brand" | "gold" | "warning" | "success";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: spacing.xs,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
    },
    neutral: { backgroundColor: colors.surfaceAlt },
    brand: { backgroundColor: colors.brandMuted },
    gold: { backgroundColor: colors.surfaceAlt },
    warning: { backgroundColor: colors.errorMuted },
    success: { backgroundColor: colors.successMuted },
    text: { ...typography.micro },
    neutralText: { color: colors.textSecondary },
    brandText: { color: colors.brand },
    goldText: { color: colors.accentGold },
    warningText: { color: colors.error },
    successText: { color: colors.success },
  });
}

export function Badge({ label, tone = "neutral", icon }: BadgeProps) {
  const styles = useThemedStyles(createStyles);

  const toneStyle = {
    neutral: styles.neutral,
    brand: styles.brand,
    gold: styles.gold,
    warning: styles.warning,
    success: styles.success,
  }[tone];

  const textStyle = {
    neutral: styles.neutralText,
    brand: styles.brandText,
    gold: styles.goldText,
    warning: styles.warningText,
    success: styles.successText,
  }[tone];

  return (
    <View style={[styles.badge, toneStyle]}>
      {icon}
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}
