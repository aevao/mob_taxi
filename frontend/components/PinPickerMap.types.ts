import type { LatLng } from "@/lib/googleMaps";

export interface PinPickerMapProps {
  initialCenter: LatLng;
  onMoveStart: () => void;
  onMoveEnd: (center: LatLng) => void;
}

export interface PinPickerMapHandle {
  moveTo: (center: LatLng) => void;
}
