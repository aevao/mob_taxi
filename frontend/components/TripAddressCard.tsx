import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  hitSlop,
  spacing,
  typography,
} from "@/constants/theme";

interface TripAddressCardProps {
  pickup: string;
  dropoff: string;
  onPickupChange: (text: string) => void;
  onDropoffChange: (text: string) => void;
}

export function TripAddressCard({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
}: TripAddressCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState<"pickup" | "dropoff" | null>(null);

  const inputProps = {
    placeholderTextColor: colors.textMuted,
    selectionColor: colors.brand,
    keyboardAppearance: isDark ? ("dark" as const) : ("light" as const),
  };

  return (
    <View style={styles.card}>
      <View style={styles.rail}>
        <View style={styles.dotPickup} />
        <View style={styles.connector} />
        <View style={styles.dotDropoff} />
      </View>

      <View style={styles.fields}>
        <View
          style={[
            styles.fieldRow,
            focused === "pickup" && styles.fieldRowFocused,
          ]}
        >
          <TextInput
            style={styles.input}
            value={pickup}
            onChangeText={onPickupChange}
            placeholder="Pickup location"
            {...inputProps}
            onFocus={() => setFocused("pickup")}
            onBlur={() => setFocused(null)}
            accessibilityLabel="Pickup location"
          />
        </View>

        <View style={styles.divider} />

        <View
          style={[
            styles.fieldRow,
            focused === "dropoff" && styles.fieldRowFocused,
          ]}
        >
          <TextInput
            style={styles.input}
            value={dropoff}
            onChangeText={onDropoffChange}
            placeholder="Where to?"
            {...inputProps}
            autoFocus={!dropoff}
            onFocus={() => setFocused("dropoff")}
            onBlur={() => setFocused(null)}
            accessibilityLabel="Destination"
          />
          {dropoff.length > 0 ? (
            <Pressable
              onPress={() => onDropoffChange("")}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Clear destination"
              style={styles.clearButton}
            >
              <X size={14} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: "100%",
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      overflow: "hidden",
    },
    rail: {
      width: 12,
      alignItems: "center",
      paddingVertical: 26,
      marginRight: spacing.ms,
      flexShrink: 0,
    },
    dotPickup: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.pinPickup,
    },
    dotDropoff: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.pinDropoff,
    },
    connector: {
      flex: 1,
      width: 1.5,
      backgroundColor: colors.borderLight,
      marginVertical: 5,
    },
    fields: { flex: 1, minWidth: 0 },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 56,
      borderRadius: borderRadius.sm,
    },
    fieldRowFocused: {
      backgroundColor: colors.inputBg,
    },
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.text,
      backgroundColor: "transparent",
      paddingVertical: spacing.ms,
    },
    clearButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
}
