/// <reference types="node" />
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Helper function to convert zipcode to approximate coordinates
function zipcodeToCoordinates(zipcode: string): { lat: number; lng: number } | null {
  const zip = zipcode.replace(/\D/g, '');

  if (zip.length !== 5) return null;

  const first3 = parseInt(zip.substring(0, 3));

  const zipcodeRegions: Record<number, { lat: number; lng: number }> = {
    // Northeast
    100: { lat: 40.7128, lng: -74.0060 },
    101: { lat: 40.7580, lng: -73.9855 },
    102: { lat: 40.7128, lng: -74.0060 },
    103: { lat: 40.5795, lng: -74.1502 },
    104: { lat: 40.8448, lng: -73.8648 },
    105: { lat: 40.9447, lng: -73.8653 },
    106: { lat: 41.0259, lng: -73.7629 },
    107: { lat: 40.9158, lng: -73.7629 },
    108: { lat: 41.0240, lng: -73.7523 },
    109: { lat: 41.0200, lng: -73.7500 },
    110: { lat: 40.7800, lng: -73.5500 },
    111: { lat: 40.7600, lng: -73.5300 },
    112: { lat: 40.6500, lng: -73.9500 },
    113: { lat: 40.7200, lng: -73.8400 },
    114: { lat: 40.6200, lng: -73.9300 },
    115: { lat: 40.6800, lng: -73.8200 },
    116: { lat: 40.6100, lng: -73.9600 },
    117: { lat: 40.7000, lng: -73.8100 },
    118: { lat: 40.6300, lng: -73.9400 },

    // California
    900: { lat: 34.0522, lng: -118.2437 },
    901: { lat: 34.0900, lng: -118.3600 },
    902: { lat: 34.0400, lng: -118.4700 },
    903: { lat: 33.9800, lng: -118.4000 },
    904: { lat: 34.0200, lng: -118.4800 },
    905: { lat: 33.8600, lng: -118.1600 },
    906: { lat: 33.8700, lng: -118.0900 },
    907: { lat: 33.8200, lng: -118.1400 },
    908: { lat: 33.8500, lng: -118.1200 },
    910: { lat: 34.1500, lng: -118.1500 },
    911: { lat: 34.1400, lng: -118.1400 },
    912: { lat: 34.1300, lng: -118.2000 },
    913: { lat: 34.2100, lng: -118.5500 },
    914: { lat: 34.1900, lng: -118.4900 },
    915: { lat: 34.1600, lng: -118.3800 },
    916: { lat: 34.1800, lng: -118.4000 },
    917: { lat: 34.1000, lng: -117.8100 },
    918: { lat: 34.0700, lng: -118.0600 },
    919: { lat: 32.8300, lng: -117.1400 },
    920: { lat: 32.8600, lng: -117.1600 },
    921: { lat: 32.8500, lng: -117.2000 },
    922: { lat: 33.6900, lng: -114.6100 },
    923: { lat: 34.1500, lng: -116.2900 },
    924: { lat: 37.7700, lng: -122.4200 },
    925: { lat: 37.7500, lng: -122.2500 },
    926: { lat: 33.6200, lng: -117.8200 },
    927: { lat: 33.7400, lng: -117.8800 },
    928: { lat: 33.7800, lng: -117.9600 },
    930: { lat: 34.3600, lng: -119.0200 },
    931: { lat: 34.4200, lng: -119.7000 },
    932: { lat: 35.7600, lng: -119.3300 },
    933: { lat: 35.3500, lng: -119.0500 },
    934: { lat: 34.4200, lng: -120.5700 },
    935: { lat: 35.5000, lng: -118.8500 },
    936: { lat: 36.7300, lng: -119.7800 },
    937: { lat: 36.7600, lng: -119.7900 },
    938: { lat: 37.3400, lng: -121.8900 },
    939: { lat: 36.6400, lng: -121.9000 },
    940: { lat: 37.5900, lng: -122.3700 },
    941: { lat: 37.7700, lng: -122.4200 },
    942: { lat: 37.8300, lng: -122.2900 },
    943: { lat: 37.4800, lng: -122.2200 },
    944: { lat: 37.5700, lng: -122.4700 },
    945: { lat: 37.6600, lng: -122.0900 },
    946: { lat: 37.7200, lng: -122.2000 },
    947: { lat: 37.8700, lng: -122.2700 },
    948: { lat: 37.7800, lng: -122.4100 },
    949: { lat: 38.0300, lng: -122.5300 },
    950: { lat: 37.3300, lng: -121.8900 },
    951: { lat: 37.3400, lng: -121.8900 },
    952: { lat: 38.0200, lng: -121.3100 },
    953: { lat: 37.7100, lng: -121.2600 },
    954: { lat: 38.3900, lng: -120.7800 },
    955: { lat: 39.7500, lng: -121.8700 },
    956: { lat: 38.5700, lng: -121.4900 },
    957: { lat: 38.5600, lng: -121.3400 },
    958: { lat: 38.6800, lng: -121.3000 },
    959: { lat: 39.4400, lng: -121.4400 },
    960: { lat: 40.5800, lng: -122.3900 },
    961: { lat: 39.3200, lng: -120.1900 },
  };

  return zipcodeRegions[first3] || null;
}

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const listAllRestaurants = query({
  args: { 
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  }, 
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    if (!args.cityFilter || !args.stateFilter || args.cityFilter === "All") {
      return Promise.all(
        allRestaurants.map(async (restaurant) => ({
          ...restaurant,
          logoStorageId: restaurant.logoStorageId 
            ? await ctx.storage.getUrl(restaurant.logoStorageId) 
            : null,
        }))
      );
    }

    const targetCity = args.cityFilter.trim().toLowerCase();
    const targetState = args.stateFilter.trim().toLowerCase();

    const filtered = allRestaurants.filter((shop) => {
      const shopCity = shop.city?.trim().toLowerCase();
      const shopState = shop.state?.trim().toLowerCase();
      return shopCity === targetCity && shopState === targetState;
    });

    return Promise.all(
      filtered.map(async (restaurant) => ({
        ...restaurant,
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
      }))
    );
  },
});

