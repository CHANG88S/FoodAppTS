import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router"; 
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [zipcode, setZipcode] = useState("");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Staff-only: edit places (long-press a card) and add places directly
  const isStaff = useQuery(api.authz.isStaff) ?? false;
  const updateRestaurantMutation = useMutation(api.restaurants.updateRestaurant);
  const [editingPlace, setEditingPlace] = useState<any>(null);
  const [placeForm, setPlaceForm] = useState({
    name: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    lat: "",
    lng: "",
  });
  const [savingPlace, setSavingPlace] = useState(false);
  const [placeKeyboardHeight, setPlaceKeyboardHeight] = useState(0);

  // Lift the place editor sheet above the keyboard while typing
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => setPlaceKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardWillHide", () => setPlaceKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const openPlaceEditor = (place: any) => {
    setEditingPlace(place);
    setPlaceForm({
      name: place.restaurantName || "",
      category: place.category || "",
      address: place.address || place.streetAddress || "",
      city: place.city || "",
      state: place.state || "",
      zipcode: place.zipcode || "",
      lat: place.lat != null ? String(place.lat) : "",
      lng: place.lng != null ? String(place.lng) : "",
    });
  };

  const handleSavePlace = async () => {
    if (!editingPlace) return;
    if (!placeForm.name.trim()) {
      Alert.alert("Error", "Place name cannot be empty.");
      return;
    }
    const latValue = placeForm.lat.trim() ? parseFloat(placeForm.lat) : undefined;
    const lngValue = placeForm.lng.trim() ? parseFloat(placeForm.lng) : undefined;
    if ((latValue !== undefined && Number.isNaN(latValue)) || (lngValue !== undefined && Number.isNaN(lngValue))) {
      Alert.alert("Error", "Latitude and longitude must be numbers.");
      return;
    }
    setSavingPlace(true);
    try {
      await updateRestaurantMutation({
        restaurantId: editingPlace._id,
        restaurantName: placeForm.name.trim(),
        category: placeForm.category.trim() || undefined,
        city: placeForm.city.trim() || undefined,
        state: placeForm.state.trim() || undefined,
        address: placeForm.address.trim() || undefined,
        zipcode: placeForm.zipcode.trim() || undefined,
        lat: latValue,
        lng: lngValue,
      });
      setEditingPlace(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update place.");
    } finally {
      setSavingPlace(false);
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const isFilteringByLocation =
    zipcode.trim().length === 5 && selectedRadius !== null && userCoords !== null;

  // Geocode the entered zipcode with Mapbox for accurate distance filtering
  useEffect(() => {
    const zip = zipcode.trim();
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (zip.length !== 5 || !mapboxToken) {
      setUserCoords(null);
      return;
    }
    let cancelled = false;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(zip)}.json?country=US&types=postcode&limit=1&access_token=${mapboxToken}`
    )
      .then((res) => res.json())
      .then((data: any) => {
        const center = data?.features?.[0]?.center;
        if (!cancelled && Array.isArray(center) && center.length === 2) {
          setUserCoords({ lat: center[1], lng: center[0] });
        } else if (!cancelled) {
          setUserCoords(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUserCoords(null);
      });
    return () => {
      cancelled = true;
    };
  }, [zipcode]);

  // 1. Hook up both backend collections concurrently
  const restaurants = useQuery(api.restaurants.listAllRestaurants, {});
  const itemSearchResults = useQuery(api.items.searchMenuItems, { searchQuery });
  const filteredRestaurants = useQuery(
    api.restaurants.filterRestaurantsByCoordinates,
    isFilteringByLocation && userCoords
      ? { lat: userCoords.lat, lng: userCoords.lng, radiusMiles: selectedRadius! }
      : "skip"
  );

  // 🔑 HELPER FUNCTION: Returns a dynamic emoji matching your restaurant category
  const getCategoryEmoji = (categoryString?: string): string => {
    if (!categoryString) return "🧋"; // Default fallback boba emoji
    
    const cat = categoryString.toLowerCase();

    if (cat.includes("sushi")) return "🍣";
    if (cat.includes("ramen") || cat.includes("noodle")) return "🍜";
    if (cat.includes("tea") || cat.includes("boba") || cat.includes("drink") || cat.includes("bubble tea")) return "🧋";
    if (cat.includes("coffee") || cat.includes("cafe")) return "☕";
    if (cat.includes("dessert") || cat.includes("sweet") || cat.includes("yogurt")) return "🍦";
    if (cat.includes("ayce") || cat.includes("buffet")) return "🍲";
    if (cat.includes("shabu") || cat.includes("soup")) return "🍲";
    if (cat.includes("bbq") || cat.includes("meat") || cat.includes("kbbq") || cat.includes("korean bbq")) return "🥩";
    if (cat.includes("burger")) return "🍔";
    if (cat.includes("donut")) return "🍩";
    
    // Generic categories
    if (cat.includes("food")) return "🍲";

    return "🧋"; // Final fallback
  };

  // Define drink-related categories for filtering
  const DRINK_CATEGORIES = ['boba', 'cafe', 'coffee', 'tea', 'matcha', 'bubble tea', 'drink', 'juice', 'smoothie', 'dessert', 'bakery', 'yogurt', 'ice cream'];

  // 2. BUILD THE UNIFIED SEARCH FEED ARRAY
  const getUnifiedFeed = () => {
    // Determine which restaurant dataset to use based on location filtering
    const restaurantDataSource = isFilteringByLocation && filteredRestaurants
      ? filteredRestaurants
      : restaurants;

    // Flag all restaurant items upfront so they always map via the correct card layout structure
    const flaggedRestaurants = restaurantDataSource?.map((shop: any) => ({
      ...shop,
      isRestaurantCard: true
    })) || [];

    // Helper function to check if a shop category is drink-related
    const isDrinkCategory = (category?: string): boolean => {
      if (!category) return false;
      const lowerCategory = category.toLowerCase();
      return DRINK_CATEGORIES.some(drinkCat => lowerCategory.includes(drinkCat));
    };

    // STATE A: Not searching? Show the core master directory of spots
    if (!isSearching) {
      let filtered = flaggedRestaurants.filter((shop: any) => {
        // Apply category filter
        if (selectedCategory !== "All") {
          const shopCategory = shop.category?.toLowerCase() || "";

          if (selectedCategory === "Drink") {
            if (!isDrinkCategory(shopCategory)) return false;
          } else if (selectedCategory === "Food") {
            if (isDrinkCategory(shopCategory)) return false;
          } else {
            if (!shopCategory.includes(selectedCategory.toLowerCase())) return false;
          }
        }

        return true;
      });

      return filtered;
    }

    // STATE B: Active searching? Combine restaurant name matches and item name matches
    const matchingShops = flaggedRestaurants.filter((shop: any) => {
      const matchesSearch = shop.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Apply category filter
      if (selectedCategory !== "All") {
        const shopCategory = shop.category?.toLowerCase() || "";

        if (selectedCategory === "Drink") {
          if (!isDrinkCategory(shopCategory)) return false;
        } else if (selectedCategory === "Food") {
          if (isDrinkCategory(shopCategory)) return false;
        } else {
          if (!shopCategory.includes(selectedCategory.toLowerCase())) return false;
        }
      }

      return true;
    });

    const matchingItems = itemSearchResults?.filter((item: any) => {
      if (selectedCategory === "All") return true;

      const itemCat = item.category?.toLowerCase().trim() || "";
      const filterCat = selectedCategory.toLowerCase().trim();

      if (selectedCategory === "Drink") {
        return DRINK_CATEGORIES.some(drinkCat => itemCat.includes(drinkCat));
      } else if (selectedCategory === "Food") {
        // For items, food should be non-drink categories
        return !DRINK_CATEGORIES.some(drinkCat => itemCat.includes(drinkCat));
      }

      return itemCat.includes(filterCat) || filterCat.includes(itemCat);
    }) || [];

    // Return the stitched data list (Shops populate at the top, dishes right below)
    return [...matchingShops, ...matchingItems];
  };

  const unifiedData = getUnifiedFeed();

  // CARD A: Renders for Restaurant Directory Listings
  const renderRestaurantItem = (item: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/restaurant/${item._id}`)}
      activeOpacity={0.8}
      key={`shop-${item._id}`}
    >
      {/* 🔑 CONDITIONAL LOGO RENDERING: Show logoUrl image if present, otherwise show placeholder emoji */}
      {item.logoUrl ? (
        <Image 
          source={{ uri: item.logoUrl }} 
          style={styles.cardImage} 
        />
      ) : (
        <View style={styles.iconContainer}>
          <Text style={styles.bobaEmoji}>
            {getCategoryEmoji(item.category)}
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.restaurantTitle}>{item.restaurantName}</Text>
        
        {/* Wrapping layout block handles structural alignment leftwards beneath the title */}
        <View style={styles.cardTextAlignmentBlock}>
          {/* Line 1: Street Details */}
          <Text style={styles.metaText} numberOfLines={1}>
            📍 {item.streetAddress || item.address || "Address unavailable"}
          </Text>

          {/* Line 2: City, State Location Metrics aligned with the address text */}
          <Text style={styles.locationSubText}>
            {item.city && item.state ? `${item.city}, ${item.state}` : "Riverside, CA"}
          </Text>
        </View>

        <Text style={styles.hoursText}>
          🕒 {item.hours || "Hours unavailable"}
        </Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={18} 
        color="#D1D5DB" 
        style={styles.chevronIcon} 
      />
    </TouchableOpacity>
  );

  // CARD B: Renders for Menu Item/Drink Listings
  const renderItemSearchItem = (item: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => item.restaurantId && router.push(`/restaurant/${item.restaurantId}`)}
      activeOpacity={0.8}
      key={`item-${item._id}`}
    >
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.restaurantSubName}>🏢 From {item.restaurantName}</Text>
      </View>
    </TouchableOpacity>
  );

  const isLoading = restaurants === undefined || (isSearching && itemSearchResults === undefined) || (isFilteringByLocation && filteredRestaurants === undefined);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Container */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome in! 👋</Text>
          <Text style={styles.subtitle}>Find your next spot to try!</Text>
        </View>
        {isStaff && (
          <TouchableOpacity
            style={styles.addPlaceButton}
            onPress={() => router.push("/add-place" as any)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addPlaceButtonText}>Add Place</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unified Search Input Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places or items (Oolong, Milk Tea)..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {isSearching && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row Pills & Suggest a Place Button Container */}
      <View style={styles.filterAndSuggestRow}>
        <View style={styles.filterRow}>
          {["All", "Drink", "Food"].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterPill,
                selectedCategory === category && styles.activeFilterPill
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterText,
                selectedCategory === category && styles.activeFilterText
              ]}>
                {category === "Drink"  ? "🥤 Drinks" : category === "Food" ? "🍲 Food" : "✨ All"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggest a Place Button */}
        <TouchableOpacity style={styles.suggestPlaceButton} onPress={() => router.push('/suggest-place')}>
          <Ionicons name="location-outline" size={16} color="#6c3b3b" />
          <Text style={styles.suggestPlaceText}>Suggest a Place</Text>
        </TouchableOpacity>
      </View>

      {/* Location Filter Row */}
      <View style={styles.locationFilterRow}>
        <TouchableOpacity
          style={styles.zipcodeContainer}
          onPress={() => setRadiusDropdownOpen(!radiusDropdownOpen)}
        >
          <Ionicons name="location" size={16} color="#6B7280" style={styles.locationIcon} />
          <TextInput
            style={styles.zipcodeInput}
            placeholder="Zipcode"
            placeholderTextColor="#9CA3AF"
            value={zipcode}
            onChangeText={setZipcode}
            keyboardType="number-pad"
            maxLength={5}
            editable={true}
          />
          <Ionicons
            name={radiusDropdownOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#6B7280"
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>

        {/* Radius Dropdown */}
        {radiusDropdownOpen && zipcode.trim().length === 5 && (
          <View style={styles.radiusDropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Search Radius</Text>
              <TouchableOpacity
                style={styles.dropdownCloseButton}
                onPress={() => {
                  setRadiusDropdownOpen(false);
                  setSelectedRadius(null);
                  setZipcode("");
                }}
              >
                <Ionicons name="close-circle" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.radiusOptions}>
              {[10, 25, 50, 100].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    selectedRadius === radius && styles.activeRadiusOption
                  ]}
                  onPress={() => {
                    setSelectedRadius(radius);
                    setRadiusDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.radiusOptionText,
                    selectedRadius === radius && styles.activeRadiusOptionText
                  ]}>
                    {radius} miles
                  </Text>
                  {selectedRadius === radius && (
                    <Ionicons name="checkmark" size={16} color="#6c3b3b" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Selected Radius Display */}
        {!radiusDropdownOpen && selectedRadius !== null && (
          <TouchableOpacity
            style={styles.selectedRadiusPill}
            onPress={() => setRadiusDropdownOpen(true)}
          >
            <Text style={styles.selectedRadiusText}>{selectedRadius}mi</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic List Section Header */}
      <Text style={styles.sectionTitle}>
        {isSearching ? "🔍 Combined Search Matches" : "✨ Featured Spots"}
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c3b3b" />
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <FlatList
            data={unifiedData}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              if (item.isRestaurantCard || (item.restaurantName && !item.itemName)) {
                return (
                  <RestaurantCard
                    item={item}
                    getCategoryEmoji={getCategoryEmoji}
                    router={router}
                    onLongPress={isStaff ? () => openPlaceEditor(item) : undefined}
                  />
                );
              }
              return renderItemSearchItem(item);
            }}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isFilteringByLocation
                  ? `No spots found within ${selectedRadius} miles of ${zipcode}. Try expanding your radius or a different zipcode.`
                  : isSearching
                  ? "No shops or menu items match your search entry."
                  : "No spots found matching your criteria."}
              </Text>
            </View>
          }
          />
        </TouchableWithoutFeedback>
      )}

      {/* Staff place editor (long-press a place card) */}
      <Modal
        visible={!!editingPlace}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingPlace(null)}
      >
        <TouchableOpacity
          style={[styles.editOverlay, placeKeyboardHeight > 0 && { paddingBottom: placeKeyboardHeight }]}
          activeOpacity={1}
          onPress={() => setEditingPlace(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.editSheet}>
            <Text style={styles.editSheetTitle}>Edit Place</Text>
            <Text style={styles.editSheetSubtitle}>
              Changes are visible to everyone immediately.
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: placeKeyboardHeight > 0 ? 260 : 420 }}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <Text style={styles.editLabel}>Name</Text>
              <TextInput
                style={styles.editInput}
                value={placeForm.name}
                onChangeText={(v) => setPlaceForm({ ...placeForm, name: v })}
                placeholder="Place name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.editLabel}>Category</Text>
              <TextInput
                style={styles.editInput}
                value={placeForm.category}
                onChangeText={(v) => setPlaceForm({ ...placeForm, category: v })}
                placeholder="e.g., Boba, KBBQ"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.editLabel}>Address</Text>
              <TextInput
                style={styles.editInput}
                value={placeForm.address}
                onChangeText={(v) => setPlaceForm({ ...placeForm, address: v })}
                placeholder="Street address"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.editLabel}>City</Text>
              <TextInput
                style={styles.editInput}
                value={placeForm.city}
                onChangeText={(v) => setPlaceForm({ ...placeForm, city: v })}
                placeholder="City"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.editRow}>
                <View style={styles.editFieldHalf}>
                  <Text style={styles.editLabel}>State</Text>
                  <TextInput
                    style={styles.editInput}
                    value={placeForm.state}
                    onChangeText={(v) => setPlaceForm({ ...placeForm, state: v })}
                    placeholder="CA"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
                <View style={styles.editFieldHalf}>
                  <Text style={styles.editLabel}>Zipcode</Text>
                  <TextInput
                    style={styles.editInput}
                    value={placeForm.zipcode}
                    onChangeText={(v) => setPlaceForm({ ...placeForm, zipcode: v })}
                    placeholder="92618"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.editRow}>
                <View style={styles.editFieldHalf}>
                  <Text style={styles.editLabel}>Latitude</Text>
                  <TextInput
                    style={styles.editInput}
                    value={placeForm.lat}
                    onChangeText={(v) => setPlaceForm({ ...placeForm, lat: v })}
                    placeholder="33.6846"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.editFieldHalf}>
                  <Text style={styles.editLabel}>Longitude</Text>
                  <TextInput
                    style={styles.editInput}
                    value={placeForm.lng}
                    onChangeText={(v) => setPlaceForm({ ...placeForm, lng: v })}
                    placeholder="-117.8265"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.editSheetActions}>
              <TouchableOpacity
                style={[styles.editSheetButton, styles.editSheetCancelButton]}
                onPress={() => setEditingPlace(null)}
                disabled={savingPlace}
              >
                <Text style={styles.editSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSheetButton}
                onPress={handleSavePlace}
                disabled={savingPlace}
              >
                {savingPlace ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editSheetSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Sub-component to leverage getPublicUrl query for optimized storageId references
function RestaurantCard({ item, getCategoryEmoji, router, onLongPress }: { item: any; getCategoryEmoji: (cat?: string) => string; router: any; onLongPress?: () => void }) {
  const logoUrl = useQuery(
    api.images.getPublicUrl,
    item.logoStorageId ? { storageId: item.logoStorageId } : "skip"
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/restaurant/${item._id}`)}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {logoUrl ? (
        <Image 
          source={{ uri: logoUrl }} 
          style={styles.cardImage} 
        />
      ) : (
        <View style={styles.iconContainer}>
          <Text style={styles.bobaEmoji}>
            {getCategoryEmoji(item.category)}
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.restaurantTitle}>{item.restaurantName}</Text>
        
        <View style={styles.cardTextAlignmentBlock}>
          <Text style={styles.metaText} numberOfLines={1}>
            📍 {item.streetAddress || item.address || "Address unavailable"}
          </Text>

          <Text style={styles.locationSubText}>
            {item.city && item.state ? `${item.city}, ${item.state}` : "Riverside, CA"}
          </Text>
        </View>

        <Text style={styles.hoursText}>
          🕒 {item.hours || "Hours unavailable"}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="#D1D5DB"
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FAFAFA"
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    marginTop: 10
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1F2937"
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2
  },
  addPlaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#6c3b3b",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addPlaceButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  editSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40
  },
  editSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center"
  },
  editSheetSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12
  },
  editSheetScroll: {
    maxHeight: 420
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 6
  },
  editInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 12
  },
  editRow: {
    flexDirection: "row",
    gap: 10
  },
  editFieldHalf: {
    flex: 1
  },
  editSheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  editSheetButton: {
    flex: 1,
    backgroundColor: "#6c3b3b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  editSheetCancelButton: {
    backgroundColor: "#F3F4F6"
  },
  editSheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280"
  },
  editSheetSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFFFF", 
    marginHorizontal: 20, 
    marginTop: 20, 
    paddingHorizontal: 16, 
    height: 50, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    elevation: 2
  },
  searchIcon: { 
    marginRight: 10
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: "#374151"
  },
  filterAndSuggestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  filterRow: { 
    flexDirection: "row", 
    gap: 8,
    flexShrink: 1,
  },
  filterPill: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    backgroundColor: "#E5E7EB"
  },
  activeFilterPill: { 
    backgroundColor: "#6c3b3b"
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#4B5563"
  },
  activeFilterText: { 
    color: "#FFFFFF"
  },
  suggestPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6c3b3b',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
    flexShrink: 0,
  },
  suggestPlaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c3b3b',
  },
  locationFilterRow: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  zipcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 8,
  },
  zipcodeInput: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    paddingVertical: 0,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  radiusDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownCloseButton: {
    padding: 4,
  },
  radiusOptions: {
    marginTop: 8,
  },
  radiusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeRadiusOption: {
    backgroundColor: '#FEF2F2',
  },
  radiusOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  activeRadiusOptionText: {
    color: '#6c3b3b',
    fontWeight: '600',
  },
  selectedRadiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c3b3b',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  selectedRadiusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#1F2937", 
    marginHorizontal: 20, 
    marginTop: 25, 
    marginBottom: 12
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 20
  },
  card: { 
    flexDirection: "row", 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    marginBottom: 14, 
    padding: 12, 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#F3F4F6", 
    elevation: 2
  },
  iconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 12, 
    backgroundColor: "#F5F5F4", 
    justifyContent: "center", 
    alignItems: "center"
  },
  bobaEmoji: {
    fontSize: 28
  },
  chevronIcon: {
    marginRight: 8
  },
  cardImage: { 
    width: 64, 
    height: 64, 
    borderRadius: 12, 
    backgroundColor: "#F3F4F6"
  },
  cardContent: { 
    flex: 1, 
    paddingLeft: 14, 
    justifyContent: "center"
  },
  restaurantTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937",
    paddingLeft: 21
  },
  restaurantSubName: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 2, 
    fontWeight: "500"
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937"
  },
  cardTextAlignmentBlock: {
    alignItems: 'flex-start',
    marginTop: 2
  },
  metaText: { 
    fontSize: 13, 
    color: "#4B5563", 
    fontWeight: "500"
  },
  locationSubText: { 
    fontSize: 12, 
    color: "#6B7280", 
    marginTop: 1, 
    paddingLeft: 21, 
    fontWeight: "500" 
  },
  hoursText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 3
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyContainer: { 
    alignItems: "center", 
    marginTop: 40, 
    gap: 10
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14
  }
});