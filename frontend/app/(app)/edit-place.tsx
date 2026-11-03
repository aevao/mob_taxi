import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Briefcase,
  Home as HomeIcon,
  Map as MapIcon,
  MapPin,
  Search,
  Trash2,
} from "lucide-react-native";
import {
  Card,
  Divider,
  ListRow,
  NavBar,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useGoBack } from "@/hooks/useGoBack";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  POPULAR_DESTINATIONS,
  SavedPlaceId,
  Location,
} from "@/constants/mockData";
import { ThemeColors, spacing, typography } from "@/constants/theme";
import { withoutCountry } from "@/lib/formatters";
import { isGoogleMapsConfigured, resolvePlace } from "@/lib/googleMaps";
import { haptics } from "@/lib/haptics";

function isSavedPlaceId(value: unknown): value is SavedPlaceId {
  return value === "home" || value === "work";
}

export default function EditPlaceScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(createStyles);
  const { savedPlaces, updateSavedPlace } = useApp();
  const googleEnabled = isGoogleMapsConfigured();

  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmed = query.trim();
  const { results, loading } = usePlacesSearch(
    query,
    googleEnabled && trimmed.length >= 2
  );

  const place = savedPlaces.find((item) => item.id === id);
  if (!isSavedPlaceId(id) || !place) return <Redirect href="/(app)/home" />;

  const noun = place.label.toLowerCase();
  const Icon = id === "home" ? HomeIcon : Briefcase;

  const save = (location: Location) => {
    updateSavedPlace(id, location);
    haptics.success();
    goBack();
  };

  const chooseGooglePlace = async (placeId: string, label: string, address: string) => {
    if (saving) return;
    setSaving(true);
    haptics.select();
    const resolved = await resolvePlace(placeId);
    setSaving(false);

    if (!resolved) {
      haptics.warning();
      Alert.alert("Couldn't load this place", "Try another address.");
      return;
    }

    save({
      id: placeId,
      label: resolved.label || label,
      address: withoutCountry(resolved.address || address),
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      neighborhood: "Chicago, IL",
    });
  };

  const confirmRemove = () => {
    haptics.warning();
    Alert.alert(`Remove ${noun} address?`, "You can add it again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          updateSavedPlace(id, null);
          goBack();
        },
      },
    ]);
  };

  const fallbackResults = trimmed
    ? POPULAR_DESTINATIONS.filter((item) =>
        `${item.label} ${item.address}`.toLowerCase().includes(trimmed.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar title={`Edit ${noun}`} onBack={goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {place.location ? (
          <Card>
            <ListRow
              icon={Icon}
              iconTint="brand"
              title={`Current ${noun}`}
              subtitle={withoutCountry(place.location.address)}
              style={styles.rowInset}
            />
          </Card>
        ) : null}

        <TextField
          icon={Search}
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${noun} address`}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={`Search ${noun} address`}
          containerStyle={styles.search}
        />

        <Card>
          <ListRow
            icon={MapIcon}
            title="Choose on map"
            onPress={() =>
              router.push({
                pathname: "/(app)/map-picker",
                params: { savedPlace: id },
              })
            }
            style={styles.rowInset}
          />
        </Card>

        {trimmed.length >= 2 ? (
          <View>
            <SectionHeader title={loading || saving ? "Searching…" : "Results"} />
            {loading || saving ? (
              <Card padded style={styles.center}>
                <ActivityIndicator />
              </Card>
            ) : googleEnabled && results.length > 0 ? (
              <Card>
                {results.map((result, index) => (
                  <View key={result.placeId}>
                    {index > 0 ? <Divider inset={52} /> : null}
                    <ListRow
                      icon={MapPin}
                      title={result.label}
                      subtitle={withoutCountry(result.address)}
                      onPress={() =>
                        chooseGooglePlace(result.placeId, result.label, result.address)
                      }
                      style={styles.rowInset}
                    />
                  </View>
                ))}
              </Card>
            ) : !googleEnabled && fallbackResults.length > 0 ? (
              <Card>
                {fallbackResults.map((location, index) => (
                  <View key={location.id}>
                    {index > 0 ? <Divider inset={52} /> : null}
                    <ListRow
                      icon={MapPin}
                      title={location.label}
                      subtitle={location.address}
                      onPress={() => save(location)}
                      style={styles.rowInset}
                    />
                  </View>
                ))}
              </Card>
            ) : (
              <Card padded>
                <Text style={styles.empty}>
                  No results for “{trimmed}”. Try a street address or choose on
                  the map.
                </Text>
              </Card>
            )}
          </View>
        ) : null}

        {place.location ? (
          <Card>
            <ListRow
              icon={Trash2}
              title={`Remove ${noun} address`}
              onPress={confirmRemove}
              showChevron={false}
              style={styles.rowInset}
            />
          </Card>
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
    search: { marginBottom: 0 },
    rowInset: { paddingHorizontal: spacing.md },
    center: { alignItems: "center" },
    empty: { ...typography.bodySmall, color: colors.textSecondary },
  });
}
