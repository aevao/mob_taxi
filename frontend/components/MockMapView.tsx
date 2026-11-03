import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Navigation } from "lucide-react-native";
import { Location } from "@/constants/mockData";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  elevation,
  spacing,
  typography,
} from "@/constants/theme";

export interface MockMapViewProps {
  pickup?: Location | null;
  dropoff?: Location | null;
  height?: number;
  showRoute?: boolean;
  fullBleed?: boolean;
  hideControls?: boolean;
}

const VIEW_W = 100;
const VIEW_H = 100;

const STREETS_MINOR = [
  "M0 14 H100",
  "M0 30 H100",
  "M0 46 H100",
  "M0 62 H100",
  "M0 78 H100",
  "M0 92 H100",
  "M10 0 V100",
  "M26 0 V100",
  "M42 0 V100",
  "M58 0 V100",
  "M74 0 V100",
];

const STREETS_MAJOR = ["M0 54 H100", "M50 0 V100"];
const RIVER =
  "M34 0 C36 18, 28 26, 30 38 C32 50, 22 58, 24 72 C26 84, 20 92, 22 100";

export function MockMapView({
  pickup,
  dropoff,
  height = 220,
  showRoute = false,
  fullBleed = false,
  hideControls = false,
}: MockMapViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
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
    return () => loop.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.4],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  const pickupPoint = { x: 38, y: 68 };
  const dropoffPoint = { x: 68, y: 30 };
  const hasRoute = showRoute && !!pickup && !!dropoff;

  return (
    <View
      style={[
        styles.container,
        fullBleed ? styles.containerBleed : { height },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill={colors.mapGrid} />
        <Rect x="86" y="0" width="14" height={VIEW_H} fill={colors.mapWater} />
        <Path d={RIVER} stroke={colors.mapWater} strokeWidth={3.2} fill="none" />
        <Rect x="60" y="52" width="18" height="16" rx="2" fill={colors.mapPark} />
        <Rect x="6" y="18" width="14" height="12" rx="2" fill={colors.mapPark} />
        {STREETS_MINOR.map((d) => (
          <Path key={d} d={d} stroke={colors.mapRoad} strokeWidth={1.6} fill="none" />
        ))}
        {STREETS_MAJOR.map((d) => (
          <Path key={d} d={d} stroke={colors.mapRoadMain} strokeWidth={3.4} fill="none" />
        ))}
        {hasRoute ? (
          <Path
            d={`M${pickupPoint.x} ${pickupPoint.y} L${pickupPoint.x} 54 L${dropoffPoint.x} 54 L${dropoffPoint.x} ${dropoffPoint.y}`}
            stroke={colors.brand}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        {hasRoute ? (
          <Circle
            cx={dropoffPoint.x}
            cy={dropoffPoint.y}
            r={3.4}
            fill={colors.pinDropoff}
            stroke={colors.surface}
            strokeWidth={1.6}
          />
        ) : null}
      </Svg>

      <View
        style={[
          styles.pickupPin,
          { left: `${pickupPoint.x}%`, top: `${pickupPoint.y}%` },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          ]}
        />
        <View style={styles.pickupDot} />
      </View>

      {!hideControls ? (
        <View style={styles.compass}>
          <Navigation size={16} color={colors.text} />
        </View>
      ) : null}

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>Map preview · Chicago, IL</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor: colors.mapGrid,
      borderRadius: borderRadius.lg,
      overflow: "hidden",
    },
    containerBleed: { flex: 1, borderRadius: 0 },
    pickupPin: {
      position: "absolute",
      width: 18,
      height: 18,
      marginLeft: -9,
      marginTop: -9,
      alignItems: "center",
      justifyContent: "center",
    },
    pulseRing: {
      position: "absolute",
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.brand,
    },
    pickupDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.brand,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    compass: {
      position: "absolute",
      top: spacing.ms,
      right: spacing.ms,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.mapControl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...elevation(colors, "sm"),
    },
    attribution: {
      position: "absolute",
      bottom: spacing.sm,
      left: spacing.ms,
      backgroundColor: colors.mapControl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: borderRadius.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    attributionText: { ...typography.micro, color: colors.textSecondary },
  });
}
