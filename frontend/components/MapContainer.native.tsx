import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MockMapView } from "@/components/MockMapView";
import type { MapContainerProps } from "@/components/MapContainer.types";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useMapStyle } from "@/hooks/useMapStyle";
import { useRoutePolyline } from "@/hooks/useRoutePolyline";
import { regionForLocations } from "@/lib/mapRegion";
import { ThemeColors, borderRadius, spacing } from "@/constants/theme";

export type { MapContainerProps } from "@/components/MapContainer.types";

const isExpoGo = Constants.appOwnership === "expo";

export function MapContainer(props: MapContainerProps) {
  if (isExpoGo) {
    return <MockMapView {...props} />;
  }

  return <GoogleMapView {...props} />;
}

const FIT_MARGIN = 56;

function GoogleMapView({
  pickup,
  dropoff,
  height = 220,
  showRoute = false,
  fullBleed = false,
  hideControls = false,
  obscured,
}: MapContainerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const mapStyle = useMapStyle();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  const region = useMemo(
    () => regionForLocations(pickup, dropoff),
    [pickup, dropoff]
  );

  const origin = useMemo(
    () =>
      pickup ? { latitude: pickup.latitude, longitude: pickup.longitude } : null,
    [pickup?.latitude, pickup?.longitude]
  );
  const destination = useMemo(
    () =>
      dropoff
        ? { latitude: dropoff.latitude, longitude: dropoff.longitude }
        : null,
    [dropoff?.latitude, dropoff?.longitude]
  );

  const { coordinates: routeCoordinates, loading: routeLoading } =
    useRoutePolyline(origin, destination, showRoute);

  const obscuredTop = Math.round(obscured?.top ?? 0);
  const obscuredBottom = Math.round(obscured?.bottom ?? 0);
  const mapPadding = useMemo(
    () => ({ top: obscuredTop, bottom: obscuredBottom, left: 0, right: 0 }),
    [obscuredTop, obscuredBottom]
  );

  // Google positions the camera inside mapPadding, so both fits land in the visible area.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const points =
      routeCoordinates && routeCoordinates.length >= 2
        ? routeCoordinates
        : [origin, destination].filter(
            (point): point is { latitude: number; longitude: number } =>
              point !== null
          );

    if (points.length >= 2) {
      map.fitToCoordinates(points, {
        edgePadding: {
          top: FIT_MARGIN,
          bottom: FIT_MARGIN,
          left: FIT_MARGIN,
          right: FIT_MARGIN,
        },
        animated: true,
      });
    } else {
      map.animateToRegion(region, 350);
    }
  }, [
    mapReady,
    routeCoordinates,
    origin,
    destination,
    region,
    obscuredTop,
    obscuredBottom,
  ]);

  return (
    <View
      style={[
        styles.container,
        fullBleed ? styles.containerBleed : { height },
      ]}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        customMapStyle={mapStyle}
        mapPadding={mapPadding}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={!hideControls}
        showsMyLocationButton={!hideControls}
        showsCompass={!hideControls}
        toolbarEnabled={!hideControls}
        rotateEnabled={false}
      >
        {pickup ? (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup"
            description={pickup.label}
            pinColor={colors.brand}
          />
        ) : null}

        {dropoff ? (
          <Marker
            coordinate={{
              latitude: dropoff.latitude,
              longitude: dropoff.longitude,
            }}
            title="Dropoff"
            description={dropoff.label}
            pinColor={colors.pinDropoff}
          />
        ) : null}

        {showRoute && routeCoordinates && routeCoordinates.length >= 2 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.brand}
            strokeWidth={4}
          />
        ) : null}
      </MapView>

      {showRoute && routeLoading ? (
        <View
          style={[styles.routeLoader, { top: obscuredTop + spacing.sm }]}
          pointerEvents="none"
        >
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : null}
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
    containerBleed: {
      flex: 1,
      borderRadius: 0,
    },
    routeLoader: {
      position: "absolute",
      right: spacing.sm,
      backgroundColor: colors.mapControl,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
    },
  });
}
