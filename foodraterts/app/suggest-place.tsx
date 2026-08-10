import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  'Bubble Tea',
  'Tea Shop',
  'Coffee',
  'Cafe',
  'Bakery',
  'Dessert',
  'Sushi',
  'Ramen',
  'BBQ',
  'Korean BBQ',
  'Buffet',
  'Burger',
  'Donut',
  'Ice Cream',
  'Yogurt',
  'Shabu',
  'Restaurant',
  'Other',
];

export default function SuggestPlaceScreen() {
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestPlace = useMutation(api.suggestions.suggestPlace);

  const handleSubmit = async () => {
    if (!restaurantName.trim() || !address.trim() || !city.trim() || !state.trim() || !category.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await suggestPlace({
        restaurantName: restaurantName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        phone: phone.trim() || undefined,
        category: category.trim(),
        website: website.trim() || undefined,
      });

      Alert.alert(
        'Submitted ✅',
        'Your place suggestion has been submitted for review. We\'ll notify you once it\'s approved!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Submission Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hides Expo Router's automatic default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suggest a Place</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.instruction}>
          Found a great spot not in our database? Suggest it here and our team will review and add it!
        </Text>

        <Text style={styles.requiredNote}>* Required fields</Text>

        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Kung Fu Tea"
          value={restaurantName}
          onChangeText={setRestaurantName}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 123 Main St"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., San Francisco"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>State *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., CA"
          value={state}
          onChangeText={setState}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., (415) 555-0123"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, category === cat && styles.activeCategoryPill]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  category === cat && styles.activeCategoryPillText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Website (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., https://example.com"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
        />

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            📍 Map pin-drop will be added here in Part C (Mapbox integration)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Suggestion</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    padding: 4,
    width: 50,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c3b3b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  requiredNote: {
    fontSize: 11,
    color: '#DC2626',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#374151',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeCategoryPill: {
    backgroundColor: '#6c3b3b',
    borderColor: '#6c3b3b',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeCategoryPillText: {
    color: '#FFFFFF',
  },
  mapPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#6c3b3b',
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});