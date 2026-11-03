import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, hitSlop, spacing, typography } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface ListRowProps {
  icon?: LucideIcon;
  iconTint?: "muted" | "brand";
  title: string;
  subtitle?: string;
  /** Right-aligned text, e.g. a price or ETA. */
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  trailingIcon?: LucideIcon;
  onTrailingPress?: () => void;
  trailingLabel?: string;
  style?: ViewStyle;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressable: { width: "100%", alignSelf: "stretch" },
    pressed: { backgroundColor: colors.cardHover },
    row: {
      width: "100%",
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.ms,
      minHeight: 60,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.ms,
      minWidth: 0,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    iconCircleBrand: { backgroundColor: colors.brandMuted },
    textBlock: { flex: 1, minWidth: 0 },
    title: { ...typography.bodyMedium, color: colors.text },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexShrink: 0,
      marginLeft: spacing.sm,
    },
    value: { ...typography.bodySmallMedium, color: colors.text },
    trailingButton: { padding: spacing.xs },
  });
}

export function ListRow({
  icon: Icon,
  iconTint = "muted",
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  trailingIcon: TrailingIcon,
  onTrailingPress,
  trailingLabel,
  style,
}: ListRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {Icon ? (
          <View
            style={[
              styles.iconCircle,
              iconTint === "brand" && styles.iconCircleBrand,
            ]}
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              color={iconTint === "brand" ? colors.brand : colors.textSecondary}
            />
          </View>
        ) : null}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {TrailingIcon && onTrailingPress ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              onTrailingPress();
            }}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={trailingLabel ?? "More options"}
            style={styles.trailingButton}
          >
            <TrailingIcon size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {showChevron && onPress && !TrailingIcon ? (
          <ChevronRight size={20} color={colors.textMuted} />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return <View style={styles.pressable}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}
