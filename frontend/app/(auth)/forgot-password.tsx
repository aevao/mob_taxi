import React, { useState } from "react";
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
import { Mail } from "lucide-react-native";
import {
  Button,
  CodeInput,
  NavBar,
  PasswordField,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useCountdown } from "@/hooks/useCountdown";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { finishAuth } from "@/lib/authNavigation";
import { haptics } from "@/lib/haptics";
import { FormErrors, isEmail, passwordError } from "@/lib/validation";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

type Step = "email" | "reset";
type Field = "email" | "code" | "password" | "confirmPassword";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ email?: string; returnTo?: string }>();
  const styles = useThemedStyles(createStyles);
  const { completeSignIn } = useApp();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(0);

  const normalizedEmail = email.trim().toLowerCase();

  const clear = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const sendCode = async () => {
    if (submitting) return;
    if (!isEmail(email)) {
      setErrors({ email: "Enter a valid email address" });
      haptics.warning();
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPassword(normalizedEmail);
      haptics.success();
      countdown.restart(RESEND_SECONDS);
      setStep("reset");
    } catch (error) {
      haptics.warning();
      setErrors({
        email: error instanceof Error ? error.message : "Couldn't send the code.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resending || countdown.remaining > 0) return;
    setResending(true);
    try {
      await authApi.resendCode(normalizedEmail, "reset_password");
      haptics.success();
      countdown.restart(RESEND_SECONDS);
    } catch (error) {
      haptics.warning();
      if (error instanceof ApiError && error.retryAfter) {
        countdown.restart(error.retryAfter);
      }
      setErrors({
        code: error instanceof Error ? error.message : "Couldn't resend the code.",
      });
    } finally {
      setResending(false);
    }
  };

  const resetPassword = async () => {
    if (submitting) return;
    const next: FormErrors<Field> = {};
    if (code.length !== CODE_LENGTH) next.code = "Enter the 6-digit code";
    const pwError = passwordError(password);
    if (pwError) next.password = pwError;
    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptics.warning();
      return;
    }

    setSubmitting(true);
    try {
      const session = await authApi.resetPassword(normalizedEmail, code, password);
      await completeSignIn(session);
      haptics.success();
      finishAuth(router, params.returnTo);
    } catch (error) {
      haptics.warning();
      const message =
        error instanceof Error ? error.message : "Couldn't reset the password.";
      if (error instanceof ApiError && error.code === "weak_password") {
        setErrors({ password: message });
      } else {
        setCode("");
        setErrors({ code: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar
        onBack={() => (step === "reset" ? setStep("email") : goBack())}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "email" ? (
            <>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>
                Enter your account email and we'll send you a 6-digit code.
              </Text>
              <TextField
                label="Email address"
                icon={Mail}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clear("email");
                }}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={sendCode}
                autoFocus={!params.email}
                error={errors.email}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter code</Text>
              <Text style={styles.subtitle}>
                If an account exists for{" "}
                <Text style={styles.email}>{normalizedEmail}</Text>, you'll get
                a code in a moment.
              </Text>

              <CodeInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  clear("code");
                }}
                error={errors.code}
                disabled={submitting}
              />
              <Button
                title={
                  countdown.remaining > 0
                    ? `Resend code in ${countdown.remaining}s`
                    : "Resend code"
                }
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={resend}
                disabled={countdown.remaining > 0}
                loading={resending}
                style={styles.resend}
              />

              <SectionHeader title="New password" />
              <PasswordField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clear("password");
                }}
                placeholder="At least 8 characters"
                visible={showPassword}
                onToggleVisible={() => setShowPassword((prev) => !prev)}
                textContentType="newPassword"
                autoComplete="new-password"
                hint="8+ characters with a letter and a number"
                error={errors.password}
              />
              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clear("confirmPassword");
                }}
                placeholder="Repeat password"
                visible={showPassword}
                showToggle={false}
                textContentType="newPassword"
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === "email" ? (
            <Button
              title="Send code"
              size="lg"
              onPress={sendCode}
              loading={submitting}
            />
          ) : (
            <Button
              title="Reset password"
              size="lg"
              onPress={resetPassword}
              loading={submitting}
            />
          )}
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
    },
    title: { ...typography.h1, color: colors.text },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    email: { ...typography.bodySmallMedium, color: colors.text },
    resend: { alignSelf: "flex-start", marginTop: spacing.sm, marginBottom: spacing.sm },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
