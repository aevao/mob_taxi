import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import { Apple, CreditCard, Smartphone, Wallet } from "lucide-react-native";
import {
  Badge,
  Button,
  Card,
  Divider,
  ListRow,
  NavBar,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

export default function AddPaymentScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { addPaymentMethod, paymentMethods } = useApp();
  const styles = useThemedStyles(createStyles);

  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState<string | undefined>();

  const finish = () => router.dismissTo(((returnTo as string) || "/(app)/home") as never);

  const saveCard = () => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12) {
      setError("Enter a valid card number");
      haptics.warning();
      return;
    }

    addPaymentMethod({
      type: "card",
      label: `Visa •••• ${digits.slice(-4)}`,
      last4: digits.slice(-4),
      isDefault: paymentMethods.length === 0,
    });

    haptics.success();
    Alert.alert("Card added", "Your card is ready to use.", [
      { text: "Done", onPress: finish },
    ]);
  };

  const addWallet = (type: "apple_pay" | "google_pay", label: string) => {
    addPaymentMethod({
      type,
      label,
      isDefault: paymentMethods.length === 0,
    });
    haptics.success();
    Alert.alert("Wallet connected", `${label} is ready to use.`, [
      { text: "Done", onPress: finish },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar title="Payment" onBack={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {paymentMethods.length > 0 ? (
          <View style={styles.block}>
            <SectionHeader title="Saved methods" />
            <Card>
              {paymentMethods.map((method, index) => (
                <View key={method.id}>
                  {index > 0 ? <Divider inset={52} /> : null}
                  <ListRow
                    icon={method.type === "card" ? CreditCard : Wallet}
                    title={method.label}
                    subtitle={method.isDefault ? "Default method" : undefined}
                    showChevron={false}
                    style={styles.rowInset}
                  />
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Add a card" />
          <TextField
            icon={CreditCard}
            value={cardNumber}
            onChangeText={(text) => {
              setCardNumber(text);
              if (error) setError(undefined);
            }}
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            maxLength={19}
            error={error}
            hint="Demo mode — no real charges are made"
          />
          <Button title="Save card" onPress={saveCard} />
        </View>

        <View style={styles.block}>
          <SectionHeader title="Digital wallets" />
          <Card>
            <ListRow
              icon={Apple}
              title="Apple Pay"
              onPress={() => addWallet("apple_pay", "Apple Pay")}
              style={styles.rowInset}
            />
            <Divider inset={52} />
            <ListRow
              icon={Smartphone}
              title="Google Pay"
              onPress={() => addWallet("google_pay", "Google Pay")}
              style={styles.rowInset}
            />
          </Card>
        </View>

        <View style={styles.badgeWrap}>
          <Badge tone="brand" label="Secured demo checkout" />
        </View>
        <Text style={styles.note}>
          Payments are mocked for this demo. No card data leaves the device.
        </Text>
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
    block: { width: "100%" },
    rowInset: { paddingHorizontal: spacing.md },
    badgeWrap: { alignItems: "center" },
    note: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}
