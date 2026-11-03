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
import { Button, NavBar, PasswordField, TextField } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { BRAND } from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { finishAuth } from "@/lib/authNavigation";
import { haptics } from "@/lib/haptics";
import { FormErrors, isEmail } from "@/lib/validation";

type Field = "email" | "password";

export default function SignInScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ returnTo?: string; email?: string }>();
  const styles = useThemedStyles(createStyles);
  const { completeSignIn } = useApp();

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSignIn = async () => {
    if (submitting) return;
    const next: FormErrors<Field> = {};
    if (!isEmail(email)) next.email = "Enter a valid email address";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) {
      haptics.warning();
      return;
    }

    setSubmitting(true);
    try {
      const session = await authApi.login(normalizedEmail, password);
      await completeSignIn(session);
      haptics.success();
      finishAuth(router, params.returnTo);
    } catch (error) {
      haptics.warning();
      if (error instanceof ApiError && error.code === "email_not_verified") {
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: normalizedEmail, returnTo: params.returnTo ?? "" },
        });
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Couldn't sign in. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar onBack={() => goBack()} backIcon="close" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Welcome back to {BRAND.name}. Use the email you signed up with.
          </Text>

          {formError ? (
            <View style={styles.formError}>
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <TextField
            label="Email address"
            icon={Mail}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            error={errors.email}
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Your password"
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
            error={errors.password}
          />

          <Button
            title="Forgot password?"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() =>
              router.push({
                pathname: "/(auth)/forgot-password",
                params: { email: normalizedEmail, returnTo: params.returnTo ?? "" },
              })
            }
            style={styles.forgot}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Sign in"
            size="lg"
            onPress={handleSignIn}
            loading={submitting}
          />
          <Button
            title={`New to ${BRAND.name}? Create account`}
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push({
                pathname: "/(auth)/register",
                params: { returnTo: params.returnTo ?? "" },
              })
            }
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
    },
    title: { ...typography.h1, color: colors.text },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    formError: {
      width: "100%",
      backgroundColor: colors.errorMuted,
      borderRadius: borderRadius.md,
      padding: spacing.ms,
      marginBottom: spacing.md,
    },
    formErrorText: { ...typography.bodySmall, color: colors.error },
    forgot: { alignSelf: "flex-end", marginTop: -spacing.xs },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
