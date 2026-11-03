import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CodeInput({
  value,
  onChange,
  length = 6,
  error,
  disabled = false,
  autoFocus = true,
}: CodeInputProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length }, (_, index) => {
          const digit = value[index] ?? "";
          const isActive = focused && index === activeIndex && !disabled;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                digit ? styles.cellFilled : null,
                isActive && styles.cellActive,
                !!error && styles.cellError,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, length))}
          maxLength={length}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          keyboardAppearance={isDark ? "dark" : "light"}
          editable={!disabled}
          caretHidden
          selectionColor="transparent"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={`${length}-digit verification code`}
          style={styles.hiddenInput}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: "100%" },
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cell: {
      flex: 1,
      height: 58,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cellFilled: { backgroundColor: colors.surface, borderColor: colors.border },
    cellActive: { borderColor: colors.brand, backgroundColor: colors.surface },
    cellError: { borderColor: colors.error },
    digit: { ...typography.h2, color: colors.text },
    hiddenInput: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.02,
      color: "transparent",
      fontSize: 1,
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.sm,
    },
  });
}
