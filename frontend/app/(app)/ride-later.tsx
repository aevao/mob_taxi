import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import { CalendarClock, Zap } from "lucide-react-native";
import { Card, Divider, ListRow, NavBar, SectionHeader } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { RIDE_LATER_OPTIONS, formatScheduledTime } from "@/constants/mockData";
import { ThemeColors, spacing, typography } from "@/constants/theme";

export default function RideLaterScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { booking, updateOrderDetails } = useApp();
  const styles = useThemedStyles(createStyles);

  const isScheduled = booking.orderDetails.scheduleType === "later";

  const leave = () => {
    if (next === "where-to") {
      router.replace("/(app)/where-to");
    } else {
      goBack();
    }
  };

  const selectTime = (offsetMinutes: number, label: string) => {
    const scheduled = new Date(Date.now() + offsetMinutes * 60 * 1000);
    updateOrderDetails({
      scheduleType: "later",
      scheduledFor: scheduled.toISOString(),
      pickupTime: label,
    });
    leave();
  };

  const selectNow = () => {
    updateOrderDetails({
      scheduleType: "now",
      scheduledFor: null,
      pickupTime: "ASAP",
    });
    leave();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar title="Pickup time" onBack={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Choose when your WHYP vehicle should arrive.
        </Text>

        <View style={styles.block}>
          <SectionHeader title="Right away" />
          <Card>
            <ListRow
              icon={Zap}
              iconTint={isScheduled ? "muted" : "brand"}
              title="Ride now"
              subtitle="Match with the closest available driver"
              value={isScheduled ? undefined : "Selected"}
              onPress={selectNow}
              style={styles.rowInset}
            />
          </Card>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Schedule ahead" />
          <Card>
            {RIDE_LATER_OPTIONS.map((option, index) => {
              const preview = formatScheduledTime(
                new Date(Date.now() + option.offsetMinutes * 60 * 1000).toISOString()
              );
              return (
                <View key={option.id}>
                  {index > 0 ? <Divider inset={52} /> : null}
                  <ListRow
                    icon={CalendarClock}
                    title={option.label}
                    subtitle={preview}
                    onPress={() => selectTime(option.offsetMinutes, option.label)}
                    style={styles.rowInset}
                  />
                </View>
              );
            })}
          </Card>
        </View>

        {isScheduled ? (
          <Text style={styles.currentNote}>
            Currently scheduled for{" "}
            {formatScheduledTime(booking.orderDetails.scheduledFor)}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    lead: { ...typography.bodySmall, color: colors.textSecondary },
    block: { width: "100%" },
    rowInset: { paddingHorizontal: spacing.md },
    currentNote: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
}