export const getRestaurantByName = query({
  args: { name: v.string() }, 
  handler: async (ctx, args) => {
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) => q.eq("restaurantName", args.name))
      .unique(); 

    if (!restaurant) return null;

    const logoStorageId = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : null;

    return {
      ...restaurant,
      logoStorageId,
    };
  },
});

export const searchRestaurantsByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    let results = allRestaurants;
    if (args.searchTerm && args.searchTerm.trim()) {
      const lowerSearch = args.searchTerm.toLowerCase().trim();
      results = allRestaurants
        .filter((r) => r.restaurantName.toLowerCase().includes(lowerSearch))
        .slice(0, 15);
    }

    return Promise.all(
      results.map(async (restaurant) => ({
        ...restaurant,
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
      }))
    );
  },
});

export const searchAllByName = query({
  args: { namePattern: v.string() }, 
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    let results = allRestaurants;
    if (args.namePattern && args.namePattern.trim()) {
      const pattern = args.namePattern.toLowerCase().trim(); 
      results = allRestaurants
        .filter((r) => r.restaurantName.toLowerCase().startsWith(pattern))
        .slice(0, 25);
    }

    return Promise.all(
      results.map(async (restaurant) => ({
        ...restaurant,
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
      }))
    );
  },
});

export const getRestaurantDetails = query({
  args: { 
    restaurantId: v.optional(v.id("restaurants")),
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.restaurantId) {
      return null;
    }

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) return null;

    if (args.cityFilter && args.stateFilter && args.cityFilter !== "All") {
      const targetCity = args.cityFilter.trim().toLowerCase();
      const targetState = args.stateFilter.trim().toLowerCase();
      const shopCity = restaurant.city?.trim().toLowerCase();
      const shopState = restaurant.state?.trim().toLowerCase();

      if (shopCity !== targetCity || shopState !== targetState) {
        return null; 
      }
    }

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId!))
      .collect();

    const menuItemsWithRatings = await Promise.all(
      menuItems.map(async (item) => {
        const reviews = await ctx.db
          .query("itemReviews")
          .withIndex("by_itemId", (q) => q.eq("itemId", item._id))
          .collect();

        let averageRating = 0.0;
        if (reviews.length > 0) {
          const totalScore = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
          averageRating = Number((totalScore / reviews.length).toFixed(1));
        }

        const resolvedImageUrl = item.imageStorageId 
          ? await ctx.storage.getUrl(item.imageStorageId) 
          : null;

        return {
          ...item,
          imageUrl: resolvedImageUrl,
          averageRating,
          reviewCount: reviews.length,
        };
      })
    );

    const resolvedLogoStorageId = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : null;

    return {
      ...restaurant,
      logoStorageId: resolvedLogoStorageId,
      menuItems: menuItemsWithRatings,
    };
  },
});

export const userHasReviewedRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const itemIds = menuItems.map((item) => item._id);
    if (itemIds.length === 0) return false;

    for (const itemId of itemIds) {
      const review = await ctx.db
        .query("itemReviews")
        .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      
      if (review) return true;
    }

    return false;
  },
});

export const getVisitCount = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("restaurantVisits")
      .filter((q) => q.eq(q.field("restaurantId"), args.restaurantId))
      .collect();

    const uniqueVisitors = new Set(visits.map((v) => v.userId));
    return {
      totalVisits: visits.length,
      uniqueVisitors: uniqueVisitors.size,
    };
  },
});

