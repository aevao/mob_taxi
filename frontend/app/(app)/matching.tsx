import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Car, MessageSquare, Phone, Star } from "lucide-react-native";
import { MapContainer } from "@/components/MapContainer";
import { OrderSummary } from "@/components/OrderForm";
import { Badge, Button, Card } from "@/components/ui";
import { useApp, useOrderBreakdown } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  MATCHING_DELAY_MS,
  MATCHING_STEPS,
  formatScheduledTime,
} from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  elevation,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

export default function MatchingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { booking, resetBooking } = useApp();
  const breakdown = useOrderBreakdown();

  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    let step = 0;
    const interval = setInterval(() => {
      if (step < MATCHING_STEPS.length) {
        setProgress(MATCHING_STEPS[step]);
        step += 1;
      }
    }, MATCHING_DELAY_MS / MATCHING_STEPS.length);

    const timeout = setTimeout(() => {
      setMatched(true);
      setProgress(100);
      haptics.success();
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, MATCHING_DELAY_MS);

    return () => {
      loop.stop();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fade, pulse]);

  const finish = () => {
    resetBooking();
    router.replace("/(app)/home");
  };

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  const isScheduled = booking.orderDetails.scheduleType === "later";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.mapLayer}>
        <MapContainer
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          showRoute
          fullBleed
        />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {!matched ? (
          <View style={styles.searching}>
            <View style={styles.pulseWrap}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
              />
              <View style={styles.pulseCore}>
                <Car size={28} color={colors.onBrand} strokeWidth={1.75} />
              </View>
            </View>

            <Text style={styles.title}>Finding your driver</Text>
            <Text style={styles.subtitle}>
              Matching you with nearby WHYP taxis in Chicago
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <Button
              title="Cancel request"
              variant="ghost"
              onPress={finish}
              style={styles.cancelButton}
            />
          </View>
        ) : (
          <Animated.View style={[styles.matched, { opacity: fade }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.matchedContent}
            >
              <Badge tone="brand" label="Driver on the way" />
              <Text style={styles.title}>Your ride is confirmed</Text>

              <Card padded style={styles.driverCard}>
                <View style={styles.driverRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {booking.driverName?.charAt(0) ?? "W"}
                    </Text>
                  </View>

                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName} numberOfLines={1}>
                      {booking.driverName}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Star
                        size={13}
                        color={colors.accentGold}
                        fill={colors.accentGold}
                      />
                      <Text style={styles.ratingText}>
                        {booking.driverRating?.toFixed(2)}
                      </Text>
                      <Text style={styles.plateText} numberOfLines={1}>
                        · {booking.driverPlate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.etaBadge}>
                    <Text style={styles.etaValue}>4</Text>
                    <Text style={styles.etaLabel}>min</Text>
                  </View>
                </View>

                <View style={styles.contactRow}>
                  <ContactButton
                    icon={<Phone size={18} color={colors.text} />}
                    label="Call"
                  />
                  <ContactButton
                    icon={<MessageSquare size={18} color={colors.text} />}
                    label="Message"
                  />
                </View>
              </Card>

              {isScheduled ? (
                <Text style={styles.scheduleNote}>
                  Scheduled for{" "}
                  {formatScheduledTime(booking.orderDetails.scheduledFor)}
                </Text>
              ) : null}

              <OrderSummary {...breakdown} />
            </ScrollView>

            <Button title="Done" size="lg" onPress={finish} />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ContactButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={haptics.tap}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.contactButton,
        pressed && styles.contactPressed,
      ]}
    >
      {icon}
      <Text style={styles.contactLabel}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    mapLayer: { flex: 1, minHeight: 140 },
    sheet: {
      flex: 1.15,
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      ...elevation(colors, "lg"),
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderLight,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    searching: { flex: 1, alignItems: "center" },
    pulseWrap: {
      width: 72,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    pulseRing: {
      position: "absolute",
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.brand,
    },
    pulseCore: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.h2,
      color: colors.text,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    progressTrack: {
      width: "100%",
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: colors.brand,
    },
    cancelButton: { marginTop: "auto" },
    matched: { flex: 1, width: "100%" },
    matchedContent: { gap: spacing.ms, paddingBottom: spacing.ms },
    driverCard: { gap: spacing.ms },
    driverRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    avatarText: { ...typography.h3, color: colors.text },
    driverInfo: { flex: 1, minWidth: 0 },
    driverName: { ...typography.bodyMedium, color: colors.text },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: 2,
    },
    ratingText: { ...typography.caption, color: colors.text, fontWeight: "600" },
    plateText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    etaBadge: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandMuted,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.ms,
      paddingVertical: spacing.sm,
      flexShrink: 0,
    },
    etaValue: { ...typography.h3, color: colors.brand },
    etaLabel: { ...typography.micro, color: colors.brand, fontWeight: "400" },
    contactRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    contactButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.ms,
    },
    contactPressed: { opacity: 0.7 },
    contactLabel: { ...typography.bodySmallMedium, color: colors.text },
    scheduleNote: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
}
