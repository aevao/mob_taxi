import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import {
  Building2,
  Calendar,
  Car,
  Check,
  Eye,
  EyeOff,
  Hash,
  Mail,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react-native";
import {
  Button,
  NavBar,
  PhotoField,
  SectionHeader,
  SelectField,
  TextField,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  BRAND,
  VEHICLE_PHOTO_SLOTS,
  VehiclePhotoSlot,
} from "@/constants/mockData";
import { US_STATES } from "@/constants/usStates";
import {
  VEHICLE_CATALOG,
  VEHICLE_COLORS,
  VEHICLE_MAKES,
  vehicleYears,
} from "@/constants/vehicles";
import {
  ThemeColors,
  borderRadius,
  hitSlop,
  spacing,
  typography,
} from "@/constants/theme";
import {
  digitsOnly,
  formatDateInput,
  formatPlate,
  formatSSN,
  formatUSPhone,
  formatZip,
  toE164US,
} from "@/lib/formatters";
import { haptics } from "@/lib/haptics";
import type { CapturedPhoto } from "@/lib/photoCapture";
import {
  DRIVER_MIN_AGE,
  FormErrors,
  ageOn,
  isEmail,
  isSSN,
  isUSPhone,
  isZip,
  parseUSDate,
} from "@/lib/validation";

const STEPS = [
  "Personal information",
  "Driver information",
  "Vehicle information",
  "Vehicle photos",
] as const;

const YEARS = vehicleYears();

type PhotoMap = Record<VehiclePhotoSlot, CapturedPhoto | null>;

const EMPTY_VEHICLE_PHOTOS: PhotoMap = {
  exteriorFront: null,
  exteriorRear: null,
  interiorFront: null,
  interiorRear: null,
};

export default function DriverRegistrationScreen() {
  const router = useRouter();
  const goBack = useGoBack("/");
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { submitDriverApplication } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors<string>>({});

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    ssn: "",
    street: "",
    unit: "",
    city: "",
    state: "IL",
    zip: "",
  });
  const [showSSN, setShowSSN] = useState(false);

  const [licensePhoto, setLicensePhoto] = useState<CapturedPhoto | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<CapturedPhoto | null>(null);

  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    plate: "",
  });
  const [registrationDoc, setRegistrationDoc] = useState<CapturedPhoto | null>(
    null
  );
  const [insuranceDoc, setInsuranceDoc] = useState<CapturedPhoto | null>(null);
  const [vehiclePhotos, setVehiclePhotos] =
    useState<PhotoMap>(EMPTY_VEHICLE_PHOTOS);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setPersonalField = (field: keyof typeof personal, value: string) => {
    setPersonal((prev) => ({ ...prev, [field]: value }));
    clear(field);
  };

  const setVehicleField = (field: keyof typeof vehicle, value: string) => {
    setVehicle((prev) =>
      field === "make"
        ? { ...prev, make: value, model: "" }
        : { ...prev, [field]: value }
    );
    clear(field);
  };

  const validateStep = (index: number): FormErrors<string> => {
    const next: FormErrors<string> = {};

    if (index === 0) {
      if (!personal.firstName.trim()) next.firstName = "Required";
      if (!personal.lastName.trim()) next.lastName = "Required";
      if (!isUSPhone(personal.phone)) next.phone = "Enter a valid US phone number";
      if (!isEmail(personal.email)) next.email = "Enter a valid email address";
      const dob = parseUSDate(personal.dob);
      if (!dob) next.dob = "Use MM/DD/YYYY";
      else if (ageOn(dob) < DRIVER_MIN_AGE) {
        next.dob = `Drivers must be at least ${DRIVER_MIN_AGE}`;
      } else if (ageOn(dob) > 100) next.dob = "Check the year";
      if (!isSSN(personal.ssn)) next.ssn = "Enter a valid 9-digit SSN";
      if (!personal.street.trim()) next.street = "Enter the street address";
      if (!personal.city.trim()) next.city = "Required";
      if (!isZip(personal.zip)) next.zip = "5-digit ZIP";
    }

    if (index === 1) {
      if (!licensePhoto) next.licensePhoto = "Take a live photo of your license";
      if (!profilePhoto) next.profilePhoto = "Take a live profile photo";
    }

    if (index === 2) {
      if (!vehicle.make) next.make = "Select a make";
      if (!vehicle.model) next.model = "Select a model";
      if (!vehicle.year) next.year = "Select a year";
      if (!vehicle.color) next.color = "Select a color";
      if (vehicle.plate.replace(/[\s-]/g, "").length < 2) {
        next.plate = "Enter the plate number";
      }
      if (!registrationDoc) next.registrationDoc = "Add your vehicle registration";
      if (!insuranceDoc) next.insuranceDoc = "Add proof of insurance";
    }

    if (index === 3) {
      for (const slot of VEHICLE_PHOTO_SLOTS) {
        if (!vehiclePhotos[slot.id]) next[slot.id] = "Live photo required";
      }
      if (!consent) next.consent = "Required to process your application";
    }

    return next;
  };

  const goToStep = (index: number) => {
    setStep(index);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBack = () => {
    if (step === 0) {
      goBack();
      return;
    }
    goToStep(step - 1);
  };

  const handleContinue = async () => {
    if (submitting) return;
    const nextErrors = validateStep(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      haptics.warning();
      return;
    }

    if (step < STEPS.length - 1) {
      goToStep(step + 1);
      return;
    }

    if (!licensePhoto || !profilePhoto || !registrationDoc || !insuranceDoc) {
      return;
    }

    setSubmitting(true);
    try {
      await submitDriverApplication({
        firstName: personal.firstName.trim(),
        lastName: personal.lastName.trim(),
        phone: toE164US(personal.phone),
        email: personal.email.trim().toLowerCase(),
        dateOfBirth: personal.dob,
        ssnLast4: digitsOnly(personal.ssn).slice(-4),
        currentAddress: {
          street: personal.street.trim(),
          unit: personal.unit.trim() || undefined,
          city: personal.city.trim(),
          state: personal.state,
          zip: personal.zip,
        },
        licensePhotoUri: licensePhoto.uri,
        profilePhotoUri: profilePhoto.uri,
        vehicle: {
          ...vehicle,
          plate: vehicle.plate.trim(),
          registrationUri: registrationDoc.uri,
          insuranceUri: insuranceDoc.uri,
          photos: {
            exteriorFront: vehiclePhotos.exteriorFront?.uri ?? "",
            exteriorRear: vehiclePhotos.exteriorRear?.uri ?? "",
            interiorFront: vehiclePhotos.interiorFront?.uri ?? "",
            interiorRear: vehiclePhotos.interiorRear?.uri ?? "",
          },
        },
      });
    } catch (error) {
      haptics.warning();
      Alert.alert(
        "Couldn't submit application",
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Try again."
      );
      return;
    } finally {
      setSubmitting(false);
    }

    haptics.success();
    router.replace("/(auth)/driver");
  };

  const ssnToggle = (
    <Pressable
      onPress={() => {
        haptics.select();
        setShowSSN((prev) => !prev);
      }}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={showSSN ? "Hide SSN" : "Show SSN"}
    >
      {showSSN ? (
        <EyeOff size={20} color={colors.textMuted} />
      ) : (
        <Eye size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );

  const renderPersonal = () => (
    <>
      <View style={styles.pair}>
        <TextField
          label="First name"
          icon={User}
          value={personal.firstName}
          onChangeText={(text) => setPersonalField("firstName", text)}
          placeholder="John"
          autoCapitalize="words"
          textContentType="givenName"
          error={errors.firstName}
          containerStyle={styles.half}
        />
        <TextField
          label="Last name"
          value={personal.lastName}
          onChangeText={(text) => setPersonalField("lastName", text)}
          placeholder="Doe"
          autoCapitalize="words"
          textContentType="familyName"
          error={errors.lastName}
          containerStyle={styles.half}
        />
      </View>
      <TextField
        label="Phone number"
        icon={Phone}
        value={personal.phone}
        onChangeText={(text) => setPersonalField("phone", formatUSPhone(text))}
        placeholder="(312) 555-0100"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        error={errors.phone}
      />
      <TextField
        label="Email address"
        icon={Mail}
        value={personal.email}
        onChangeText={(text) => setPersonalField("email", text)}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        error={errors.email}
      />
      <TextField
        label="Date of birth"
        icon={Calendar}
        value={personal.dob}
        onChangeText={(text) => setPersonalField("dob", formatDateInput(text))}
        placeholder="MM/DD/YYYY"
        keyboardType="number-pad"
        maxLength={10}
        error={errors.dob}
        hint={`You must be ${DRIVER_MIN_AGE} or older`}
      />
      <TextField
        label="Social Security number"
        icon={ShieldCheck}
        value={personal.ssn}
        onChangeText={(text) => setPersonalField("ssn", formatSSN(text))}
        placeholder="123-45-6789"
        keyboardType="number-pad"
        secureTextEntry={!showSSN}
        maxLength={11}
        autoComplete="off"
        textContentType="none"
        trailing={ssnToggle}
        error={errors.ssn}
        hint="Encrypted and used only for your background check"
      />

      <SectionHeader title="Current address" />
      <TextField
        label="Street address"
        icon={MapPin}
        value={personal.street}
        onChangeText={(text) => setPersonalField("street", text)}
        placeholder="1060 W Addison St"
        textContentType="streetAddressLine1"
        error={errors.street}
      />
      <TextField
        label="Apt, suite (optional)"
        icon={Building2}
        value={personal.unit}
        onChangeText={(text) => setPersonalField("unit", text)}
        placeholder="Apt 2B"
        textContentType="streetAddressLine2"
      />
      <TextField
        label="City"
        value={personal.city}
        onChangeText={(text) => setPersonalField("city", text)}
        placeholder="Chicago"
        autoCapitalize="words"
        textContentType="addressCity"
        error={errors.city}
      />
      <View style={styles.pair}>
        <View style={styles.half}>
          <SelectField
            label="State"
            value={personal.state}
            options={US_STATES}
            onChange={(value) => setPersonalField("state", value)}
            searchable
          />
        </View>
        <TextField
          label="ZIP code"
          icon={Hash}
          value={personal.zip}
          onChangeText={(text) => setPersonalField("zip", formatZip(text))}
          placeholder="60613"
          keyboardType="number-pad"
          maxLength={5}
          textContentType="postalCode"
          error={errors.zip}
          containerStyle={styles.half}
        />
      </View>
    </>
  );

  const renderDriverInfo = () => (
    <>
      <Text style={styles.stepNote}>
        Both photos are taken live with your camera — uploads from the gallery
        aren't accepted.
      </Text>
      <PhotoField
        label="Driver's license"
        value={licensePhoto}
        onChange={(photo) => {
          setLicensePhoto(photo);
          clear("licensePhoto");
        }}
        hint="Front side, all four corners visible, no glare"
        error={errors.licensePhoto}
      />
      <PhotoField
        label="Profile photo"
        selfie
        value={profilePhoto}
        onChange={(photo) => {
          setProfilePhoto(photo);
          clear("profilePhoto");
        }}
        hint="Face the camera in good light, no sunglasses or hats"
        error={errors.profilePhoto}
      />
    </>
  );

  const renderVehicle = () => (
    <>
      <SelectField
        label="Make"
        icon={Car}
        value={vehicle.make}
        options={VEHICLE_MAKES}
        onChange={(value) => setVehicleField("make", value)}
        placeholder="Select make"
        searchable
        error={errors.make}
      />
      <SelectField
        label="Model"
        value={vehicle.model}
        options={vehicle.make ? VEHICLE_CATALOG[vehicle.make] ?? [] : []}
        onChange={(value) => setVehicleField("model", value)}
        placeholder={vehicle.make ? "Select model" : "Select a make first"}
        disabled={!vehicle.make}
        error={errors.model}
      />
      <View style={styles.pair}>
        <View style={styles.half}>
          <SelectField
            label="Year"
            icon={Calendar}
            value={vehicle.year}
            options={YEARS}
            onChange={(value) => setVehicleField("year", value)}
            placeholder="Year"
            error={errors.year}
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Color"
            icon={Palette}
            value={vehicle.color}
            options={VEHICLE_COLORS}
            onChange={(value) => setVehicleField("color", value)}
            placeholder="Color"
            error={errors.color}
          />
        </View>
      </View>
      <TextField
        label="License plate number"
        icon={Hash}
        value={vehicle.plate}
        onChangeText={(text) => setVehicleField("plate", formatPlate(text))}
        placeholder="AB 12345"
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.plate}
      />

      <SectionHeader title="Documents" />
      <PhotoField
        label="Vehicle registration"
        mode="document"
        value={registrationDoc}
        onChange={(photo) => {
          setRegistrationDoc(photo);
          clear("registrationDoc");
        }}
        hint="Current registration card showing the plate and VIN"
        error={errors.registrationDoc}
      />
      <PhotoField
        label="Proof of insurance"
        mode="document"
        value={insuranceDoc}
        onChange={(photo) => {
          setInsuranceDoc(photo);
          clear("insuranceDoc");
        }}
        hint="Insurance card with your name, vehicle and valid dates"
        error={errors.insuranceDoc}
      />
    </>
  );

  const renderVehiclePhotos = () => (
    <>
      <Text style={styles.stepNote}>
        Take each photo live, in daylight, with the whole area in frame.
      </Text>
      {VEHICLE_PHOTO_SLOTS.map((slot) => (
        <PhotoField
          key={slot.id}
          label={slot.label}
          value={vehiclePhotos[slot.id]}
          onChange={(photo) => {
            setVehiclePhotos((prev) => ({ ...prev, [slot.id]: photo }));
            clear(slot.id);
          }}
          error={errors[slot.id]}
        />
      ))}

      <Pressable
        onPress={() => {
          haptics.select();
          setConsent((prev) => !prev);
          clear("consent");
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        accessibilityLabel="Authorize background check"
        style={styles.consentPressable}
      >
        <View style={styles.consentRow}>
          <View
            style={[
              styles.checkbox,
              consent && styles.checkboxOn,
              !!errors.consent && styles.checkboxError,
            ]}
          >
            {consent ? (
              <Check size={13} color={colors.onBrand} strokeWidth={3.5} />
            ) : null}
          </View>
          <Text style={styles.consentText}>
            I authorize {BRAND.fullName} to run a background check and driving
            record review, and confirm the information above is accurate.
          </Text>
        </View>
      </Pressable>
      {errors.consent ? (
        <Text style={styles.consentError}>{errors.consent}</Text>
      ) : null}
    </>
  );

  const isLastStep = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar
        title="Drive with WHYP"
        onBack={handleBack}
        backIcon={step === 0 ? "close" : "arrow"}
      />

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          {STEPS.map((label, index) => (
            <View
              key={label}
              style={[
                styles.progressSegment,
                index <= step && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          Step {step + 1} of {STEPS.length}
        </Text>
        <Text style={styles.stepTitle}>{STEPS[step]}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? renderPersonal() : null}
          {step === 1 ? renderDriverInfo() : null}
          {step === 2 ? renderVehicle() : null}
          {step === 3 ? renderVehiclePhotos() : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isLastStep ? "Submit application" : "Continue"}
            size="lg"
            loading={submitting}
            onPress={handleContinue}
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
    progressBlock: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    progressTrack: {
      width: "100%",
      flexDirection: "row",
      gap: spacing.xs,
      marginBottom: spacing.ms,
    },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceAlt,
    },
    progressSegmentActive: { backgroundColor: colors.brand },
    stepLabel: { ...typography.caption, color: colors.textSecondary },
    stepTitle: { ...typography.h2, color: colors.text, marginTop: 2 },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    stepNote: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    pair: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.ms,
    },
    half: { flex: 1, width: "auto", minWidth: 0 },
    consentPressable: { width: "100%", alignSelf: "stretch" },
    consentRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.ms,
      paddingVertical: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.xs,
      borderWidth: 2,
      borderColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    checkboxError: { borderColor: colors.error },
    consentText: {
      ...typography.bodySmall,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    consentError: {
      ...typography.caption,
      color: colors.error,
      marginLeft: 22 + spacing.ms,
    },
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
