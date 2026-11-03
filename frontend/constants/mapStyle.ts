import type { MapStyleElement } from "react-native-maps";
import type { ThemeColors } from "@/constants/theme";

/** Google Maps style matching the app theme. Light mode keeps Google's default look. */
export function createMapStyle(
  colors: ThemeColors,
  isDark: boolean
): MapStyleElement[] {
  if (!isDark) return [];

  return [
    { elementType: "geometry", stylers: [{ color: colors.mapGrid }] },
    { elementType: "labels.text.fill", stylers: [{ color: colors.textSecondary }] },
    { elementType: "labels.text.stroke", stylers: [{ color: colors.background }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.border }],
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: colors.surface }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.textMuted }],
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: colors.mapPark }],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [{ color: colors.mapRoad }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: colors.background }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.textMuted }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry.fill",
      stylers: [{ color: colors.mapRoadMain }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: colors.borderLight }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.textSecondary }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: colors.surfaceAlt }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.textMuted }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: colors.mapWater }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.textMuted }],
    },
  ];
}
