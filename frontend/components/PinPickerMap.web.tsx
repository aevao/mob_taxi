import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import type {
  PinPickerMapHandle,
  PinPickerMapProps,
} from "@/components/PinPickerMap.types";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors } from "@/constants/theme";

export type {
  PinPickerMapHandle,
  PinPickerMapProps,
} from "@/components/PinPickerMap.types";

/** Web has no react-native-maps — the pin stays on the initial point. */
export const PinPickerMap = forwardRef<PinPickerMapHandle, PinPickerMapProps>(
  function PinPickerMap({ initialCenter, onMoveEnd }, ref) {
    const styles = useThemedStyles(createStyles);

    useImperativeHandle(ref, () => ({ moveTo: onMoveEnd }));

    useEffect(() => {
      onMoveEnd(initialCenter);
    }, []);

    return <View style={styles.map} />;
  }
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.mapGrid },
  });
}
