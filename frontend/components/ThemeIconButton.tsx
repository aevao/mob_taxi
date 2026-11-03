import React from "react";
import { Moon, Sun } from "lucide-react-native";
import { NavIconButton } from "@/components/ui/NavBar";
import { useTheme } from "@/context/ThemeContext";

export function ThemeIconButton() {
  const { isDark, toggleMode, colors } = useTheme();

  return (
    <NavIconButton
      label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onPress={toggleMode}
      icon={
        isDark ? (
          <Sun size={20} color={colors.text} />
        ) : (
          <Moon size={20} color={colors.text} />
        )
      }
    />
  );
}
