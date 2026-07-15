import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const PAGE_WIDTH = SCREEN_WIDTH - (GRID_PADDING * 2);

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // 🔑 Create a ref to control the horizontal menu carousel scroll positioning
  const menuCarouselRef = useRef<ScrollView>(null);
  
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // Fetch live backend data bundling restaurant and linked menu items
  const dbData = useQuery(api.restaurants.getRestaurantDetails, { 
    restaurantId: id as Id<"restaurants"> 
  });

  // Loading state guard
  if (dbData === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c3b3b" />
      </View>
    );
  }

  // Error state guard
  if (dbData === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyMenuText}>Restaurant profile not found.</Text>
      </View>
    );
  }

  // 🔑 1. DYNAMIC CATEGORY EXTRACTION
  const uniqueCategories = ["All"];
  dbData.menuItems?.forEach((item: any) => {
    if (item.category) {
      if (Array.isArray(item.category)) {
        item.category.forEach((cat: string) => {
          const trimmed = cat?.trim();
          if (trimmed && !uniqueCategories.includes(trimmed)) {
            uniqueCategories.push(trimmed);
          }
        });
      } 
      else if (typeof item.category === "string") {
        item.category.split(",").forEach((cat: string) => {
          const trimmed = cat.trim();
          if (trimmed && !uniqueCategories.includes(trimmed)) {
            uniqueCategories.push(trimmed);
          }
        });
      }
    }
  });

  // 🔑 2. FILTER MENU ITEMS BASED ON THE UNION FORMAT
  const filteredMenuItems = dbData.menuItems?.filter((item: any) => {
    const matchesSearch = item.itemName?.toLowerCase().includes(menuSearchQuery.toLowerCase());
    
    if (selectedCategory === "All") {
      return matchesSearch;
    }

    let matchesCategory = false;
    if (item.category) {
      if (Array.isArray(item.category)) {
        matchesCategory = item.category.some((cat: string) => cat.trim() === selectedCategory);
      } else if (typeof item.category === "string") {
        matchesCategory = item.category
          .split(",")
          .map((c: string) => c.trim())
          .includes(selectedCategory);
      }
    }

    return matchesSearch && matchesCategory;
  }) || [];

  // Helper function to chunk array into sets of 9 items per grid page
  const chunkArray = (array: any[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const gridPages = chunkArray(filteredMenuItems, 9);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollOffset / PAGE_WIDTH);
    if (currentIndex !== activePageIndex) {
      setActivePageIndex(currentIndex);
    }
  };

  // 🔑 Helper function to safely change filters and reset carousel layout back to page 1
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsDropdownVisible(false);
    setActivePageIndex(0);
    
    // Safely snap the scroll view back to coordinate position x: 0 instantly
    menuCarouselRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Dynamic Header Section */}
      <View style={styles.heroContainer}>
        <Text style={styles.restaurantTitle}>{dbData.restaurantName}</Text>
        
        <View style={styles.headerTextAlignmentBlock}>
          <Text style={styles.categorySub} numberOfLines={1}>
            📍 {dbData.address || "Address details unavailable"}
          </Text>
          
          <Text style={styles.locationSub}>
            {dbData.city && dbData.state ? `${dbData.city}, ${dbData.state}` : "Riverside, CA"}
          </Text>
        </View>
      </View>

      {/* Tab Row Pill Design */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabPill, styles.activeTabPill]}>
          <Text style={[styles.tabText, styles.activeTabText]}>MENU 👋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabPill}>
          <Text style={styles.tabText}>PHOTOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabPill}>
          <Text style={styles.tabText}>ABOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Localized Menu Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Menu Items"
          placeholderTextColor="#9CA3AF"
          value={menuSearchQuery}
          onChangeText={(text) => {
            setMenuSearchQuery(text);
            // Also reset to page 1 when searching so matches aren't lost out of bounds
            setActivePageIndex(0);
            menuCarouselRef.current?.scrollTo({ x: 0, y: 0, animated: false });
          }}
          autoCapitalize="none"
        />
        {menuSearchQuery.trim().length > 0 && (
          <TouchableOpacity onPress={() => {
            setMenuSearchQuery("");
            setActivePageIndex(0);
            menuCarouselRef.current?.scrollTo({ x: 0, y: 0, animated: false });
          }}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Filter Section Header */}
      <View style={styles.menuSectionHeader}>
        <Text style={styles.menuSectionTitle}>DRINKS & DISHES</Text>
        
        <TouchableOpacity 
          style={styles.dropdownSelector} 
          onPress={() => setIsDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Text 
            style={styles.dropdownSelectorText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedCategory === "All" ? "🏷️ All Categories" : `📁 ${selectedCategory}`}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#6c3b3b" style={styles.dropdownChevron} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal Selector Component overlay */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownMenuContainer}>
            <Text style={styles.dropdownMenuTitle}>Filter by Category</Text>
            <FlatList
              data={uniqueCategories}
              keyExtractor={(cat) => cat}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedCategory === item && styles.activeDropdownItem
                  ]}
                  // 🔑 UPDATED: Calls our new handler to clean up scroll layouts concurrently
                  onPress={() => handleCategoryChange(item)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCategory === item && styles.activeDropdownItemText
                  ]}>
                    {item === "All" ? "✨ Show All Items" : item}
                  </Text>
                  {selectedCategory === item && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {filteredMenuItems.length === 0 ? (
        <View style={styles.emptyMenuCard}>
          <Text style={styles.emptyMenuText}>No items match the selected filters.</Text>
          <TouchableOpacity 
            style={styles.addDrinkButton}
            onPress={() => router.push(`/restaurant/${dbData._id}/add-item`)}
          >
            <Text style={styles.addDrinkButtonText}>Add New Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <ScrollView 
            // 🔑 Assign our new structural anchor ref here
            ref={menuCarouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselWrapper}
          >
            {gridPages.map((pageItems: any[], pageIndex: number) => (
              <View key={`page-${pageIndex}`} style={styles.gridContainer}>
                {pageItems.map((item: any) => (
                  <View key={item._id} style={styles.compactGridCard}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.placeholderImageContainer}>
                        <Text style={{ 
                          fontSize: 50,
                          marginBottom: 10 }}>🧋</Text>
                      </View>
                    )}

                    <View style={styles.cardContent}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.itemName}</Text>
                      
                      <View style={styles.pinnedMetricsRow}>
                        <View style={styles.ratingRow}>
                          <Text style={styles.ratingText}>4.8</Text>
                          <Ionicons name="star" size={10} color="#FBBF24" />
                        </View>

                        {item.price !== undefined ? (
                          <Text style={styles.cardPriceText}>${item.price.toFixed(2)}</Text>
                        ) : (
                          <Text style={styles.cardPriceText}></Text> 
                        )}
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.rateButton}
                      activeOpacity={0.7}
                      onPress={() => {
                        router.push({
                          pathname: "/restaurant/rate/[itemId]",
                          params: { 
                            id: id as string, 
                            itemId: item._id 
                          }
                        });
                      }}
                    >
                      <Text style={styles.rateButtonText}>RATE ★</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          {gridPages.length > 1 && (
            <View style={styles.paginationDotsRow}>
              {gridPages.map((_, index) => (
                <View 
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    activePageIndex === index ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        {dbData.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${dbData.phone}`)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞 Call Shop</Text>
          </TouchableOpacity>
        )}
        {dbData.website && (
          <TouchableOpacity onPress={() => Linking.openURL(dbData.website!)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🌐 Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FAFAFA" 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#FAFAFA", 
    paddingTop: 100 
  },
  heroContainer: { 
    alignItems: 'center', 
    paddingBottom: 12,
    paddingHorizontal: 20
  },
  restaurantTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#1F2937",
    marginBottom: 8,
    textAlign: 'center'
  },
  headerTextAlignmentBlock: {
    alignItems: 'flex-start',
  },
  categorySub: { 
    fontSize: 13, 
    fontWeight: "500", 
    color: "#6B7280"
  },
  locationSub: { 
    fontSize: 13, 
    fontWeight: "500", 
    color: "#6B7280", 
    marginTop: 2,
    paddingLeft: 21 
  },
  tabRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8, 
    marginTop: 8, 
    paddingHorizontal: 20 
  },
  tabPill: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    backgroundColor: '#E5E7EB' 
  },
  activeTabPill: { 
    backgroundColor: '#6c3b3b' 
  },
  tabText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#4B5563' 
  },
  activeTabText: { 
    color: '#FFFFFF' 
  },
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFFFF", 
    marginHorizontal: 20, 
    marginTop: 18, 
    paddingHorizontal: 12, 
    height: 42, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "#E5E7EB" 
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: "#374151" 
  },
  menuSectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginTop: 10, 
    marginBottom: 14, 
    gap: 12 
  },
  menuSectionTitle: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: "#1F2937", 
    letterSpacing: 0.5 
  },
  dropdownSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(108, 59, 59, 0.08)', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 14, 
    gap: 4, 
    flexShrink: 1, 
    maxWidth: '60%' 
  },
  dropdownSelectorText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#6c3b3b', 
    flexShrink: 1 
  },
  dropdownChevron: { 
    flexShrink: 0 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  dropdownMenuContainer: { 
    backgroundColor: '#FFFFFF', 
    width: '80%', 
    maxHeight: '40%', 
    borderRadius: 20, 
    padding: 16, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4 
  },
  dropdownMenuTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  dropdownItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    borderRadius: 10, 
    marginBottom: 4 
  },
  activeDropdownItem: { 
    backgroundColor: '#6c3b3b' 
  },
  dropdownItemText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4B5563' 
  },
  activeDropdownItemText: { 
    color: '#FFFFFF' 
  },
  carouselWrapper: { 
    paddingHorizontal: GRID_PADDING 
  },
  gridContainer: { 
    width: PAGE_WIDTH, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start', 
    gap: 10, 
    paddingBottom: 10, 
    marginRight: GRID_PADDING * 2 
  },
  compactGridCard: { 
    width: '31%', 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    padding: 6, 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#F3F4F6", 
    marginBottom: 4, 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2 
  },
  cardImage: { 
    width: '100%', 
    height: 80, 
    borderRadius: 8, 
    backgroundColor: "#F3F4F6" 
  },
  placeholderImageContainer: { 
    width: '100%', 
    height: 80, 
    borderRadius: 8, 
    backgroundColor: "#F5F5F4", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  cardContent: { 
    width: '100%', 
    marginTop: 4, 
    alignItems: 'flex-start', 
    minHeight: 50 
  },
  itemName: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#1F2937", 
    lineHeight: 14 
  },
  pinnedMetricsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginTop: 'auto', 
    paddingTop: 2 
  },
  cardPriceText: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#6c3b3b" 
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 1 
  },
  ratingText: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: '#6B7280' 
  },
  rateButton: { 
    backgroundColor: '#6c3b3b', 
    width: '100%', 
    paddingVertical: 5, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 4 
  },
  rateButtonText: { 
    color: '#FFF', 
    fontSize: 9, 
    fontWeight: '700' 
  },
  paginationDotsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8, 
    marginBottom: 16, 
    gap: 6 
  },
  dot: { 
    height: 6, 
    borderRadius: 3 
  },
  activeDot: { 
    width: 14, 
    backgroundColor: '#6c3b3b' 
  },
  inactiveDot: { 
    width: 6, 
    backgroundColor: '#D1D5DB' 
  },
  actionRow: { 
    flexDirection: "row", 
    padding: 20, 
    justifyContent: "center", 
    gap: 12, 
    marginTop: 5 
  },
  actionButton: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderRadius: 20, 
    backgroundColor: "#F3F4F6" 
  },
  actionButtonText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#6c3b3b" 
  },
  emptyMenuCard: { 
    backgroundColor: "#FFFFFF", 
    marginHorizontal: 20, 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    alignItems: "center" 
  },
  emptyMenuText: { 
    color: "#9CA3AF", 
    fontSize: 13, 
    marginBottom: 12 
  },
  addDrinkButton: { 
    backgroundColor: "#6c3b3b", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  addDrinkButtonText: { 
    color: "#FFF", 
    fontWeight: "600", 
    fontSize: 12 
  }
});