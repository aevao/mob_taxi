import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { LucideIcon } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  /** Right-side accessory, e.g. a show/hide password button. */
  trailing?: React.ReactNode;
  containerStyle?: ViewStyle;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: "100%", marginBottom: spacing.md },
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    field: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: "transparent",
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    fieldFocused: {
      borderColor: colors.brand,
      backgroundColor: colors.surface,
    },
    fieldError: { borderColor: colors.error },
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.text,
      backgroundColor: "transparent",
      paddingVertical: spacing.ms,
    },
    trailing: { flexShrink: 0 },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
}

export function TextField({
  label,
  hint,
  error,
  icon: Icon,
  trailing,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {Icon ? <Icon size={20} color={colors.textMuted} /> : null}
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          keyboardAppearance={isDark ? "dark" : "light"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
