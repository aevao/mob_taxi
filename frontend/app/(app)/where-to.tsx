import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import {
  Briefcase,
  Home as HomeIcon,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plane,
} from "lucide-react-native";
import { TripAddressCard } from "@/components/TripAddressCard";
import { ThemeIconButton } from "@/components/ThemeIconButton";
import {
  Button,
  Card,
  Divider,
  ListRow,
  NavBar,
  SectionHeader,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  geocodeAddress,
  isGoogleMapsConfigured,
  resolvePlace,
} from "@/lib/googleMaps";
import { haptics } from "@/lib/haptics";
import {
  DEFAULT_PICKUP,
  Location,
  POPULAR_DESTINATIONS,
  QUICK_LOCATIONS,
  SavedPlaceId,
} from "@/constants/mockData";
import { withoutCountry } from "@/lib/formatters";
import { ThemeColors, spacing, typography } from "@/constants/theme";

export default function WhereToScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const styles = useThemedStyles(createStyles);
  const { booking, setPickup, setDropoff, savedPlaces } = useApp();
  const googleEnabled = isGoogleMapsConfigured();

  const [pickupText, setPickupText] = useState(
    booking.pickup?.address ?? DEFAULT_PICKUP.address
  );
  const [dropoffText, setDropoffText] = useState(
    booking.dropoff?.address ?? ""
  );
  const [selected, setSelected] = useState<Location | null>(
    booking.dropoff ?? null
  );
  const [submitting, setSubmitting] = useState(false);

  const editPlace = (id: SavedPlaceId) =>
    router.push({ pathname: "/(app)/edit-place", params: { id } });

  const mockSuggestions = useMemo(() => {
    const airports = QUICK_LOCATIONS.filter((item) => item.icon === "plane").map(
      (item) => ({ location: item.location, isAirport: true })
    );
    const popular = POPULAR_DESTINATIONS.map((location) => ({
      location,
      isAirport: false,
    }));
    return [...airports, ...popular];
  }, []);

  const query = dropoffText.trim();
  const { results: placeResults, loading: placesLoading } = usePlacesSearch(
    dropoffText,
    googleEnabled && query.length >= 2
  );

  const filteredMock = query
    ? mockSuggestions.filter(
        ({ location }) =>
          location.label.toLowerCase().includes(query.toLowerCase()) ||
          location.address.toLowerCase().includes(query.toLowerCase())
      )
    : mockSuggestions;

  const resolvePickup = async (): Promise<Location> => {
    const base = booking.pickup ?? DEFAULT_PICKUP;
    const address = pickupText.trim();

    if (!address || address === base.address) {
      return { ...base, address: address || base.address };
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      return { ...base, address };
    }

    return {
      ...base,
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  };

  const resolveDropoff = async (): Promise<Location | null> => {
    if (selected) return selected;

    const address = dropoffText.trim();
    if (!address) return null;

    const coords = await geocodeAddress(address);
    if (!coords) {
      return {
        id: "custom",
        label: address,
        address,
        latitude: DEFAULT_PICKUP.latitude,
        longitude: DEFAULT_PICKUP.longitude,
        neighborhood: "Chicago, IL",
      };
    }

    return {
      id: "custom",
      label: address.split(",")[0] ?? address,
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      neighborhood: "Chicago, IL",
    };
  };

  const goToRoute = async (dropoffLocation: Location) => {
    if (submitting) return;

    setDropoffText(dropoffLocation.address);
    setSelected(dropoffLocation);
    setSubmitting(true);
    haptics.select();

    const pickupLocation = await resolvePickup();
    setPickup(pickupLocation);
    setDropoff(dropoffLocation);
    setSubmitting(false);
    haptics.success();
    router.push("/(app)/ride-selection");
  };

  const chooseDestination = (location: Location) => {
    void goToRoute(location);
  };

  const chooseGooglePlace = async (
    placeId: string,
    label: string,
    address: string
  ) => {
    if (submitting) return;

    setDropoffText(address);
    setSubmitting(true);
    haptics.select();

    const resolved = await resolvePlace(placeId);
    if (!resolved) {
      setSubmitting(false);
      haptics.warning();
      Alert.alert(
        "Could not load place",
        "Check that Places API is enabled for your Google Maps key."
      );
      return;
    }

    setSubmitting(false);
    await goToRoute({
      id: placeId,
      label: resolved.label || label,
      address: resolved.address || address,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      neighborhood: "Chicago, IL",
    });
  };

  const handleDropoffChange = (text: string) => {
    setDropoffText(text);
    if (selected) setSelected(null);
  };

  const handleMapPin = async () => {
    if (submitting) return;

    setSubmitting(true);
    haptics.tap();
    setPickup(await resolvePickup());
    setSubmitting(false);
    router.push("/(app)/map-picker");
  };

  const handleContinue = async () => {
    if (!dropoffText.trim() || submitting) return;

    setSubmitting(true);
    haptics.tap();

    const pickupLocation = await resolvePickup();
    const dropoffLocation = await resolveDropoff();

    setSubmitting(false);

    if (!dropoffLocation) return;

    setPickup(pickupLocation);
    setDropoff(dropoffLocation);
    haptics.success();
    router.push("/(app)/ride-selection");
  };

  const showGoogleResults = googleEnabled && query.length >= 2;
  const showMockResults = !showGoogleResults;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar
        title="Where to?"
        onBack={() => goBack()}
        right={<ThemeIconButton />}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TripAddressCard
          pickup={pickupText}
          dropoff={dropoffText}
          onPickupChange={setPickupText}
          onDropoffChange={handleDropoffChange}
        />

        <Card style={styles.block}>
          <ListRow
            icon={MapIcon}
            iconTint="brand"
            title="Set location on map"
            onPress={handleMapPin}
            style={styles.rowInset}
          />
        </Card>

        {query.length === 0 ? (
          <View style={styles.block}>
            <SectionHeader title="Saved places" />
            <Card>
              {savedPlaces.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <Divider inset={52} /> : null}
                  <ListRow
                    icon={item.id === "home" ? HomeIcon : Briefcase}
                    title={item.label}
                    subtitle={
                      item.location
                        ? withoutCountry(item.location.address)
                        : `Add ${item.label.toLowerCase()} address`
                    }
                    onPress={() =>
                      item.location
                        ? chooseDestination(item.location)
                        : editPlace(item.id)
                    }
                    trailingIcon={item.location ? Pencil : undefined}
                    trailingLabel={`Edit ${item.label}`}
                    onTrailingPress={() => editPlace(item.id)}
                    style={styles.rowInset}
                  />
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader
            title={
              showGoogleResults
                ? placesLoading
                  ? "Searching…"
                  : "Search results"
                : query.length > 0
                  ? "Search results"
                  : "Suggestions"
            }
          />

          {showGoogleResults && placesLoading ? (
            <Card padded style={styles.loadingCard}>
              <ActivityIndicator />
            </Card>
          ) : null}

          {showGoogleResults && !placesLoading && placeResults.length === 0 ? (
            <Card padded>
              <Text style={styles.emptyText}>
                No Google results for “{query}”. Try a shorter query or pick a
                suggestion below.
              </Text>
            </Card>
          ) : null}

          {showGoogleResults && placeResults.length > 0 ? (
            <Card>
              {placeResults.map((place, index) => (
                <View key={place.placeId}>
                  {index > 0 ? <Divider inset={52} /> : null}
                  <ListRow
                    icon={MapPin}
                    title={place.label}
                    subtitle={place.address}
                    onPress={() =>
                      chooseGooglePlace(
                        place.placeId,
                        place.label,
                        place.address
                      )
                    }
                    style={styles.rowInset}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          {showMockResults && filteredMock.length === 0 ? (
            <Card padded>
              <Text style={styles.emptyText}>
                No places match “{query}”. Continue to use it as a custom
                address.
              </Text>
            </Card>
          ) : null}

          {showMockResults && filteredMock.length > 0 ? (
            <Card>
              {filteredMock.map(({ location, isAirport }, index) => (
                <View key={location.id}>
                  {index > 0 ? <Divider inset={52} /> : null}
                  <ListRow
                    icon={isAirport ? Plane : MapPin}
                    title={location.label}
                    subtitle={location.subtitle ?? location.neighborhood}
                    onPress={() => chooseDestination(location)}
                    style={styles.rowInset}
                  />
                </View>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={submitting ? "Loading…" : "Continue"}
          size="lg"
          onPress={handleContinue}
          disabled={dropoffText.trim().length === 0 || submitting}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    block: { width: "100%" },
    rowInset: { paddingHorizontal: spacing.md },
    loadingCard: { alignItems: "center" },
    emptyText: { ...typography.bodySmall, color: colors.textSecondary },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
