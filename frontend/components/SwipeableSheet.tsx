import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  elevation,
  spacing,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

export type SheetSnap = "peek" | "half" | "full";

interface SwipeableSheetProps {
  children: React.ReactNode;
  /** Sticky footer (CTA / payment) — always visible. */
  footer?: React.ReactNode;
  /** Optional header rendered under the handle — also draggable. */
  header?: React.ReactNode;
  initialSnap?: SheetSnap;
  onSnapChange?: (snap: SheetSnap) => void;
  /** Height in px the sheet settles at — lets a map behind it frame only the visible part. */
  onHeightChange?: (height: number) => void;
  style?: ViewStyle;
}

const SCREEN_H = Dimensions.get("window").height;

const SNAP_RATIOS: Record<SheetSnap, number> = {
  peek: 0.3,
  half: 0.54,
  full: 0.84,
};

const SNAP_ORDER: SheetSnap[] = ["peek", "half", "full"];

function nearestSnap(
  height: number,
  snaps: Record<SheetSnap, number>
): SheetSnap {
  let best: SheetSnap = "half";
  let bestDist = Number.POSITIVE_INFINITY;
  for (const key of SNAP_ORDER) {
    const dist = Math.abs(snaps[key] - height);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}

export function SwipeableSheet({
  children,
  footer,
  header,
  initialSnap = "half",
  onSnapChange,
  onHeightChange,
  style,
}: SwipeableSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const usableH = SCREEN_H - insets.top;

  const snapHeights = useMemo(
    () => ({
      peek: Math.round(usableH * SNAP_RATIOS.peek),
      half: Math.round(usableH * SNAP_RATIOS.half),
      full: Math.round(usableH * SNAP_RATIOS.full),
    }),
    [usableH]
  );

  const minH = snapHeights.peek;
  const maxH = snapHeights.full;
  const heightAnim = useRef(new Animated.Value(snapHeights[initialSnap])).current;
  const dragStart = useRef(snapHeights[initialSnap]);
  const snapRef = useRef<SheetSnap>(initialSnap);
  const [, setSnap] = useState<SheetSnap>(initialSnap);
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  useEffect(() => {
    onHeightChangeRef.current?.(snapHeights[snapRef.current]);
  }, [snapHeights]);

  const animateTo = (next: SheetSnap) => {
    const target = snapHeights[next];
    Animated.spring(heightAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 68,
      friction: 12,
    }).start();
    onHeightChangeRef.current?.(target);
    if (next !== snapRef.current) {
      snapRef.current = next;
      setSnap(next);
      haptics.select();
      onSnapChange?.(next);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          heightAnim.stopAnimation((value) => {
            dragStart.current = value;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(
            maxH,
            Math.max(minH, dragStart.current - g.dy)
          );
          heightAnim.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          heightAnim.stopAnimation((value) => {
            if (g.vy < -0.85) {
              const idx = SNAP_ORDER.indexOf(snapRef.current);
              animateTo(SNAP_ORDER[Math.min(SNAP_ORDER.length - 1, idx + 1)]);
              return;
            }
            if (g.vy > 0.85) {
              const idx = SNAP_ORDER.indexOf(snapRef.current);
              animateTo(SNAP_ORDER[Math.max(0, idx - 1)]);
              return;
            }
            animateTo(nearestSnap(value - g.vy * 60, snapHeights));
          });
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minH, maxH, snapHeights]
  );

  return (
    <Animated.View
      style={[
        styles.sheet,
        style,
        {
          height: heightAnim,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      <View
        {...panResponder.panHandlers}
        style={styles.handleZone}
        accessibilityRole="adjustable"
        accessibilityLabel="Drag sheet"
        accessibilityHint="Swipe up or down to resize"
      >
        <View style={styles.handle} />
        {header ? <View style={styles.header}>{header}</View> : null}
      </View>

      <View style={styles.content}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingHorizontal: spacing.md,
      ...elevation(colors, "lg"),
      overflow: "hidden",
    },
    handleZone: {
      width: "100%",
      alignItems: "center",
      paddingTop: spacing.ms,
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.borderLight,
      marginBottom: spacing.ms,
    },
    header: {
      width: "100%",
      paddingBottom: spacing.sm,
    },
    content: {
      flex: 1,
      minHeight: 0,
    },
    footer: {
      width: "100%",
      paddingTop: spacing.sm,
      flexShrink: 0,
    },
  });
}
