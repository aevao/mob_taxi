import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Href, useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  CalendarClock,
  Car,
  ChevronRight,
  LucideIcon,
  Navigation,
  User,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  BRAND,
  SERVICE_TIER_LABELS,
  ServiceTier,
} from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  hitSlop,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

const HERO = require("@/assets/images/welcome-hero.jpg");
const TIERS: ServiceTier[] = ["black", "public"];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    setRole,
    isAuthenticated,
    passengerName,
    paymentMethods,
    driverApplication,
    serviceTier,
    setServiceTier,
  } = useApp();

  const startRide = (href: Href) => {
    setRole("passenger");
    router.push(href);
  };

  const openAccount = () =>
    router.push(
      isAuthenticated
        ? "/(app)/account"
        : { pathname: "/(auth)/login", params: { returnTo: "/" } }
    );

  const footerLink = !isAuthenticated
    ? { label: "Sign in or create account", onPress: openAccount }
    : paymentMethods.length === 0
      ? {
          label: "Add payment",
          onPress: () =>
            router.push({
              pathname: "/(auth)/add-payment",
              params: { returnTo: "/" },
            }),
        }
      : null;

  return (
    <ImageBackground source={HERO} style={styles.root} resizeMode="cover">
      <StatusBar style="light" />

      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.mediaShade} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={colors.mediaShade} stopOpacity={0.2} />
            <Stop offset="0.7" stopColor={colors.mediaShade} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.mediaShade} stopOpacity={0.92} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#shade)" />
      </Svg>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              haptics.tap();
              openAccount();
            }}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? "Account" : "Sign in"}
            style={styles.touch}
          >
            {({ pressed }) => (
              <View style={[styles.glassIcon, pressed && styles.glassPressed]}>
                <User size={20} color={colors.onMedia} strokeWidth={1.75} />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.wordmark} accessibilityRole="header">
            {BRAND.name.toLowerCase()}
            <Text style={styles.wordmarkDot}>.</Text>
          </Text>
          <Text style={styles.greeting}>
            {isAuthenticated
              ? `Hello, ${passengerName}!`
              : "Chicago's premium taxi"}
          </Text>

          <View style={styles.tierPill} accessibilityRole="radiogroup">
            {TIERS.map((tier) => {
              const active = tier === serviceTier;
              return (
                <Pressable
                  key={tier}
                  onPress={() => {
                    if (active) return;
                    haptics.select();
                    setServiceTier(tier);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={SERVICE_TIER_LABELS[tier]}
                  style={styles.touch}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.tierOption,
                        active && styles.tierOptionActive,
                        pressed && !active && styles.glassPressed,
                      ]}
                    >
                      <Text
                        style={[styles.tierText, active && styles.tierTextActive]}
                        numberOfLines={1}
                      >
                        {SERVICE_TIER_LABELS[tier]}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <ActionCircle
              icon={Navigation}
              label="Ride now"
              primary
              onPress={() => startRide("/(app)/where-to")}
            />
            <ActionCircle
              icon={CalendarClock}
              label="Ride later"
              onPress={() =>
                startRide({
                  pathname: "/(app)/ride-later",
                  params: { next: "where-to" },
                })
              }
            />
            <ActionCircle
              icon={Car}
              label={driverApplication ? "Driver" : "Drive"}
              onPress={() =>
                router.push(
                  driverApplication
                    ? "/(auth)/driver"
                    : "/(auth)/driver-register"
                )
              }
            />
          </View>

          {footerLink ? (
            <Pressable
              onPress={() => {
                haptics.tap();
                footerLink.onPress();
              }}
              hitSlop={hitSlop}
              accessibilityRole="link"
              accessibilityLabel={footerLink.label}
              style={styles.touch}
            >
              {({ pressed }) => (
                <View style={[styles.footerLink, pressed && styles.dimmed]}>
                  <Text style={styles.footerText}>{footerLink.label}</Text>
                  <ChevronRight size={18} color={colors.brand} strokeWidth={2} />
                </View>
              )}
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

interface ActionCircleProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  primary?: boolean;
}

function ActionCircle({ icon: Icon, label, onPress, primary }: ActionCircleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.touch}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.circle,
            primary ? styles.circlePrimary : styles.circleGlass,
            pressed && (primary ? styles.dimmed : styles.glassPressed),
          ]}
        >
          <Icon size={22} color={colors.onMedia} strokeWidth={1.75} />
          <Text style={styles.circleLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const CIRCLE = 96;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.mediaShade },
    safe: { flex: 1 },
    touch: { flexShrink: 0 },
    topBar: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    glassIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassBorder,
    },
    glassPressed: { backgroundColor: colors.glassPressed },
    dimmed: { opacity: 0.8 },
    hero: {
      flex: 1,
      alignItems: "center",
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    wordmark: {
      fontSize: 76,
      lineHeight: 84,
      fontWeight: "800",
      letterSpacing: -3,
      color: colors.onMedia,
    },
    wordmarkDot: { color: colors.brand },
    greeting: {
      ...typography.bodyMedium,
      color: colors.onMediaMuted,
      textAlign: "center",
    },
    tierPill: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.md,
      padding: spacing.xs,
      gap: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.glass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassBorder,
    },
    tierOption: {
      minHeight: 36,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    tierOptionActive: { backgroundColor: colors.onMedia },
    tierText: { ...typography.bodySmallMedium, color: colors.onMedia },
    tierTextActive: { color: colors.mediaShade },
    actions: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.lg,
    },
    actionRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
    },
    circle: {
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: CIRCLE / 2,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    circlePrimary: { backgroundColor: colors.brand },
    circleGlass: {
      backgroundColor: colors.glass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassBorder,
    },
    circleLabel: { ...typography.bodySmallMedium, color: colors.onMedia },
    footerLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs,
      minHeight: 24,
    },
    footerText: { ...typography.bodySmallMedium, color: colors.onMedia },
    footerSpacer: { height: 24 },
  });
}
