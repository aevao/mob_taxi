import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import { MailCheck } from "lucide-react-native";
import { Button, CodeInput, NavBar } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { finishAuth } from "@/lib/authNavigation";
import { haptics } from "@/lib/haptics";
import { useCountdown } from "@/hooks/useCountdown";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { email = "", returnTo } = useLocalSearchParams<{
    email: string;
    returnTo?: string;
  }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { completeSignIn } = useApp();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(RESEND_SECONDS);

  const verify = async (value: string) => {
    if (verifying) return;
    setVerifying(true);
    setError(undefined);
    try {
      const session = await authApi.verifyEmail(email, value);
      await completeSignIn(session);
      haptics.success();
      finishAuth(router, returnTo);
    } catch (err) {
      haptics.warning();
      setCode("");
      setError(err instanceof Error ? err.message : "Couldn't verify the code.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (code.length === CODE_LENGTH) void verify(code);
  }, [code]);

  const resend = async () => {
    if (resending || countdown.remaining > 0) return;
    setResending(true);
    setError(undefined);
    try {
      await authApi.resendCode(email, "verify_email");
      haptics.success();
      countdown.restart(RESEND_SECONDS);
    } catch (err) {
      haptics.warning();
      if (err instanceof ApiError && err.retryAfter) {
        countdown.restart(err.retryAfter);
      }
      setError(err instanceof Error ? err.message : "Couldn't resend the code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar onBack={() => goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconCircle}>
            <MailCheck size={28} color={colors.brand} strokeWidth={1.75} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{" "}
            <Text style={styles.email}>{email}</Text>. It expires in 10 minutes.
          </Text>

          <CodeInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(undefined);
            }}
            error={error}
            disabled={verifying}
          />

          <Text style={styles.spam}>
            Can't find it? Check your spam or promotions folder.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Verify email"
            size="lg"
            onPress={() => verify(code)}
            disabled={code.length !== CODE_LENGTH}
            loading={verifying}
          />
          <Button
            title={
              countdown.remaining > 0
                ? `Resend code in ${countdown.remaining}s`
                : "Resend code"
            }
            variant="ghost"
            size="sm"
            onPress={resend}
            disabled={countdown.remaining > 0}
            loading={resending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.brandMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.h1, color: colors.text },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: -spacing.sm,
    },
    email: { ...typography.bodySmallMedium, color: colors.text },
    spam: { ...typography.caption, color: colors.textMuted },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
  });
}
