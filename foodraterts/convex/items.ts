import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchMenuItems = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery === "") {
      return [];
    }

    // Direct, case-insensitive lookup optimized by your searchIndex definition
    const results = await ctx.db
      .query("menuItems")
      .withSearchIndex("search_item", (q) => 
        q.search("itemName", args.searchQuery)
      )
      .take(15); // Return top 15 results for efficient UI loading

    return results;
  },
});