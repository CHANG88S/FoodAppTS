import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Ionicons } from "@expo/vector-icons";
import { BookmarkButton } from '../../components/BookmarkButton';
import * as ImagePicker from 'expo-image-picker';
import { CommonActions, useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const PAGE_WIDTH = SCREEN_WIDTH - (GRID_PADDING * 2);

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tab navigation from this stacked screen: navigate back to the existing
  // tabs instance (popping this page) and focus the chosen tab there, so
  // every tab keeps its scroll/state. (URL-based routing can't focus the
  // tabs — they live behind the drawer's "mainTabs" screen.)
  const navigation = useNavigation();
  const popToTab = (tab: "home" | "search" | "notification" | "profile") => {
    // pop: true returns to the EXISTING tabs instance (same key, state kept);
    // without it v7 pushes a fresh copy and every tab resets.
    navigation.dispatch(
      CommonActions.navigate(
        "(tabs)",
        { screen: "mainTabs", params: { screen: tab } },
        { pop: true }
      )
    );
  };
  
  // Ref to control the horizontal menu carousel scroll positioning
  const menuCarouselRef = useRef<ScrollView>(null);
  
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  // Staff-only item editing (long-press a menu item)
  const isStaff = useQuery(api.authz.isStaff) ?? false;
  const updateMenuItemMutation = useMutation(api.items.updateMenuItem);
  const generateUploadUrlMutation = useMutation(api.images.generateUploadUrl);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [editCategoryPickerVisible, setEditCategoryPickerVisible] = useState(false);
  const [editKeyboardHeight, setEditKeyboardHeight] = useState(0);
  const [editItemImage, setEditItemImage] = useState<{ storageId: string; previewUri: string } | null>(null);
  const [editItemRemoveImage, setEditItemRemoveImage] = useState(false);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [addChoiceVisible, setAddChoiceVisible] = useState(false);
  const renameMenuCategoryMutation = useMutation(api.items.renameMenuCategory);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameCategoryValue, setRenameCategoryValue] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const editingItemImageUrl = useQuery(
    api.images.getPublicUrl,
    editingItem?.imageStorageId && !editItemImage
      ? { storageId: editingItem.imageStorageId }
      : "skip"
  );

  // Lift the editor sheet above the keyboard while typing
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => setEditKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardWillHide", () => setEditKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Fetch live backend data bundling restaurant and linked menu items
  const dbData = useQuery(api.restaurants.getRestaurantDetails, { 
    restaurantId: id as Id<"restaurants"> 
  });

  // Query to check if the current user has submitted at least one review for this restaurant
  const userHasReviewed = useQuery(api.items.userHasReviewedRestaurant, {
    restaurantId: id as Id<"restaurants">
  });

  // Mutation to track user visits
  const recordVisitMutation = useMutation(api.restaurants.recordVisit);

  // Query to get visit statistics for this restaurant
  const visitStats = useQuery(api.restaurants.getVisitCount, {
    restaurantId: id as Id<"restaurants">
  });

  // Query to get reviews with photos for this restaurant
  const reviewsWithPhotos = useQuery(api.items.getReviewsWithPhotosForRestaurant, {
    restaurantId: id as Id<"restaurants">
  }) || [];

  // Batch-resolve review photo URLs
  const photoStorageIds = [...new Set(reviewsWithPhotos.map((r: any) => r.imageStorageId).filter(Boolean))];
  const photoUrls = useQuery(
    api.images.getPublicUrls,
    photoStorageIds.length ? { storageIds: photoStorageIds } : "skip"
  ) || {};

  const handleVisitedPress = async () => {
    // Check if user has reviewed a menu item at this restaurant first
    if (!userHasReviewed) {
      Alert.alert(
        "Review Required", 
        "You must submit a review for at least one item at this restaurant before you can log a visit!"
      );
      return;
    }

    try {
      await recordVisitMutation({ restaurantId: id as Id<"restaurants"> });
      Alert.alert("Success", "Visit logged successfully! 🎉");
    } catch (error: any) {
      Alert.alert("Notice", error.message || "You have reached the maximum number of visits allowed for today.");
    }
  };

  // Loading state guard
  if (dbData === undefined || userHasReviewed === undefined) {
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

  // 🔑 HELPER FUNCTION: Returns a dynamic emoji matching the restaurant or item category
  const getCategoryEmoji = (categoryString?: string | string[]): string => {
    if (!categoryString) return "🧋"; 
    
    const cat = Array.isArray(categoryString) 
      ? categoryString[0]?.toLowerCase() || "" 
      : String(categoryString).toLowerCase();

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
    if (cat.includes("food")) return "🍲";

    return "🧋"; 
  };

  // 1. DYNAMIC CATEGORY EXTRACTION
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

  // Fold in staff-defined menu categories so they appear in the filter dropdown
  dbData?.menuCategories?.forEach((cat: string) => {
    const trimmed = cat?.trim();
    if (trimmed && !uniqueCategories.includes(trimmed)) {
      uniqueCategories.push(trimmed);
    }
  });

  // Categories available for the staff item editor (excluding the "All" filter entry)
  const editCategories = uniqueCategories.filter((cat) => cat !== "All");

  const openItemEditor = (item: any) => {
    const rawCategory = Array.isArray(item.category)
      ? item.category.join(", ")
      : item.category || "";
    setEditingItem(item);
    setEditItemName(item.itemName || "");
    setEditItemCategory(rawCategory.split(",")[0]?.trim() || "");
    setEditCategoryPickerVisible(false);
    setEditItemImage(null);
    setEditItemRemoveImage(false);
  };

  const handleSaveItemEdit = async () => {
    if (!editingItem) return;
    if (!editItemName.trim()) {
      Alert.alert("Error", "Item name cannot be empty.");
      return;
    }
    try {
      await updateMenuItemMutation({
        itemId: editingItem._id,
        itemName: editItemName.trim(),
        category: editItemCategory.trim() || undefined,
        imageStorageId: editItemImage
          ? (editItemImage.storageId as Id<"_storage">)
          : editItemRemoveImage
          ? null
          : undefined,
      });
      setEditingItem(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update item.");
    }
  };

  const handlePickItemImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      setUploadingItemImage(true);
      const uploadUrl = await generateUploadUrlMutation();
      const blob = await (await fetch(asset.uri)).blob();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });
      if (!uploadResult.ok) throw new Error("Upload failed");
      const json: any = await uploadResult.json();
      setEditItemImage({ storageId: json.storageId, previewUri: asset.uri });
      setEditItemRemoveImage(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload image.");
    } finally {
      setUploadingItemImage(false);
    }
  };

  const handleRemoveItemImage = () => {
    setEditItemImage(null);
    setEditItemRemoveImage(true);
  };

  const openRenameCategory = (name: string) => {
    setRenamingCategory(name);
    setRenameCategoryValue(name);
  };

  const handleSaveCategoryRename = async () => {
    if (!renamingCategory || !dbData) return;
    const newName = renameCategoryValue.trim();
    if (!newName) {
      Alert.alert("Error", "Category name cannot be empty.");
      return;
    }
    if (newName === renamingCategory) {
      setRenamingCategory(null);
      return;
    }
    setSavingRename(true);
    try {
      await renameMenuCategoryMutation({
        restaurantId: dbData._id,
        oldName: renamingCategory,
        newName,
      });
      setSelectedCategories((prev) =>
        prev.map((c) => (c === renamingCategory ? newName : c))
      );
      setRenamingCategory(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to rename category.");
    } finally {
      setSavingRename(false);
    }
  };

  // 2. FILTER MENU ITEMS BASED ON THE UNION FORMAT
  const filteredMenuItems = dbData.menuItems?.filter((item: any) => {
    const matchesSearch = item.itemName?.toLowerCase().includes(menuSearchQuery.toLowerCase());

    if (selectedCategories.length === 0) {
      return matchesSearch;
    }

    const itemCats: string[] = Array.isArray(item.category)
      ? item.category.map((c: string) => c.trim())
      : typeof item.category === "string"
        ? item.category.split(",").map((c: string) => c.trim())
        : [];
    const matchesCategory = itemCats.some((c: string) => selectedCategories.includes(c));

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

  // Multi-select: toggling a category adds/removes it from the filter; empty = show all
  const handleCategoryChange = (category: string) => {
    if (category === "All") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) =>
        prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
      );
    }
    setActivePageIndex(0);
    menuCarouselRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
      
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />

      {/* Dynamic Header Section */}
      <View style={[styles.heroContainer, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 6 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#6c3b3b" />
        </TouchableOpacity>

        <View style={[styles.bookmarkButton, { top: insets.top + 6 }]}>
          <BookmarkButton targetType="restaurant" targetId={String(id)} size={24} />
        </View>

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
        <TouchableOpacity
          style={[styles.tabPill, activeTab === "menu" && styles.activeTabPill]}
          onPress={() => { Keyboard.dismiss(); setActiveTab("menu"); }}
        >
          <Text style={[styles.tabText, activeTab === "menu" && styles.activeTabText]}>MENU 👋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === "photos" && styles.activeTabPill]}
          onPress={() => { Keyboard.dismiss(); setActiveTab("photos"); }}
        >
          <Text style={[styles.tabText, activeTab === "photos" && styles.activeTabText]}>PHOTOS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === "about" && styles.activeTabPill]}
          onPress={() => { Keyboard.dismiss(); setActiveTab("about"); }}
        >
          <Text style={[styles.tabText, activeTab === "about" && styles.activeTabText]}>ABOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabPill} onPress={handleVisitedPress}>
          <Text style={styles.tabText}>VISITED ✅</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        {visitStats && (
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#6c3b3b" />
            <Text style={styles.statText}>
              {visitStats.totalVisits || 0} {visitStats.totalVisits === 1 ? 'visit' : 'visits'}
            </Text>
          </View>
        )}
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

      {/* MENU TAB CONTENT */}
      {activeTab === "menu" && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Menu Items"
              placeholderTextColor="#9CA3AF"
              value={menuSearchQuery}
              onChangeText={(text) => {
                setMenuSearchQuery(text);
                setActivePageIndex(0);
                menuCarouselRef.current?.scrollTo({ x: 0, y: 0, animated: false });
              }}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
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

          <View style={styles.menuSectionHeader}>
            <Text style={styles.menuSectionTitle}>DRINKS & DISHES</Text>
            
            <View style={styles.headerRightControls}>
              <TouchableOpacity 
                style={styles.dropdownSelector} 
                onPress={() => setIsDropdownVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownSelectorText} numberOfLines={1} ellipsizeMode="tail">
                  {selectedCategories.length === 0
                    ? "🏷️ All Categories"
                    : selectedCategories.length === 1
                    ? `📁 ${selectedCategories[0]}`
                    : `📁 ${selectedCategories.length} selected`}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#6c3b3b" style={styles.dropdownChevron} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallPlusButton}
                onPress={() => {
                  if (isStaff) {
                    setAddChoiceVisible(true);
                  } else {
                    router.push(`/restaurant/${dbData._id}/add-item`);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#6c3b3b" />
              </TouchableOpacity>
            </View>
          </View>

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
                {selectedCategories.length > 0 && (
                  <Text style={styles.dropdownMenuHint}>
                    Tap to toggle · pick as many as you like
                  </Text>
                )}
                <FlatList
                  data={uniqueCategories}
                  keyExtractor={(cat) => cat}
                  renderItem={({ item }) => {
                    const isSelected = item !== "All" && selectedCategories.includes(item);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.activeDropdownItem
                        ]}
                        onPress={() => handleCategoryChange(item)}
                        onLongPress={isStaff && item !== "All" ? () => openRenameCategory(item) : undefined}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          isSelected && styles.activeDropdownItemText
                        ]}>
                          {item === "All" ? "✨ Show All Items" : item}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
                <TouchableOpacity
                  style={styles.dropdownDoneButton}
                  onPress={() => setIsDropdownVisible(false)}
                >
                  <Text style={styles.dropdownDoneButtonText}>
                    {selectedCategories.length > 0 ? `Done (${selectedCategories.length})` : "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Staff item editor (long-press a menu item) */}
          <Modal
            visible={!!editingItem}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setEditingItem(null)}
          >
            <TouchableOpacity
              style={[styles.editOverlay, editKeyboardHeight > 0 && { paddingBottom: editKeyboardHeight }]}
              activeOpacity={1}
              onPress={() => setEditingItem(null)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.editSheet}>
                <Text style={styles.editSheetTitle}>Edit Item</Text>
                <Text style={styles.editSheetSubtitle}>
                  Changes are visible to everyone immediately.
                </Text>

                <Text style={styles.editLabel}>Image</Text>
                <View style={styles.editImageRow}>
                  {editItemImage ? (
                    <Image source={{ uri: editItemImage.previewUri }} style={styles.editImageThumb} />
                  ) : !editItemRemoveImage && editingItemImageUrl ? (
                    <Image source={{ uri: editingItemImageUrl }} style={styles.editImageThumb} />
                  ) : (
                    <View style={[styles.editImageThumb, styles.editImageThumbEmpty]}>
                      <Ionicons name="image-outline" size={22} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.editImageActions}>
                    <TouchableOpacity
                      style={styles.editImageButton}
                      onPress={handlePickItemImage}
                      disabled={uploadingItemImage}
                    >
                      {uploadingItemImage ? (
                        <ActivityIndicator size="small" color="#6c3b3b" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={15} color="#6c3b3b" />
                          <Text style={styles.editImageButtonText}>
                            {editItemImage || editingItemImageUrl ? "Replace" : "Add Photo"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {(editItemImage || (!editItemRemoveImage && editingItemImageUrl)) && (
                      <TouchableOpacity
                        style={[styles.editImageButton, styles.editImageButtonDanger]}
                        onPress={handleRemoveItemImage}
                        disabled={uploadingItemImage}
                      >
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                        <Text style={[styles.editImageButtonText, styles.editImageButtonTextDanger]}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: editKeyboardHeight > 0 ? 230 : 420 }}
                >
                  <Text style={styles.editLabel}>Item name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editItemName}
                    onChangeText={setEditItemName}
                    placeholder="Item name"
                    placeholderTextColor="#9CA3AF"
                  />

                  <Text style={styles.editLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.editCategorySelector}
                    onPress={() => setEditCategoryPickerVisible(!editCategoryPickerVisible)}
                  >
                    <Text style={styles.editCategorySelectorText} numberOfLines={1}>
                      {editItemCategory || "No category"}
                    </Text>
                    <Ionicons
                      name={editCategoryPickerVisible ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#6c3b3b"
                    />
                  </TouchableOpacity>
                  {editCategoryPickerVisible && (
                    <View style={styles.editCategoryList}>
                      {editCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.editCategoryOption,
                            editItemCategory === cat && styles.editCategoryOptionActive
                          ]}
                          onPress={() => {
                            setEditItemCategory(cat);
                            setEditCategoryPickerVisible(false);
                          }}
                          onLongPress={isStaff ? () => openRenameCategory(cat) : undefined}
                        >
                          <Text
                            style={[
                              styles.editCategoryOptionText,
                              editItemCategory === cat && styles.editCategoryOptionTextActive
                            ]}
                          >
                            {cat}
                          </Text>
                          {editItemCategory === cat && (
                            <Ionicons name="checkmark" size={16} color="#6c3b3b" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <View style={styles.editSheetActions}>
                  <TouchableOpacity
                    style={[styles.editSheetButton, styles.editSheetCancelButton]}
                    onPress={() => setEditingItem(null)}
                  >
                    <Text style={styles.editSheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editSheetButton} onPress={handleSaveItemEdit}>
                    <Text style={styles.editSheetSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Staff: choose what to add from the + button */}
          <Modal
            visible={addChoiceVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setAddChoiceVisible(false)}
          >
            <TouchableOpacity
              style={styles.editOverlay}
              activeOpacity={1}
              onPress={() => setAddChoiceVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.editSheet}>
                <Text style={styles.editSheetTitle}>Add to this place</Text>
                <View style={styles.addChoiceList}>
                  <TouchableOpacity
                    style={styles.addChoiceOption}
                    onPress={() => {
                      setAddChoiceVisible(false);
                      router.push(`/restaurant/${dbData._id}/add-item`);
                    }}
                  >
                    <Ionicons name="restaurant-outline" size={20} color="#6c3b3b" />
                    <Text style={styles.addChoiceText}>Add an Item</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addChoiceOption}
                    onPress={() => {
                      setAddChoiceVisible(false);
                      router.push({
                        pathname: `/restaurant/${dbData._id}/add-item`,
                        params: { mode: "category" },
                      } as any);
                    }}
                  >
                    <Ionicons name="pricetag-outline" size={20} color="#6c3b3b" />
                    <Text style={styles.addChoiceText}>Add a Category</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.editSheetButton, styles.editSheetCancelButton]}
                  onPress={() => setAddChoiceVisible(false)}
                >
                  <Text style={styles.editSheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Staff: rename a menu category (long-press it) */}
          <Modal
            visible={!!renamingCategory}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setRenamingCategory(null)}
          >
            <TouchableOpacity
              style={[styles.editOverlay, editKeyboardHeight > 0 && { paddingBottom: editKeyboardHeight }]}
              activeOpacity={1}
              onPress={() => setRenamingCategory(null)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.editSheet}>
                <Text style={styles.editSheetTitle}>Rename Category</Text>
                <Text style={styles.editSheetSubtitle}>
                  Updates every item using this category at this place.
                </Text>
                <TextInput
                  style={styles.editInput}
                  value={renameCategoryValue}
                  onChangeText={setRenameCategoryValue}
                  placeholder="Category name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
                <View style={styles.editSheetActions}>
                  <TouchableOpacity
                    style={[styles.editSheetButton, styles.editSheetCancelButton]}
                    onPress={() => setRenamingCategory(null)}
                    disabled={savingRename}
                  >
                    <Text style={styles.editSheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editSheetButton}
                    onPress={handleSaveCategoryRename}
                    disabled={savingRename}
                  >
                    {savingRename ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.editSheetSaveText}>Rename</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
                      <MenuItemCard
                        key={item._id}
                        item={item}
                        restaurantCategory={dbData.category}
                        restaurantId={id as string}
                        router={router}
                        getCategoryEmoji={getCategoryEmoji}
                        onLongPress={isStaff ? () => openItemEditor(item) : undefined}
                      />
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
        </>
      )}

      {/* PHOTOS TAB CONTENT (3-COLUMN LAYOUT) */}
      {activeTab === "photos" && (
        <View style={styles.photosTabContent}>
          <Text style={styles.photosTabTitle}>Customer Photos</Text>
          <Text style={styles.photosTabSubtitle}>
            See what others are enjoying at {dbData.restaurantName}
          </Text>

          {reviewsWithPhotos.length === 0 ? (
            <View style={styles.emptyPhotosContainer}>
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyPhotosText}>No photos yet</Text>
              <Text style={styles.emptyPhotosSubtext}>Be the first to add a photo with your review!</Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {reviewsWithPhotos.map((review: any) => (
                <View key={review._id} style={styles.photoCard}>
                  <Image
                    source={{ uri: photoUrls[review.imageStorageId] || '' }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoItemName} numberOfLines={1}>{review.itemName}</Text>
                    <View style={styles.photoRatingRow}>
                      <Ionicons name="star" size={10} color="#FBBF24" />
                      <Text style={styles.photoRatingText}>{review.overallRating?.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ABOUT TAB CONTENT */}
      {activeTab === "about" && (
        <View style={styles.aboutTabContent}>
          <Text style={styles.aboutTabTitle}>About {dbData.restaurantName}</Text>

          {dbData.address && (
            <View style={styles.aboutRow}>
              <Ionicons name="location-outline" size={18} color="#6c3b3b" style={styles.aboutIcon} />
              <Text style={styles.aboutText}>{dbData.address}</Text>
            </View>
          )}

          {dbData.city && dbData.state && (
            <View style={styles.aboutRow}>
              <Ionicons name="map-outline" size={18} color="#6c3b3b" style={styles.aboutIcon} />
              <Text style={styles.aboutText}>{dbData.city}, {dbData.state}</Text>
            </View>
          )}

          {dbData.phone && (
            <View style={styles.aboutRow}>
              <Ionicons name="call-outline" size={18} color="#6c3b3b" style={styles.aboutIcon} />
              <Text style={styles.aboutText}>{dbData.phone}</Text>
            </View>
          )}

          {dbData.website && (
            <TouchableOpacity onPress={() => Linking.openURL(dbData.website!)}>
              <View style={styles.aboutRow}>
                <Ionicons name="globe-outline" size={18} color="#6c3b3b" style={styles.aboutIcon} />
                <Text style={styles.aboutLink}>{dbData.website}</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.aboutStatsRow}>
            <View style={styles.aboutStatItem}>
              <Text style={styles.aboutStatValue}>{visitStats?.totalVisits || 0}</Text>
              <Text style={styles.aboutStatLabel}>Visits</Text>
            </View>
            <View style={styles.aboutStatDivider} />
            <View style={styles.aboutStatItem}>
              <Text style={styles.aboutStatValue}>{reviewsWithPhotos.length}</Text>
              <Text style={styles.aboutStatLabel}>Photos</Text>
            </View>
          </View>
        </View>
      )}

      </ScrollView>
      </TouchableWithoutFeedback>

      {/* Floating Pill Navigation */}
      <View style={styles.floatingPillContainer}>
        <TouchableOpacity style={styles.pillItem} onPress={() => popToTab("home")}>
          <Ionicons name="home" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => popToTab("search")}>
          <Ionicons name="search" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => popToTab("notification")}>
          <Ionicons name="heart-outline" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => popToTab("profile")}>
          <Ionicons name="person-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MenuItemCard({ item, restaurantCategory, restaurantId, router, getCategoryEmoji, onLongPress }: { item: any; restaurantCategory?: string; restaurantId: string; router: any; getCategoryEmoji: (cat?: string | string[]) => string; onLongPress?: () => void }) {
  const imageUrl = useQuery(
    api.images.getPublicUrl,
    item.imageStorageId ? { storageId: item.imageStorageId } : "skip"
  );

  // Placeholder emoji: the item's own category first; if nothing matches (would
  // default to 🧋), fall back to the restaurant's category before settling on 🧋
  const itemCategoryEmoji = getCategoryEmoji(item.category);
  const placeholderEmoji =
    itemCategoryEmoji !== "🧋" ? itemCategoryEmoji : getCategoryEmoji(restaurantCategory);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={!onLongPress}
      onLongPress={onLongPress}
      style={styles.compactGridCardCell}
    >
    <View style={styles.compactGridCard}>
      <View style={styles.imageWrapperFrame}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.placeholderImageContainer}>
            <Text style={{ fontSize: 32 }}>{placeholderEmoji}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.itemName} numberOfLines={2}>{item.itemName}</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.pinnedMetricsRow}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>
              {item.averageRating > 0 ? item.averageRating.toFixed(1) : "New"}
            </Text>
            <Ionicons name="star" size={10} color="#FBBF24" />
          </View>

          {item.price !== undefined ? (
            <Text style={styles.cardPriceText}>${item.price.toFixed(2)}</Text>
          ) : (
            <Text style={styles.cardPriceText}></Text> 
          )}
        </View>

        <TouchableOpacity 
          style={styles.rateButton}
          activeOpacity={0.7}
          onPress={() => {
            router.push({
              pathname: "/restaurant/rate/[itemId]",
              params: { 
                id: restaurantId, 
                itemId: item._id 
              }
            });
          }}
        >
          <Text style={styles.rateButtonText}>RATE ★</Text>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA"
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  editImageThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  editImageThumbEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  editImageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  editImageButtonDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  editImageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  editImageButtonTextDanger: {
    color: '#DC2626',
  },
  addChoiceList: {
    marginTop: 14,
    marginBottom: 16,
    gap: 8,
  },
  addChoiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addChoiceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownMenuHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  dropdownDoneButton: {
    marginTop: 10,
    backgroundColor: '#6c3b3b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dropdownDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  editSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  editSheetSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 14,
  },
  editCategorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editCategorySelectorText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  editCategoryList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  editCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  editCategoryOptionActive: {
    backgroundColor: '#F9F1F1',
  },
  editCategoryOptionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  editCategoryOptionTextActive: {
    color: '#6c3b3b',
    fontWeight: '700',
  },
  editSheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  editSheetButton: {
    flex: 1,
    backgroundColor: '#6c3b3b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSheetCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  editSheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  editSheetSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  heroContainer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 55,
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 53,
    zIndex: 10,
    padding: 4,
  },
  bookmarkButton: {
    position: 'absolute',
    right: 20,
    top: 53,
    zIndex: 10,
    padding: 4,
  },
  restaurantTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 36,
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
    marginTop: 6,
    paddingHorizontal: 20
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
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
    marginTop: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
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
    marginTop: 8,
    marginBottom: 10,
    gap: 12
  },
  menuSectionTitle: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: "#1F2937", 
    letterSpacing: 0.5 
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
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
  smallPlusButton: {
    backgroundColor: 'rgba(108, 59, 59, 0.08)',
    padding: 7,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignContent: 'flex-start',
    gap: 6, 
    paddingBottom: 10, 
    marginRight: GRID_PADDING * 2 
  },
  compactGridCardCell: {
    width: '32%',
  },
  compactGridCard: {
    width: '100%',
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    padding: 6, 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#F3F4F6", 
    marginBottom: 6, 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2,
    height: 165,
  },
  imageWrapperFrame: {
    width: '100%',
    height: 75,
    borderRadius: 8,
    backgroundColor: "#F5F5F4", 
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
  },
  placeholderImageContainer: { 
    width: '100%', 
    height: '100%', 
    justifyContent: "center", 
    alignItems: "center" 
  },
  cardContent: { 
    width: '100%', 
    marginTop: 4, 
    alignItems: 'flex-start', 
    height: 28,
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
  bottomSection: {
    width: '100%',
    marginTop: 'auto',
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 12,
    marginTop: 3
  },
  actionButton: {
    flex: 1,
    maxWidth: 100,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6"
  },
  actionButtonText: {
    fontSize: 12,
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
  },
  floatingPillContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 40,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 6,
    paddingTop: 6,
  },
  pillItem: {
    padding: 3,
  },
  photosTabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  photosTabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  photosTabSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyPhotosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyPhotosSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // UPDATED 3-COLUMN PHOTOS GRID STYLES ONLY
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photoCard: {
    width: (SCREEN_WIDTH - 40 - 12) / 3,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoImage: {
    width: '100%',
    height: 115,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
  },
  photoItemName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  photoRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aboutTabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  aboutTabTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutIcon: {
    width: 24,
  },
  aboutText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  aboutLink: {
    fontSize: 14,
    color: '#6c3b3b',
    textDecorationLine: 'underline',
    flex: 1,
  },
  aboutStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 24,
  },
  aboutStatItem: {
    alignItems: 'center',
  },
  aboutStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6c3b3b',
  },
  aboutStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  aboutStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#6c3b3b",
    fontWeight: "600",
  },
});