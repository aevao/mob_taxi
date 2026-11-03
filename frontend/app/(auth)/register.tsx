import React, { useState } from "react";
import {
  Alert,
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
import { Building2, Hash, Mail, MapPin, Phone, User } from "lucide-react-native";
import {
  Button,
  NavBar,
  PasswordField,
  PhotoField,
  SectionHeader,
  SelectField,
  TextField,
} from "@/components/ui";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { BRAND } from "@/constants/mockData";
import { US_STATES } from "@/constants/usStates";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { formatUSPhone, formatZip, toE164US } from "@/lib/formatters";
import { haptics } from "@/lib/haptics";
import type { CapturedPhoto } from "@/lib/photoCapture";
import { saveProfilePhoto } from "@/lib/session";
import {
  FormErrors,
  isEmail,
  isUSPhone,
  isZip,
  passwordError,
} from "@/lib/validation";

type Field =
  | "firstName"
  | "lastName"
  | "phone"
  | "email"
  | "street"
  | "city"
  | "state"
  | "zip"
  | "password"
  | "confirmPassword"
  | "photo";

const SERVER_FIELD: Record<string, Field> = {
  invalid_email: "email",
  email_taken: "email",
  invalid_phone: "phone",
  invalid_name: "firstName",
  invalid_address: "street",
  weak_password: "password",
};

export default function CustomerRegistrationScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const styles = useThemedStyles(createStyles);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("IL");
  const [zip, setZip] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors<Field> => {
    const next: FormErrors<Field> = {};
    if (!firstName.trim()) next.firstName = "Required";
    if (!lastName.trim()) next.lastName = "Required";
    if (!isUSPhone(phone)) next.phone = "Enter a valid US phone number";
    if (!isEmail(email)) next.email = "Enter a valid email address";
    if (!street.trim()) next.street = "Enter the street address";
    if (!city.trim()) next.city = "Required";
    if (!state) next.state = "Required";
    if (!isZip(zip)) next.zip = "5-digit ZIP";
    const pwError = passwordError(password);
    if (pwError) next.password = pwError;
    if (!confirmPassword) next.confirmPassword = "Confirm your password";
    else if (confirmPassword !== password) {
      next.confirmPassword = "Passwords don't match";
    }
    if (!photo) next.photo = "Take a live profile photo";
    return next;
  };

  const goToSignIn = () =>
    router.replace({
      pathname: "/(auth)/login",
      params: { returnTo: returnTo ?? "", email: email.trim().toLowerCase() },
    });

  const handleSubmit = async () => {
    if (submitting) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !photo) {
      haptics.warning();
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: toE164US(phone),
        email: normalizedEmail,
        billingAddress: {
          street: street.trim(),
          unit: unit.trim() || undefined,
          city: city.trim(),
          state,
          zip,
        },
        password,
      });
      await saveProfilePhoto(normalizedEmail, photo.uri);

      haptics.success();
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: normalizedEmail, returnTo: returnTo ?? "" },
      });
    } catch (error) {
      haptics.warning();
      if (error instanceof ApiError && SERVER_FIELD[error.code]) {
        setErrors({ [SERVER_FIELD[error.code]]: error.message });
        if (error.code === "email_taken") {
          Alert.alert("Account already exists", error.message, [
            { text: "Cancel", style: "cancel" },
            { text: "Sign in", onPress: goToSignIn },
          ]);
        }
        return;
      }
      Alert.alert(
        "Couldn't create account",
        error instanceof Error ? error.message : "Try again."
      );
    } finally {
      setSubmitting(false);
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Book {BRAND.fullName} rides across Chicago. You'll add payment and
            pickup preferences after sign-up.
          </Text>

          <SectionHeader title="Personal information" />
          <View style={styles.pair}>
            <TextField
              label="First name"
              icon={User}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                clear("firstName");
              }}
              placeholder="John"
              autoCapitalize="words"
              textContentType="givenName"
              autoComplete="name-given"
              error={errors.firstName}
              containerStyle={styles.half}
            />
            <TextField
              label="Last name"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                clear("lastName");
              }}
              placeholder="Doe"
              autoCapitalize="words"
              textContentType="familyName"
              autoComplete="name-family"
              error={errors.lastName}
              containerStyle={styles.half}
            />
          </View>

          <TextField
            label="Phone number"
            icon={Phone}
            value={phone}
            onChangeText={(text) => {
              setPhone(formatUSPhone(text));
              clear("phone");
            }}
            placeholder="(312) 555-0100"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            hint="US mobile number"
            error={errors.phone}
          />

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
            hint="We'll send a 6-digit code to confirm it"
            error={errors.email}
          />

          <SectionHeader title="Billing address" />
          <Text style={styles.sectionNote}>
            Must match the billing address on the card you'll add.
          </Text>
          <TextField
            label="Street address"
            icon={MapPin}
            value={street}
            onChangeText={(text) => {
              setStreet(text);
              clear("street");
            }}
            placeholder="233 S Wacker Dr"
            textContentType="streetAddressLine1"
            autoComplete="street-address"
            error={errors.street}
          />
          <TextField
            label="Apt, suite (optional)"
            icon={Building2}
            value={unit}
            onChangeText={setUnit}
            placeholder="Suite 100"
            textContentType="streetAddressLine2"
          />
          <TextField
            label="City"
            value={city}
            onChangeText={(text) => {
              setCity(text);
              clear("city");
            }}
            placeholder="Chicago"
            autoCapitalize="words"
            textContentType="addressCity"
            error={errors.city}
          />
          <View style={styles.pair}>
            <View style={styles.half}>
              <SelectField
                label="State"
                value={state}
                options={US_STATES}
                onChange={(value) => {
                  setState(value);
                  clear("state");
                }}
                searchable
                error={errors.state}
              />
            </View>
            <TextField
              label="ZIP code"
              icon={Hash}
              value={zip}
              onChangeText={(text) => {
                setZip(formatZip(text));
                clear("zip");
              }}
              placeholder="60606"
              keyboardType="number-pad"
              textContentType="postalCode"
              autoComplete="postal-code"
              maxLength={5}
              error={errors.zip}
              containerStyle={styles.half}
            />
          </View>

          <SectionHeader title="Account security" />
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
            error={errors.password}
            hint="8+ characters with a letter and a number"
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
          <PhotoField
            label="Profile photo"
            selfie
            value={photo}
            onChange={(next) => {
              setPhoto(next);
              clear("photo");
            }}
            hint="Taken with your camera now so drivers can recognize you"
            error={errors.photo}
          />

          <Button
            title="Already have an account? Sign in"
            variant="ghost"
            size="sm"
            onPress={goToSignIn}
            style={styles.switchLink}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create account"
            size="lg"
            onPress={handleSubmit}
            loading={submitting}
          />
          <Text style={styles.legal}>
            By continuing you agree to the {BRAND.name} terms of service and
            privacy policy.
          </Text>
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
    sectionNote: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: -spacing.xs,
      marginBottom: spacing.ms,
    },
    pair: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.ms,
    },
    half: { flex: 1, width: "auto", minWidth: 0 },
    switchLink: { marginTop: spacing.sm },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    legal: {
      ...typography.micro,
      fontWeight: "400",
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.sm,
    },
  });
}
