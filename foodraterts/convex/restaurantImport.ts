import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const restaurantValidator = v.object({
  placeId: v.optional(v.string()),
  restaurantName: v.string(),
  category: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  address: v.string(),
  phone: v.optional(v.string()),
  hours: v.optional(v.string()),
  logoStorageId: v.optional(v.id("_storage")),
  status: v.optional(v.string()),
  website: v.optional(v.string()),
  mapsLocation: v.optional(v.string()),
});

export const bulkInsertRestaurants = internalMutation({
  args: {
    restaurants: v.array(restaurantValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("restaurants").collect();
    const existingPlaceIds = new Set(
      existing.map((r) => r.placeId).filter(Boolean) as string[],
    );
    const existingKeys = new Set(
      existing.map(
        (r) =>
          `${r.restaurantName.trim().toLowerCase()}|${r.address.trim().toLowerCase()}`,
      ),
    );

    let inserted = 0;
    let skipped = 0;

    for (const restaurant of args.restaurants) {
      const key = `${restaurant.restaurantName.trim().toLowerCase()}|${restaurant.address.trim().toLowerCase()}`;

      if (restaurant.placeId && existingPlaceIds.has(restaurant.placeId)) {
        skipped++;
        continue;
      }
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      await ctx.db.insert("restaurants", restaurant);
      if (restaurant.placeId) {
        existingPlaceIds.add(restaurant.placeId);
      }
      existingKeys.add(key);
      inserted++;
    }

    return { inserted, skipped };
  },
});
