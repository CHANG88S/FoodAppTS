import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddItemScreen() {
  const { id, itemId, mode } = useLocalSearchParams();
  const router = useRouter();
  const isCategoryMode = mode === "category";

  const restaurant = useQuery(api.restaurants.getRestaurantDetails, {
    restaurantId: id as Id<"restaurants">
  });

  const isStaff = useQuery(api.authz.isStaff) ?? false;

  const createMenuItem = useMutation(api.items.addMenuItem);
  const suggestMenuItem = useMutation(api.suggestions.suggestMenuItem);
  const updateRestaurantMutation = useMutation(api.restaurants.updateRestaurant);

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Drink");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff-only: define new categories on the fly
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const categoryOptions = ["Drink", "Food", ...customCategories];

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const existing = categoryOptions.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setCategory(existing);
    } else {
      setCustomCategories([...customCategories, trimmed]);
      setCategory(trimmed);
    }
    setNewCategoryName("");
    setNewCategoryModalVisible(false);
  };

  // Category mode: append a category to the place's menu item categories
  const handleSubmitCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a category name.");
      return;
    }
    if (!restaurant) {
      Alert.alert("Error", "Restaurant profile data hasn't loaded yet.");
      return;
    }
    const existing = ((restaurant as any).menuCategories || []).map((c: string) => c.trim()).filter(Boolean);
    if (existing.some((c: string) => c.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Error", "That category already exists for this place.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateRestaurantMutation({
        restaurantId: id as Id<"restaurants">,
        menuCategories: [...existing, trimmed],
      });
      Alert.alert("Success 🎉", `Category "${trimmed}" added!`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add category.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (isStaff) {
        // Staff add directly
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
      } else {
        // Regular users suggest for review
        await suggestMenuItem({
          restaurantId: id as Id<"restaurants">,
          restaurantName: restaurant.restaurantName,
          itemName: itemName.trim(),
          category,
          price: price ? parseFloat(price) : undefined,
        });

        Alert.alert("Submitted ✅", `${itemName} has been submitted for review. We'll notify you once it's approved!`, [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Submission Failed", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isCategoryMode ? "Add a Category" : "Add an Item",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTitleStyle: { color: "#1F2937", fontWeight: "700" },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isCategoryMode ? "Add a Category" : "Add Menu Item"}</Text>
        <Text style={styles.headerSubtitle}>For {restaurant?.restaurantName || "Loading..."}</Text>
      </View>

      {isCategoryMode ? (
        <View style={styles.formContainer}>
          <Text style={styles.headerSubtitle}>
            Adds a category to this place — pick it later when naming items.
          </Text>

          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dessert"
            placeholderTextColor="#6B7280"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            onSubmitEditing={handleSubmitCategory}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitCategory}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add Category</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
      <View style={styles.formContainer}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Jin Xuan Milk Oolong" placeholderTextColor="#6B7280"
          value={itemName}
          onChangeText={setItemName}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pillRow}>
          {categoryOptions.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, category === type && styles.activePill]}
              onPress={() => setCategory(type)}
            >
              <Text style={[styles.pillText, category === type && styles.activePillText]}>
                {type === "Drink" ? "🥤 Drink" : type === "Food" ? "🍲 Food" : type}
              </Text>
            </TouchableOpacity>
          ))}
          {isStaff && (
            <TouchableOpacity
              style={styles.newCategoryPill}
              onPress={() => setNewCategoryModalVisible(true)}
            >
              <Text style={styles.newCategoryPillText}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Price (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.50" placeholderTextColor="#6B7280"
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
            <Text style={styles.submitButtonText}>
              {isStaff ? "Add to Menu" : "Suggest Item"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      )}

      {/* Staff-only: create a new category */}
      <Modal
        visible={newCategoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNewCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNewCategoryModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Dessert"
              placeholderTextColor="#6B7280"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              onSubmitEditing={handleAddCategory}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setNewCategoryModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddCategory}>
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    </TouchableWithoutFeedback>
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
  pillRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  newCategoryPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#6c3b3b",
    borderStyle: "dashed"
  },
  newCategoryPillText: { fontSize: 14, fontWeight: "600", color: "#6c3b3b" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%"
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#1F2937", marginBottom: 14 },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#374151"
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalButton: {
    flex: 1,
    backgroundColor: "#6c3b3b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  modalCancelButton: { backgroundColor: "#F3F4F6" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  modalAddText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  pill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "#E5E7EB" },
  activePill: { backgroundColor: "#6c3b3b" },
  pillText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  activePillText: { color: "#FFFFFF" },
  submitButton: { backgroundColor: "#6c3b3b", height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center", marginTop: 10, elevation: 2 },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});