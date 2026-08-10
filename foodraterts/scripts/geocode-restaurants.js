/**
 * Client-side script to batch geocode all restaurants using Mapbox API
 * Run this with: node scripts/geocode-restaurants.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Read token from environment variable
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

if (!MAPBOX_TOKEN) {
  console.error('❌ Error: EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable not set');
  console.error('Please set it in your .env.local file:');
  console.error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here');
  process.exit(1);
}

console.log('✅ Mapbox token loaded from environment');

// Sample addresses from your restaurants (you can get these from your database)
const restaurants = [
  {
    restaurantId: 'jh73qwjdt2nfsk66jf46gbavws88ev4t',
    name: 'Bobo The Boba',
    address: '3519 Van Buren Boulevard #103',
    city: 'Riverside',
    state: 'CA'
  },
  {
    restaurantId: 'jh74k89mhsf078w9f7xbwmxjw188e24v',
    name: 'FENG CHA Riverside',
    address: '3430 La Sierra Ave # A',
    city: 'Riverside',
    state: 'CA'
  },
  {
    restaurantId: 'jh7fwqdwv754d7b597je7j325s88e8tp',
    name: 'Its Boba Time - Riverside',
    address: '10082 Magnolia Ave',
    city: 'Riverside',
    state: 'CA'
  }
];

async function geocodeAddress(address, city, state) {
  const fullAddress = `${address}, ${city}, ${state}, USA`;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.center;

      return {
        latitude,
        longitude,
        formatted_address: feature.place_name || fullAddress,
        confidence: feature.relevance || 0
      };
    } else {
      throw new Error('No results found for address');
    }
  } catch (error) {
    console.error(`Error geocoding ${fullAddress}:`, error.message);
    return null;
  }
}

async function batchGeocodeRestaurants() {
  console.log('Starting batch geocoding for', restaurants.length, 'restaurants...\n');

  const results = {
    total: restaurants.length,
    successful: 0,
    failed: 0,
    coordinates: []
  };

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    console.log(`[${i + 1}/${restaurants.length}] Geocoding: ${restaurant.name}`);

    const coordinates = await geocodeAddress(restaurant.address, restaurant.city, restaurant.state);

    if (coordinates) {
      console.log(`  ✅ Success: ${coordinates.latitude}, ${coordinates.longitude}`);
      results.successful++;
      results.coordinates.push({
        restaurantId: restaurant.restaurantId,
        name: restaurant.name,
        lat: coordinates.latitude,
        lng: coordinates.longitude
      });
    } else {
      console.log(`  ❌ Failed: Could not geocode address`);
      results.failed++;
    }

    // Add small delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n=== BATCH GEOCODING COMPLETE ===');
  console.log(`Total: ${results.total}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Failed: ${results.failed}`);

  console.log('\n=== COORDINATES FOR DATABASE UPDATE ===');
  console.log(JSON.stringify(results.coordinates, null, 2));

  // Return the coordinates in format ready for Convex mutation
  return results.coordinates;
}

// Run the batch geocoding
batchGeocodeRestaurants().catch(console.error);