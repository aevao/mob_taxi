import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { createMapStyle } from "@/constants/mapStyle";

export function useMapStyle() {
  const { colors, isDark } = useTheme();
  return useMemo(() => createMapStyle(colors, isDark), [colors, isDark]);
}
