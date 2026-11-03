import { MockMapView } from "@/components/MockMapView";
import type { MapContainerProps } from "@/components/MapContainer.types";

export type { MapContainerProps } from "@/components/MapContainer.types";

/** Web has no react-native-maps — keep the SVG preview. */
export function MapContainer(props: MapContainerProps) {
  return <MockMapView {...props} />;
}
