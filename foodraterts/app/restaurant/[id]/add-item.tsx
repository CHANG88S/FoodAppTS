import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddItemScreen() {
  const { id, itemId } = useLocalSearchParams();
  const router = useRouter();
  
  const restaurant = useQuery(api.restaurants.getRestaurantDetails, {
    restaurantId: id as Id<"restaurants">
  });

  const createMenuItem = useMutation(api.items.addMenuItem);

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Drink"); 
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter an item name.");
      return;
    }
    if (!restaurant) {
      Alert.alert("Error", "Restaurant profile data hasn't loaded yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMenuItem({
        restaurantId: id as Id<"restaurants">,
        restaurantName: restaurant.restaurantName,
        itemName: itemName.trim(),
        category,
        price: price ? parseFloat(price) : undefined,
      });

      Alert.alert("Success 🎉", `${itemName} added to the menu!`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Submission Failed", "Something went wrong saving your item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Menu Item</Text>
        <Text style={styles.headerSubtitle}>For {restaurant?.restaurantName || "Loading..."}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Jin Xuan Milk Oolong"
          value={itemName}
          onChangeText={setItemName}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pillRow}>
          {["Drink", "Food"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, category === type && styles.activePill]}
              onPress={() => setCategory(type)}
            >
              <Text style={[styles.pillText, category === type && styles.activePillText]}>
                {type === "Drink" ? "🥤 Drink" : "🍲 Food"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Price (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.50"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={isSubmitting || !restaurant}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Item to Menu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  headerSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2, fontWeight: "500" },
  formContainer: { padding: 20, gap: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#4B5563", marginBottom: -6 },
  input: { backgroundColor: "#FFFFFF", height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 16, fontSize: 15, color: "#374151" },
  pillRow: { flexDirection: "row", gap: 10 },
  pill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "#E5E7EB" },
  activePill: { backgroundColor: "#6c3b3b" },
  pillText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  activePillText: { color: "#FFFFFF" },
  submitButton: { backgroundColor: "#6c3b3b", height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center", marginTop: 10, elevation: 2 },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});