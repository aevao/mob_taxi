import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, elevation, hitSlop, spacing, typography } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface NavBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: "arrow" | "close";
  right?: React.ReactNode;
  /** Floats the bar over content (e.g. above a map) with no background. */
  transparent?: boolean;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      backgroundColor: colors.background,
    },
    barTransparent: { backgroundColor: "transparent" },
    slot: {
      minWidth: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    slotRight: { alignItems: "flex-end" },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.mapControl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...elevation(colors, "sm"),
    },
    iconButtonFloating: { borderWidth: 0 },
    iconButtonPressed: { opacity: 0.7 },
    touch: { flexShrink: 0 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 1,
    },
  });
}

export function NavBar({
  title,
  subtitle,
  onBack,
  backIcon = "arrow",
  right,
  transparent = false,
}: NavBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const Icon = backIcon === "close" ? X : ArrowLeft;

  return (
    <View style={[styles.bar, transparent && styles.barTransparent]}>
      <View style={styles.slot}>
        {onBack ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              onBack();
            }}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Icon size={20} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.slot, styles.slotRight]}>{right}</View>
    </View>
  );
}

interface NavIconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
  floating?: boolean;
}

export function NavIconButton({
  icon,
  onPress,
  label,
  floating = false,
}: NavIconButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.touch, pressed && styles.iconButtonPressed]}
    >
      <View style={[styles.iconButton, floating && styles.iconButtonFloating]}>
        {icon}
      </View>
    </Pressable>
  );
}
