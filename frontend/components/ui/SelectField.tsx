import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, LucideIcon, Search } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";
import { NavBar } from "./NavBar";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly SelectOption[] | readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  disabled?: boolean;
  /** Shows a filter input — useful for long lists like makes or states. */
  searchable?: boolean;
}

function normalize(options: SelectFieldProps["options"]): SelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: "100%", marginBottom: spacing.md },
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    pressable: { width: "100%", alignSelf: "stretch" },
    field: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: "transparent",
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    fieldPressed: { backgroundColor: colors.cardHover },
    fieldError: { borderColor: colors.error },
    fieldDisabled: { opacity: 0.5 },
    left: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    value: { ...typography.body, color: colors.text, flex: 1, minWidth: 0 },
    placeholder: { color: colors.textMuted },
    chevron: { flexShrink: 0 },
    hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
    modal: { flex: 1, backgroundColor: colors.background },
    searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    searchField: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 44,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
    optionPressable: { width: "100%", alignSelf: "stretch" },
    optionRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    optionPressed: { backgroundColor: colors.cardHover },
    optionText: { ...typography.body, color: colors.text, flex: 1, minWidth: 0 },
    optionTextSelected: { ...typography.bodyMedium, color: colors.brand },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    empty: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
  });
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  icon: Icon,
  error,
  hint,
  disabled = false,
  searchable = false,
}: SelectFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(() => normalize(options), [options]);
  const selected = items.find((item) => item.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => {
          haptics.tap();
          setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled }}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.field,
              pressed && styles.fieldPressed,
              !!error && styles.fieldError,
              disabled && styles.fieldDisabled,
            ]}
          >
            <View style={styles.left}>
              {Icon ? <Icon size={20} color={colors.textMuted} /> : null}
              <Text
                style={[styles.value, !selected && styles.placeholder]}
                numberOfLines={1}
              >
                {selected?.label ?? placeholder}
              </Text>
            </View>
            <View style={styles.chevron}>
              <ChevronDown size={20} color={colors.textMuted} />
            </View>
          </View>
        )}
      </Pressable>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
          <NavBar title={label} onBack={close} backIcon="close" />

          {searchable ? (
            <View style={styles.searchWrap}>
              <View style={styles.searchField}>
                <Search size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.brand}
                  keyboardAppearance={isDark ? "dark" : "light"}
                  autoCorrect={false}
                  accessibilityLabel={`Search ${label}`}
                />
              </View>
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    haptics.select();
                    onChange(item.value);
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: isSelected }}
                  style={styles.optionPressable}
                >
                  {({ pressed }) => (
                    <View
                      style={[styles.optionRow, pressed && styles.optionPressed]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {isSelected ? (
                        <Check size={20} color={colors.brand} strokeWidth={2.5} />
                      ) : null}
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
