import { useMemo, type DependencyList } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ThemeColors } from "@/constants/theme";

export function useThemedStyles<T>(
  factory: (colors: ThemeColors) => T,
  deps: DependencyList = []
): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, ...deps]);
}
