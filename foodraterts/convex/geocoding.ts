import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  confidence: number;
}

/**
 * Geocode an address using Mapbox Geocoding API (external API call)
 * This action receives the mapbox token from the client side
 */
export const geocodeAddressWithToken = action({
  args: {
    address: v.string(),
    city: v.string(),
    state: v.string(),
    mapboxToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { address, city, state, mapboxToken } = args;
    const fullAddress = `${address}, ${city}, ${state}, USA`;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [longitude, latitude] = feature.center;
        const confidence = feature.relevance || 0;

        return {
          latitude,
          longitude,
          formatted_address: feature.place_name || fullAddress,
          confidence,
        } as GeocodingResult;
      } else {
        throw new Error("No results found for address");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error(`Failed to geocode address: ${error}`);
    }
  },
});

/**
 * Update restaurant with coordinates (mutation)
 */
export const updateRestaurantCoordinates = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.restaurantId, {
      lat: args.lat,
      lng: args.lng,
    });
    return { success: true };
  },
});

/**
 * Batch update restaurant coordinates (mutation)
 */
export const batchUpdateRestaurantCoordinates = mutation({
  args: {
    updates: v.array(v.object({
      restaurantId: v.id("restaurants"),
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const update of args.updates) {
      try {
        await ctx.db.patch(update.restaurantId, {
          lat: update.lat,
          lng: update.lng,
        });
        results.push({ restaurantId: update.restaurantId as string, success: true });
      } catch (error) {
        results.push({
          restaurantId: update.restaurantId as string,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Get all restaurants that need geocoding (missing lat/lng)
 */
export const getRestaurantsNeedingGeocoding = query({
  args: {},
  handler: async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect();
    return restaurants.filter((r: any) => !r.lat || !r.lng);
  },
});

/**
 * Get count of restaurants with and without coordinates
 */
export const getGeocodingStats = query({
  args: {},
  handler: async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect();
    const withCoordinates = restaurants.filter((r: any) => r.lat && r.lng).length;
    const withoutCoordinates = restaurants.filter((r: any) => !r.lat || !r.lng).length;

    return {
      total: restaurants.length,
      withCoordinates,
      withoutCoordinates,
    };
  },
});

/**
 * Geocode and update a single restaurant with coordinates (action)
 * This can be called from the client with the mapbox token
 */
export const geocodeAndUpdateRestaurant = action({
  args: {
    restaurantId: v.id("restaurants"),
    mapboxToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { restaurantId, mapboxToken } = args;

    // Get restaurant data
    const restaurants: any = await ctx.runQuery(api.restaurants.listAllRestaurants, {});
    const restaurant = restaurants.find((r: any) => r._id === args.restaurantId);

    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Build full address string
    const fullAddress = `${restaurant.address}, ${restaurant.city}, ${restaurant.state}, USA`;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Mapbox API error: ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [longitude, latitude] = feature.center;

        // Update restaurant with coordinates using a mutation
        await ctx.runMutation(api.geocoding.updateRestaurantCoordinates, {
          restaurantId: args.restaurantId,
          lat: latitude,
          lng: longitude,
        });

        return {
          success: true,
          latitude,
          longitude,
          formattedAddress: feature.place_name || fullAddress,
        };
      } else {
        return {
          success: false,
          error: "No results found for address",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});