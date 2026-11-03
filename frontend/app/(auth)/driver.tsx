import React, { useCallback, useRef, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Car, Clock, FileCheck, Mail, Phone } from "lucide-react-native";
import {
  Badge,
  Button,
  Card,
  Divider,
  ListRow,
  NavBar,
  SectionHeader,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useGoBack } from "@/hooks/useGoBack";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { BRAND } from "@/constants/mockData";
import { formatUSPhone } from "@/lib/formatters";
import { ThemeColors, spacing, typography } from "@/constants/theme";

const STATUS_COPY = {
  pending_review: {
    badge: "In review",
    tone: "brand",
    body: "We're verifying your documents and running a background check. This usually takes 3–5 business days — we'll email you when it's done.",
  },
  approved: {
    badge: "Approved",
    tone: "success",
    body: "You're approved to drive with WHYP. We'll email you when driver mode opens in your city.",
  },
  rejected: {
    badge: "Not approved",
    tone: "warning",
    body: "We couldn't approve your application. You can fix the issue below and apply again.",
  },
} as const;

export default function DriverStatusScreen() {
  const router = useRouter();
  const { setRole, driverApplication, refreshDriverApplication } = useApp();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const goBack = useGoBack("/");
  const [refreshing, setRefreshing] = useState(false);

  const refreshRef = useRef(refreshDriverApplication);
  refreshRef.current = refreshDriverApplication;
  const applicationId = driverApplication?.id;

  useFocusEffect(
    useCallback(() => {
      if (applicationId) refreshRef.current().catch(() => undefined);
    }, [applicationId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRef.current().catch(() => undefined);
    setRefreshing(false);
  };

  const switchToPassenger = () => {
    setRole("passenger");
    router.replace("/(app)/home");
  };

  if (!driverApplication) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <NavBar onBack={goBack} backIcon="close" />
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Car size={40} color={colors.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Drive with {BRAND.name}</Text>
          <Text style={styles.description}>
            Apply in about 10 minutes. Have your driver's license, vehicle
            registration and insurance card ready.
          </Text>
        </View>
        <View style={styles.footer}>
          <Button
            title="Start application"
            size="lg"
            onPress={() => router.push("/(auth)/driver-register")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { vehicle } = driverApplication;
  const copy = STATUS_COPY[driverApplication.status];
  const isRejected = driverApplication.status === "rejected";
  const submitted = new Date(driverApplication.submittedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar title="Driver application" onBack={goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        }
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: driverApplication.profilePhotoUri }}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {driverApplication.firstName} {driverApplication.lastName}
          </Text>
          <Badge tone={copy.tone} label={copy.badge} />
          <Text style={styles.description}>{copy.body}</Text>
        </View>

        {isRejected && driverApplication.reviewNote ? (
          <Card variant="filled" padded>
            <Text style={styles.noteLabel}>Reviewer's note</Text>
            <Text style={styles.noteText}>{driverApplication.reviewNote}</Text>
          </Card>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Vehicle" />
          <Card>
            <ListRow
              icon={Car}
              title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              subtitle={`${vehicle.color} · ${vehicle.plate}`}
              style={styles.rowInset}
            />
            <Divider inset={52} />
            <ListRow
              icon={FileCheck}
              title="Registration and insurance"
              subtitle="Received"
              style={styles.rowInset}
            />
          </Card>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Contact" />
          <Card>
            <ListRow
              icon={Phone}
              title={formatUSPhone(driverApplication.phone)}
              style={styles.rowInset}
            />
            <Divider inset={52} />
            <ListRow
              icon={Mail}
              title={driverApplication.email}
              style={styles.rowInset}
            />
            <Divider inset={52} />
            <ListRow
              icon={Clock}
              title="Submitted"
              value={submitted}
              style={styles.rowInset}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isRejected ? (
          <Button
            title="Apply again"
            size="lg"
            onPress={() => router.push("/(auth)/driver-register")}
          />
        ) : null}
        <Button
          title="Continue as passenger"
          variant={isRejected ? "ghost" : "secondary"}
          size="lg"
          onPress={switchToPassenger}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      gap: spacing.ms,
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { ...typography.h1, color: colors.text, textAlign: "center" },
    description: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: "center",
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    hero: { alignItems: "center", gap: spacing.sm },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceAlt,
    },
    name: { ...typography.h2, color: colors.text },
    noteLabel: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    noteText: { ...typography.body, color: colors.text },
    block: { width: "100%" },
    rowInset: { paddingHorizontal: spacing.md },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      gap: spacing.sm,
    },
  });
}
