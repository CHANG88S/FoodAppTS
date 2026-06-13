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
import { useRouter } from "expo-router"; // 🔥 Restored native navigation router
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter(); // 🔥 Restored router initialization
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 1. Relational data queries matching your original architecture
  const latestReviews = useQuery(api.reviews.getLatestReviews);
  const searchResults = useQuery(api.items.searchMenuItems, { searchQuery });

  // Determine what dataset to display in our main feed
  const isSearching = searchQuery.trim().length > 0;
  const displayData = isSearching ? searchResults : latestReviews;

  // Filter items locally if a category filter ("Food" / "Drink") is selected
  const filteredData = displayData?.filter((item: any) => {
    if (selectedCategory === "All") return true;
    const category = isSearching ? item.category : item.item?.category;
    return category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Render Card Component for Search Results
  const renderSearchItem = ({ item }: { item: any }) => (
    // 🔥 Added interactive tap handling: route directly to its corresponding restaurant profile
    <TouchableOpacity 
      style={styles.card}
      onPress={() => item.restaurantId && router.push(`/restaurant/${item.restaurantId}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
        style={styles.cardImage}
      />
      {/* 🛑 FIXED: Replaced standard web <div> tags with native <View> layouts */}
      <View style={styles.cardContent}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.restaurantName}>{item.restaurantName}</Text>
        <Text style={styles.priceTag}>${item.price?.toFixed(2) || "0.00"}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render Card Component for Latest Reviews Feed
  const renderReviewItem = ({ item }: { item: any }) => (
    // 🔥 Added interactive tap handling: routes straight to parent restaurant layout
    <TouchableOpacity 
      style={styles.card}
      onPress={() => item.item?.restaurantId && router.push(`/restaurant/${item.item.restaurantId}`)}
      activeOpacity={0.8}
    >
      {item.item?.imageUrl && (
        <Image source={{ uri: item.item.imageUrl }} style={styles.cardImage} />
      )}
      {/* 🛑 FIXED: Replaced standard web <div> tags with native <View> layouts */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemName}>{item.item?.itemName}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFF" />
            <Text style={styles.ratingBadgeText}>{item.overallRating}</Text>
          </View>
        </View>
        <Text style={styles.restaurantName}>{item.item?.restaurantName}</Text>
        <Text style={styles.reviewNotes} numberOfLines={2}>
          "{item.notes}"
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey there! 👋</Text>
          <Text style={styles.subtitle}>Find your next favorite item</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={36} color="#6c3b3b" />
        </TouchableOpacity>
      </View>

      {/* Modern Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search specific dishes or boba..."
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

      {/* Category Horizontal Filter Pills */}
      <View style={styles.filterRow}>
        {["All", "Drink", "Food"].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterPill,
              selectedCategory === category && styles.activeFilterPill,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === category && styles.activeFilterText,
              ]}
            >
              {category === "Drink" ? "🥤 Drinks" : category === "Food" ? "🍲 Food" : "✨ All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dynamic Main Feed Content List */}
      <Text style={styles.sectionTitle}>
        {isSearching ? "Search Results" : "🔥 Local Live Feed"}
      </Text>

      {!filteredData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c3b3b" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={isSearching ? renderSearchItem : renderReviewItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No items match your criteria.</Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 100,
    backgroundColor: "#F3F4F6",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
    fontWeight: "500",
  },
  priceTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c3b3b",
    marginTop: 6,
  },
  reviewNotes: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6c3b3b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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