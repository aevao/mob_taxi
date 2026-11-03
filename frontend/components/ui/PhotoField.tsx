import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, FileText, RefreshCw, UserRound } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";
import {
  CaptureMode,
  CapturedPhoto,
  capturePhoto,
} from "@/lib/photoCapture";

interface PhotoFieldProps {
  label: string;
  hint?: string;
  value: CapturedPhoto | null;
  onChange: (photo: CapturedPhoto) => void;
  mode?: CaptureMode;
  /** Round avatar preview + front camera. */
  selfie?: boolean;
  error?: string;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: "100%", marginBottom: spacing.md },
    pressable: { width: "100%", alignSelf: "stretch" },
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: "transparent",
      padding: spacing.ms,
    },
    rowPressed: { backgroundColor: colors.cardHover },
    rowError: { borderColor: colors.error },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    thumbRound: { borderRadius: 28 },
    image: { width: "100%", height: "100%" },
    text: { flex: 1, minWidth: 0 },
    label: { ...typography.bodyMedium, color: colors.text },
    status: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    statusDone: { color: colors.brand },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 0,
    },
    actionText: { ...typography.bodySmallMedium, color: colors.brand },
    hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
}

export function PhotoField({
  label,
  hint,
  value,
  onChange,
  mode = "live",
  selfie = false,
  error,
}: PhotoFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [busy, setBusy] = useState(false);

  const PlaceholderIcon =
    mode === "document" ? FileText : selfie ? UserRound : Camera;

  const statusText = value
    ? mode === "live"
      ? "Live photo captured"
      : "Document added"
    : mode === "live"
      ? "Live camera only"
      : "Photo or scan";

  const handlePress = async () => {
    haptics.tap();
    setBusy(true);
    const photo = await capturePhoto({ mode, selfie });
    setBusy(false);
    if (photo) {
      haptics.success();
      onChange(photo);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={value ? `Retake ${label}` : `Add ${label}`}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.row,
              pressed && styles.rowPressed,
              !!error && styles.rowError,
            ]}
          >
            <View style={[styles.thumb, selfie && styles.thumbRound]}>
              {value ? (
                <Image source={{ uri: value.uri }} style={styles.image} />
              ) : (
                <PlaceholderIcon
                  size={24}
                  strokeWidth={1.75}
                  color={colors.textSecondary}
                />
              )}
            </View>

            <View style={styles.text}>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
              <Text
                style={[styles.status, value && styles.statusDone]}
                numberOfLines={1}
              >
                {statusText}
              </Text>
            </View>

            <View style={styles.action}>
              {busy ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <>
                  {value ? (
                    <RefreshCw size={16} color={colors.brand} />
                  ) : (
                    <Camera size={16} color={colors.brand} />
                  )}
                  <Text style={styles.actionText}>
                    {value ? "Retake" : mode === "live" ? "Take" : "Add"}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </Pressable>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
