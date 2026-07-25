# convex-scrape-restaurants

**description:** How to scrape restaurant/boba shop directory listings (name, city, state, category, hours, logo URL, website) from sources like Yelp/Google Maps/OpenStreetMap and bulk-import into the Convex `restaurants` table. Use whenever the user wants to enrich their local food directory by pulling data from external public directories — triggers on prompts mentioning "scrape restaurant", "load listings", or requests to find logos/websites for boba shops or restaurants.

**when:** Trigger when you should scrape and ingest:
- User asks to "scrape restaurants" OR "find all [category] in [city]" (e.g., "get me bubble tea spots in Riverside")  
- User wants bulk import from a directory like a Yelp/Google Maps listing or OpenStreetMap POI export  
- Requests for logo URLs, hours-of-operation data alongside location fields (`city`, `state`)
- The user says to load listings into the Convex table OR build out their local food map (FoodRater)

**what it does:** Extracts structured restaurant info from scraped sources and inserts rows via Convex mutations. Handles common variations in how listing services format data, including:  
  - Hours variations (e.g., string ranges vs objects)
  - Website/phone/logo fields that might be null or empty strings  
  - Category hierarchies ("Diner > American") normalized to array tags

**compatibility:** Requires `convex`. Uses Node.js built-ins (`fetch`) or standard JS parsing helpers. Works seamlessly within Convex Actions for external fetching and Mutations for database entry.

---

## What this skill enables you to do

- Pull a restaurant listing page and return structured JSON with location fields + logo URL.  
  - Example output: `{ name: "Ding Tea", city: "Riverside", state: "CA", categories: ["bubble tea", "boba shop"], hours: "11:00am - 10:00pm", website: "https://..." }`
- Ingest bulk scraped listings into Convex tables safely by executing transaction-friendly batch mutations.
- Handle hours-of-operation parsing from various formats used by listing services into unified strings or object structures.

---

## Usage examples (test prompts that will trigger this skill):

**1. Basic scrape request:**  
> *"Scrape all bubble tea shops in Riverside"*  

**2. Category+geography search:**  
> *"Get me all ramen restaurants in Los Angeles"*  

**3. Bulk directory import:**  
> *"Load this list of 50 coffee shops I exported"*  

---

## How scraping works with Convex mutations

Because Convex Actions can make external HTTP requests (`fetch`) but cannot directly modify the database, scraping must be split into an **Action** (to fetch/parse) and a **Mutation** (to insert).

```typescript
// convex/scrape.ts
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// 1. THE MUTATION: Safely handles transaction-isolated database writes
export const insertBatch = mutation({
  args: {
    restaurants: v.array(
      v.object({
        name: v.string(),
        city: v.string(),
        state: v.string(),
        categories: v.array(v.string()),
        hours: v.string(),
        website: v.optional(v.string()),
        logoUrl: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const restaurant of args.restaurants) {
      await ctx.db.insert("restaurants", restaurant);
    }
  },
});

// 2. THE ACTION: Performs the external fetch operations safely
export const loadRestaurantDirectory = action({
  args: { city: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    // Simulated fetch to public directory/API source
    // const response = await fetch(`https://api.external-directory.com/v1/search?city=${args.city}`);
    // const rawData = await response.json();
    
    const mockRawData = [
      {
        name: "Boba Time",
        hierarchy: "Cafe > Bubble Tea",
        hours_str: "Mon-Fri: 11am-10pm",
        web_url: "http://bobatime.com"
      }
    ];

    // Normalize and clean data structures
    const normalized = mockRawData.map((row) => ({
      name: row.name,
      city: args.city,
      state: "CA", 
      categories: row.hierarchy.split(">").map(s => s.trim().toLowerCase()),
      hours: row.hours_str.replace(/a\.?m/gi, "am").replace(/p\.?m/gi, "pm"),
      website: row.web_url || undefined,
      logoUrl: ""
    }));

    // Send the batch to the mutation for insertion
    await ctx.runMutation(internal.scrape.insertBatch, { restaurants: normalized });
    return { success: true, count: normalized.length };
  },
});