export const listAllRestaurantsWithVisits = query({
  args: {
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    const restaurantsToReturn = !args.cityFilter || !args.stateFilter || args.cityFilter === "All"
      ? allRestaurants
      : allRestaurants.filter((shop) => {
          const targetCity = args.cityFilter!.trim().toLowerCase();
          const targetState = args.stateFilter!.trim().toLowerCase();
          const shopCity = shop.city?.trim().toLowerCase();
          const shopState = shop.state?.trim().toLowerCase();
          return shopCity === targetCity && shopState === targetState;
        });

    const restaurantsWithVisits = await Promise.all(
      restaurantsToReturn.map(async (restaurant) => {
        const visits = await ctx.db
          .query("restaurantVisits")
          .filter((q) => q.eq(q.field("restaurantId"), restaurant._id))
          .collect();

        const uniqueVisitors = new Set(visits.map((v) => v.userId));

        return {
          ...restaurant,
          logoStorageId: restaurant.logoStorageId
            ? await ctx.storage.getUrl(restaurant.logoStorageId)
            : null,
          visitCount: visits.length,
          uniqueVisitorCount: uniqueVisitors.size,
        };
      })
    );

    return restaurantsWithVisits;
  },
});

export const recordVisit = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to record a visit.");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayVisits = await ctx.db
      .query("restaurantVisits")
      .withIndex("by_user_and_restaurant", (q) => 
        q.eq("userId", userId).eq("restaurantId", args.restaurantId)
      )
      .filter((q) => q.gte(q.field("timestamp"), startOfDay.getTime()))
      .collect();

    if (todayVisits.length >= 3) {
      throw new Error("You have already checked into this place 3 times today!");
    }

    return await ctx.db.insert("restaurantVisits", {
      userId,
      restaurantId: args.restaurantId,
      timestamp: Date.now(),
    });
  },
});

export const getCoordinatesFromZipcode = query({
  args: { zipcode: v.string() },
  handler: async (ctx, args) => {
    const coords = zipcodeToCoordinates(args.zipcode);
    return coords;
  },
});

export const filterRestaurantsByDistance = query({
  args: {
    zipcode: v.string(),
    radiusMiles: v.number(),
  },
  handler: async (ctx, args) => {
    const userCoords = zipcodeToCoordinates(args.zipcode);
    if (!userCoords) {
      return [];
    }

    const allRestaurants = await ctx.db.query("restaurants").collect();

    const filteredRestaurants = allRestaurants.filter((restaurant) => {
      if (!restaurant.lat || !restaurant.lng) return false;

      const distance = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        restaurant.lat,
        restaurant.lng
      );

      return distance <= args.radiusMiles;
    });

    const restaurantsWithUrls = await Promise.all(
      filteredRestaurants.map(async (restaurant) => ({
        ...restaurant,
        logoStorageId: restaurant.logoStorageId
          ? await ctx.storage.getUrl(restaurant.logoStorageId)
          : null,
      }))
    );

    return restaurantsWithUrls;
  },
});

export const geocodeRestaurant = action({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args): Promise<{ success: boolean; latitude?: number; longitude?: number; formattedAddress?: string; error?: string }> => {
    const restaurants: any = await ctx.runQuery(api.restaurants.listAllRestaurants, {});
    const restaurant = restaurants.find((r: any) => r._id === args.restaurantId);

    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    const fullAddress: string = `${restaurant.address}, ${restaurant.city}, ${restaurant.state}, USA`;

    try {
      const mapboxToken: string | undefined = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        return {
          success: false,
          error: "Mapbox access token not configured",
        };
      }

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

export const batchGeocodeAllRestaurants = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const restaurants: any = await ctx.runQuery(api.restaurants.listAllRestaurants, {});
    const restaurantsNeedingGeocoding = restaurants.filter((r: any) => !r.lat || !r.lng);

    const results = {
      total: restaurants.length,
      needingGeocoding: restaurantsNeedingGeocoding.length,
      alreadyHaveCoordinates: restaurants.filter((r: any) => r.lat && r.lng).length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ restaurantId: string; name: string; error: string }>,
    };

    for (const restaurant of restaurantsNeedingGeocoding) {
      try {
        // Use ctx.runAction instead of calling the action directly as a function
        const geocodeResult: any = await ctx.runAction(api.restaurants.geocodeRestaurant, { restaurantId: restaurant._id });

        if (geocodeResult.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            restaurantId: restaurant._id as string,
            name: restaurant.restaurantName,
            error: geocodeResult.error || "Unknown error",
          });
        }

        results.processed++;

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push({
          restaurantId: restaurant._id as string,
          name: restaurant.restaurantName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results.processed++;
      }
    }

    return results;
  },
});