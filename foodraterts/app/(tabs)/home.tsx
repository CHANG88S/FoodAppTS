import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router"; 
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 1. Hook up both backend collections concurrently
  const restaurants = useQuery(api.restaurants.listAllRestaurants);
  const itemSearchResults = useQuery(api.items.searchMenuItems, { searchQuery });

  const isSearching = searchQuery.trim().length > 0;

  // 2. BUILD THE UNIFIED SEARCH FEED ARRAY
  const getUnifiedFeed = () => {
    // Flag all restaurant items upfront so they always map via the correct card layout structure
    const flaggedRestaurants = restaurants?.map((shop: any) => ({ 
      ...shop, 
      isRestaurantCard: true 
    })) || [];

    // STATE A: Not searching? Show the core master directory of spots
    if (!isSearching) {
      return flaggedRestaurants.filter((shop: any) => {
        if (selectedCategory === "All") return true;
        return shop.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    // STATE B: Active searching? Combine restaurant name matches and item name matches
    const matchingShops = flaggedRestaurants.filter((shop: any) => {
      const matchesSearch = shop.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === "All") return true;
      return shop.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    const matchingItems = itemSearchResults?.filter((item: any) => {
      if (selectedCategory === "All") return true;
      return item.category?.toLowerCase() === selectedCategory.toLowerCase();
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
      <View style={styles.iconContainer}>
        <Text style={styles.bobaEmoji}>🧋</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.restaurantTitle}>{item.restaurantName}</Text>
        <Text style={styles.metaText} numberOfLines={1}>
          📍 {item.address || "Riverside, CA"}
        </Text>
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

  const isLoading = restaurants === undefined || (isSearching && itemSearchResults === undefined);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Container */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey there! 👋</Text>
          <Text style={styles.subtitle}>Find your next favorite boba spot</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={36} color="#6c3b3b" />
        </TouchableOpacity>
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

      {/* Filter Row Pills */}
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
              {category === "Drink" ? "🥤 Drinks" : category === "Food" ? "🍲 Food" : "✨ All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dynamic List Section Header */}
      <Text style={styles.sectionTitle}>
        {isSearching ? "🔍 Combined Search Matches" : "✨ 20 Local Riverside Spots"}
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c3b3b" />
        </View>
      ) : (
        <FlatList
          data={unifiedData}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            // Tight check constraint layer: if flagged OR possesses restaurant metadata only, use Card A
            if (item.isRestaurantCard || (item.restaurantName && !item.itemName)) {
              return renderRestaurantItem(item);
            }
            return renderItemSearchItem(item);
          }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                No shops or menu items match your search entry.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FAFAFA",
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    marginTop: 10,
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1F2937",
  },
  subtitle: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginTop: 2,
  },
  profileButton: { 
    padding: 4,
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
    elevation: 2,
  },
  searchIcon: { 
    marginRight: 10,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: "#374151",
  },
  filterRow: { 
    flexDirection: "row", 
    paddingHorizontal: 20, 
    marginTop: 20, 
    gap: 10,
  },
  filterPill: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    backgroundColor: "#E5E7EB",
  },
  activeFilterPill: { 
    backgroundColor: "#6c3b3b",
  },
  filterText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#4B5563",
  },
  activeFilterText: { 
    color: "#FFFFFF",
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#1F2937", 
    marginHorizontal: 20, 
    marginTop: 25, 
    marginBottom: 12,
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 20,
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
    elevation: 2,
  },
  iconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 12, 
    backgroundColor: "#F5F5F4", 
    justifyContent: "center", 
    alignItems: "center",
  },
  bobaEmoji: {
    fontSize: 28,
  },
  chevronIcon: {
    marginRight: 8,
  },
  cardImage: { 
    width: 64, 
    height: 64, 
    borderRadius: 12, 
    backgroundColor: "#F3F4F6",
  },
  cardContent: { 
    flex: 1, 
    paddingLeft: 14, 
    justifyContent: "center",
  },
  restaurantTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937",
  },
  restaurantSubName: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 2, 
    fontWeight: "500",
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937",
  },
  metaText: { 
    fontSize: 13, 
    color: "#4B5563", 
    marginTop: 3, 
    fontWeight: "500",
  },
  hoursText: { 
    fontSize: 12, 
    color: "#9CA3AF", 
    marginTop: 2,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
  },
  emptyContainer: { 
    alignItems: "center", 
    marginTop: 40, 
    gap: 10,
  },
  emptyText: { 
    color: "#9CA3AF", 
    fontSize: 14,
  },
});