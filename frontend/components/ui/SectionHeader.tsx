import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, hitSlop, spacing, typography } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    title: { ...typography.label, color: colors.textSecondary, flex: 1 },
    action: { ...typography.label, color: colors.brand },
  });
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            onAction();
          }}
          hitSlop={hitSlop}
          accessibilityRole="button"
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
