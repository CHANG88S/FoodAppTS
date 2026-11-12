import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddPlaceScreen() {
  const router = useRouter();
  const isStaff = useQuery(api.authz.isStaff) ?? false;
  const createRestaurant = useMutation(api.restaurants.createRestaurantDirect);

  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!isStaff) return;
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      Alert.alert("Error", "Name, address, city, and state are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Geocode the full address with Mapbox so the place shows up in radius search
      let lat: number | undefined;
      let lng: number | undefined;
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const query = [form.address.trim(), form.city.trim(), form.state.trim(), form.zipcode.trim()]
        .filter(Boolean)
        .join(", ");
      if (mapboxToken && query) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=US&limit=1&access_token=${mapboxToken}`
          );
          const data: any = await res.json();
          const center = data?.features?.[0]?.center;
          if (Array.isArray(center) && center.length === 2) {
            lng = center[0];
            lat = center[1];
          }
        } catch {
          // Geocoding is best-effort; the place can be geocoded in a batch later
        }
      }

      const restaurantId = await createRestaurant({
        restaurantName: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        zipcode: form.zipcode.trim() || undefined,
        category: form.category.trim() || undefined,
        lat,
        lng,
      });

      Alert.alert("Success 🎉", `${form.name.trim()} has been added.`, [
        { text: "OK", onPress: () => router.replace(`/restaurant/${restaurantId}` as any) },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add place.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isStaff) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Add Place",
            headerBackButtonDisplayMode: "minimal",
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerTitleStyle: { color: "#1F2937", fontWeight: "700" },
            headerShadowVisible: false,
          }}
        />
        <View style={styles.staffOnly}>
          <Text style={styles.staffOnlyEmoji}>🔒</Text>
          <Text style={styles.staffOnlyTitle}>Staff only</Text>
          <Text style={styles.staffOnlyText}>
            Adding places directly is limited to staff. Use &ldquo;Suggest a Place&rdquo; instead.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Add Place",
            headerBackButtonDisplayMode: "minimal",
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerTitleStyle: { color: "#1F2937", fontWeight: "700" },
            headerShadowVisible: false,
          }}
        />

        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerSubtitle}>
            Adds the place directly to the directory — no suggestion review needed.
          </Text>

          <Text style={styles.label}>Place Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Ding Tea Riverside"
            placeholderTextColor="#6B7280"
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Boba, KBBQ, Sushi"
            placeholderTextColor="#6B7280"
            value={form.category}
            onChangeText={(v) => updateField("category", v)}
          />

          <Text style={styles.label}>Street Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 University Ave"
            placeholderTextColor="#6B7280"
            value={form.address}
            onChangeText={(v) => updateField("address", v)}
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Riverside"
            placeholderTextColor="#6B7280"
            value={form.city}
            onChangeText={(v) => updateField("city", v)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="CA"
                placeholderTextColor="#6B7280"
                value={form.state}
                onChangeText={(v) => updateField("state", v)}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Zipcode</Text>
              <TextInput
                style={styles.input}
                placeholder="92501"
                placeholderTextColor="#6B7280"
                value={form.zipcode}
                onChangeText={(v) => updateField("zipcode", v)}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add Place</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  formContainer: { padding: 20, paddingBottom: 40, gap: 16 },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4
  },
  label: { fontSize: 13, fontWeight: "700", color: "#4B5563", marginBottom: -6 },
  input: {
    backgroundColor: "#FFFFFF",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#374151"
  },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  submitButton: {
    backgroundColor: "#6c3b3b",
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 2
  },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  staffOnly: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  staffOnlyEmoji: { fontSize: 44 },
  staffOnlyTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  staffOnlyText: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 }
});
