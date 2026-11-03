import React from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import { CreditCard, Mail, MapPin, Phone } from "lucide-react-native";
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
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatAddress } from "@/constants/mockData";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { formatUSPhone } from "@/lib/formatters";
import { haptics } from "@/lib/haptics";

export default function AccountScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const styles = useThemedStyles(createStyles);
  const { user, paymentMethods, logout } = useApp();

  if (!user) return <Redirect href="/(app)/home" />;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const defaultCard =
    paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];

  const confirmSignOut = () => {
    haptics.warning();
    Alert.alert("Sign out?", "You'll need your email and password to sign back in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.dismissTo("/(app)/home");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar title="Account" onBack={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {user.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          {user.emailVerified ? <Badge tone="brand" label="Email verified" /> : null}
        </View>

        <View>
          <SectionHeader title="Contact" />
          <Card>
            <ListRow icon={Mail} title={user.email} style={styles.rowInset} />
            <Divider inset={52} />
            <ListRow
              icon={Phone}
              title={formatUSPhone(user.phone)}
              style={styles.rowInset}
            />
          </Card>
        </View>

        <View>
          <SectionHeader title="Payment" />
          <Card>
            {user.billingAddress ? (
              <>
                <ListRow
                  icon={MapPin}
                  title="Billing address"
                  subtitle={formatAddress(user.billingAddress)}
                  style={styles.rowInset}
                />
                <Divider inset={52} />
              </>
            ) : null}
            <ListRow
              icon={CreditCard}
              title={defaultCard ? defaultCard.label : "Add a payment method"}
              subtitle={defaultCard ? "Default card" : "Required before booking"}
              onPress={() =>
                router.push({
                  pathname: "/(auth)/add-payment",
                  params: { returnTo: "/(app)/home" },
                })
              }
              style={styles.rowInset}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Sign out" variant="outline" size="lg" onPress={confirmSignOut} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    hero: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceAlt,
    },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    initials: { ...typography.h2, color: colors.textSecondary },
    name: { ...typography.h2, color: colors.text },
    rowInset: { paddingHorizontal: spacing.md },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
    },
  });
}
