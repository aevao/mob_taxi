import { Redirect, Stack } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

export const unstable_settings = { initialRouteName: "home" };

export default function AppLayout() {
  const { role } = useApp();
  const { colors } = useTheme();

  if (role === "driver") {
    return <Redirect href="/(auth)/driver" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
}
