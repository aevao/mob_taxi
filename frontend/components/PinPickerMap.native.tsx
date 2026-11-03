import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import type {
  PinPickerMapHandle,
  PinPickerMapProps,
} from "@/components/PinPickerMap.types";
import { useMapStyle } from "@/hooks/useMapStyle";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors } from "@/constants/theme";

export type {
  PinPickerMapHandle,
  PinPickerMapProps,
} from "@/components/PinPickerMap.types";

const isExpoGo = Constants.appOwnership === "expo";

const ZOOM_DELTA = { latitudeDelta: 0.008, longitudeDelta: 0.008 };

export const PinPickerMap = forwardRef<PinPickerMapHandle, PinPickerMapProps>(
  function PinPickerMap({ initialCenter, onMoveStart, onMoveEnd }, ref) {
    const styles = useThemedStyles(createStyles);
    const mapStyle = useMapStyle();
    const mapRef = useRef<MapView>(null);
    const moving = useRef(false);

    useImperativeHandle(ref, () => ({
      moveTo: (center) =>
        mapRef.current?.animateToRegion({ ...center, ...ZOOM_DELTA }, 400),
    }));

    useEffect(() => {
      if (isExpoGo) onMoveEnd(initialCenter);
    }, []);

    if (isExpoGo) {
      return <View style={styles.fallback} />;
    }

    const handleRegionChange = () => {
      if (moving.current) return;
      moving.current = true;
      onMoveStart();
    };

    const handleRegionChangeComplete = (region: Region) => {
      moving.current = false;
      onMoveEnd({ latitude: region.latitude, longitude: region.longitude });
    };

    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...initialCenter, ...ZOOM_DELTA }}
        customMapStyle={mapStyle}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />
    );
  }
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fallback: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.mapGrid },
  });
}
