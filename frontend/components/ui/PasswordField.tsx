import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { TextField } from "./TextField";
import { useTheme } from "@/context/ThemeContext";
import { hitSlop } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

type TextFieldProps = React.ComponentProps<typeof TextField>;

interface PasswordFieldProps
  extends Omit<TextFieldProps, "secureTextEntry" | "trailing" | "icon"> {
  /** Controlled visibility, so a password and its confirmation toggle together. */
  visible?: boolean;
  onToggleVisible?: () => void;
  showToggle?: boolean;
}

export function PasswordField({
  visible: visibleProp,
  onToggleVisible,
  showToggle = true,
  ...props
}: PasswordFieldProps) {
  const { colors } = useTheme();
  const [visibleState, setVisibleState] = useState(false);
  const visible = visibleProp ?? visibleState;

  const toggle = () => {
    haptics.select();
    if (onToggleVisible) onToggleVisible();
    else setVisibleState((prev) => !prev);
  };

  return (
    <TextField
      icon={Lock}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        showToggle ? (
          <Pressable
            onPress={toggle}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            {({ pressed }) => (
              <View style={pressed && styles.pressed}>
                {visible ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </View>
            )}
          </Pressable>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.5 },
});
