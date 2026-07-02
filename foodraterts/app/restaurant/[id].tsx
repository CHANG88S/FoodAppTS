import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const data = useQuery(api.restaurants.getRestaurantDetails, { 
    restaurantId: id as Id<"restaurants"> 
  });

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c3b3b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroContainer}>
        <Text style={styles.restaurantTitle}>{data.restaurantName}</Text>
        <Text style={styles.categorySub}>{data.category || "🧋 Bubble Tea Store"}</Text>
      </View>

      <View style={styles.actionRow}>
        {data.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${data.phone}`)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>
        )}
        {data.website && (
          <TouchableOpacity onPress={() => Linking.openURL(data.website!)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🌐 Website</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{data.address || "No address listed"}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Hours</Text>
          <Text style={styles.infoValue}>{data.hours || "Hours unavailable"}</Text>
        </View>
      </View>

      <View style={styles.menuHeaderContainer}>
        <Text style={styles.menuSectionTitle}>Menu & Signature Items</Text>
      </View>

      <View style={styles.menuFeedContainer}>
        {data.menuItems.length === 0 ? (
          <View style={styles.emptyMenuCard}>
            <Text style={styles.emptyMenuText}>No menu items added yet.</Text>
            <TouchableOpacity 
              style={styles.addDrinkButton}
              onPress={() => router.push(`/restaurant/${data._id}/add-item`)}
            >
              <Text style={styles.addDrinkButtonText}>Add First Drink</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data.menuItems.map((item: any) => (
            <TouchableOpacity key={item._id} style={styles.menuCard} activeOpacity={0.8}>
              <View style={styles.menuCardContent}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.cardRestaurantName}>📍 {data.restaurantName}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.price && <Text style={styles.priceTag}>${item.price.toFixed(2)}</Text>}
              </View>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={styles.placeholderImageContainer}>
                  <Text style={{ fontSize: 24 }}>🧋</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  heroContainer: { backgroundColor: "rgba(108, 59, 59, 0.08)", padding: 24, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  restaurantTitle: { fontSize: 24, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  categorySub: { fontSize: 14, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  actionRow: { flexDirection: "row", padding: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#E5E7EB", justifyContent: "space-around" },
  actionButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F3F4F6" },
  actionButtonText: { fontSize: 14, fontWeight: "600", color: "#6c3b3b" },
  infoSection: { padding: 16, gap: 12 },
  infoCard: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", elevation: 1 },
  infoLabel: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 15, color: "#374151", fontWeight: "500" },
  menuHeaderContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  menuSectionTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  menuFeedContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyMenuCard: { backgroundColor: "#FFFFFF", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  emptyMenuText: { color: "#9CA3AF", fontSize: 14, marginBottom: 12 },
  addDrinkButton: { backgroundColor: "#6c3b3b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addDrinkButtonText: { color: "#FFF", fontWeight: "600", fontSize: 12 },
  menuCard: { flexDirection: "row", backgroundColor: "#FFFFFF", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", marginBottom: 12, elevation: 2 },
  menuCardContent: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  cardRestaurantName: { fontSize: 13, color: "#4B5563", fontWeight: "500", marginTop: 2 },
  itemCategory: { fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  priceTag: { fontSize: 14, fontWeight: "600", color: "#6c3b3b", marginTop: 4 },
  cardImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#F3F4F6" },
  placeholderImageContainer: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#F5F5F4", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
});