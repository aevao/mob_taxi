import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.md,
    },
    fullWidth: { width: "100%" },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    primary: { backgroundColor: colors.brand },
    secondary: { backgroundColor: colors.surfaceAlt },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    ghost: { backgroundColor: "transparent" },
    sm: { paddingHorizontal: spacing.md, minHeight: 40 },
    md: { paddingHorizontal: spacing.lg, minHeight: 50 },
    lg: { paddingHorizontal: spacing.lg, minHeight: 56 },
    pressed: { opacity: 0.85 },
    disabledPrimary: { backgroundColor: colors.surfaceAlt },
    disabledOther: { opacity: 0.4 },
    text: { ...typography.bodyMedium },
    textPrimary: { color: colors.onBrand },
    textSecondary: { color: colors.text },
    textOutline: { color: colors.text },
    textGhost: { color: colors.textSecondary },
    textDisabled: { color: colors.textMuted },
    textSm: { fontSize: 14 },
  });
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;

  const textVariantStyle = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    outline: styles.textOutline,
    ghost: styles.textGhost,
  }[variant];

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      style={[fullWidth && styles.fullWidth, style]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            styles[variant],
            styles[size],
            pressed && !isDisabled && styles.pressed,
            isDisabled && variant === "primary" && styles.disabledPrimary,
            isDisabled && variant !== "primary" && styles.disabledOther,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === "primary" ? colors.onBrand : colors.brand}
            />
          ) : (
            <View style={styles.content}>
              {icon}
              <Text
                style={[
                  styles.text,
                  textVariantStyle,
                  size === "sm" && styles.textSm,
                  isDisabled && variant === "primary" && styles.textDisabled,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
