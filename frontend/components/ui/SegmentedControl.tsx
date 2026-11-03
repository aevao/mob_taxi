import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  elevation,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceAlt,
      borderRadius: borderRadius.full,
      padding: 3,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: borderRadius.full,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      ...elevation(colors, "sm"),
    },
    label: { ...typography.bodySmallMedium, color: colors.textSecondary },
    labelActive: { color: colors.text },
  });
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (active) return;
              haptics.select();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

function createStepperStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    buttonDisabled: { opacity: 0.4 },
    symbol: { ...typography.h3, color: colors.text },
    value: {
      ...typography.h3,
      color: colors.text,
      minWidth: 32,
      textAlign: "center",
    },
  });
}

export function Stepper({ value, min = 1, max = 3, onChange }: StepperProps) {
  const styles = useThemedStyles(createStepperStyles);
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.row}>
      <Pressable
        disabled={!canDecrease}
        onPress={() => {
          haptics.select();
          onChange(value - 1);
        }}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        disabled={!canIncrease}
        onPress={() => {
          haptics.select();
          onChange(value + 1);
        }}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}
