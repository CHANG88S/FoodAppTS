import { query } from "./_generated/server";

// Simple API function called: api.reviews.get
export const get = query({
  args: {},
  handler: async (ctx) => {
    // Pulls and reads records from your dynamic document collection store
    return await ctx.db.query("itemReviews").collect();
  },
});