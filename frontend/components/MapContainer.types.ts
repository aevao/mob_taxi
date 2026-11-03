import type { Location } from "@/constants/mockData";

export interface MapContainerProps {
  pickup?: Location | null;
  dropoff?: Location | null;
  height?: number;
  showRoute?: boolean;
  fullBleed?: boolean;
  hideControls?: boolean;
  /** Screen space covered by overlays (header buttons, bottom sheet); framing uses only the visible part. */
  obscured?: { top?: number; bottom?: number };
}
