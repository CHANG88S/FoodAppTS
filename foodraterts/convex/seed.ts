import { mutation } from "./_generated/server";

/**
 * SEED DATABASE - Populates your Convex database with sample data
 * Run this once via: npx convex run seed
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingRestaurants = await ctx.db.query("restaurants").first();
    if (existingRestaurants) {
      return { message: "Database already seeded. Skipping..." };
    }

    // Sample restaurants data
    const restaurants = [
      {
        restaurantName: "Tea Topia",
        category: "Boba & Drinks",
        city: "Riverside",
        state: "CA",
        address: "1234 University Ave",
        phone: "(951) 555-0101",
        hours: "Mon-Sun: 11:00 AM - 10:00 PM",
        website: "https://teatopia.example.com",
        status: "active",
      },
      {
        restaurantName: "Sushi Paradise",
        category: "Sushi",
        city: "Riverside",
        state: "CA",
        address: "5678 Main St",
        phone: "(951) 555-0102",
        hours: "Mon-Sun: 11:30 AM - 9:30 PM",
        website: "https://sushiparadise.example.com",
        status: "active",
      },
      {
        restaurantName: "Ramen House",
        category: "Ramen & Noodles",
        city: "Riverside",
        state: "CA",
        address: "9100 Canyon Crest",
        phone: "(951) 555-0103",
        hours: "Mon-Sun: 11:00 AM - 11:00 PM",
        website: "https://ramenhouse.example.com",
        status: "active",
      },
      {
        restaurantName: "Morning Brew Café",
        category: "Coffee & Café",
        city: "Riverside",
        state: "CA",
        address: "1352 Mission Inn Ave",
        phone: "(951) 555-0104",
        hours: "Mon-Fri: 7:00 AM - 8:00 PM, Sat-Sun: 8:00 AM - 9:00 PM",
        website: "https://morningbrew.example.com",
        status: "active",
      },
      {
        restaurantName: "Sweet Treats Yogurt",
        category: "Dessert & Froyo",
        city: "Riverside",
        state: "CA",
        address: "2468 Magnolia Ave",
        phone: "(951) 555-0105",
        hours: "Mon-Sun: 12:00 PM - 10:00 PM",
        website: "https://sweettreats.example.com",
        status: "active",
      },
      {
        restaurantName: "KBBQ Palace",
        category: "Korean BBQ",
        city: "Riverside",
        state: "CA",
        address: "3579 Chicago Ave",
        phone: "(951) 555-0106",
        hours: "Mon-Sun: 5:00 PM - 11:00 PM",
        website: "https://kbbqpalace.example.com",
        status: "active",
      },
      {
        restaurantName: "Burger Joint",
        category: "American Burgers",
        city: "Riverside",
        state: "CA",
        address: "4680 Arlington Ave",
        phone: "(951) 555-0107",
        hours: "Mon-Sun: 10:00 AM - 9:00 PM",
        website: "https://burgerjoint.example.com",
        status: "active",
      },
      {
        restaurantName: "Donut Dreams",
        category: "Donuts & Pastries",
        city: "Riverside",
        state: "CA",
        address: "5791 Linden St",
        phone: "(951) 555-0108",
        hours: "Mon-Sun: 6:00 AM - 8:00 PM",
        website: "https://donutdreams.example.com",
        status: "active",
      },
      {
        restaurantName: "Shabu Shabu Express",
        category: "Shabu & Hot Pot",
        city: "Riverside",
        state: "CA",
        address: "6802 Indiana Ave",
        phone: "(951) 555-0109",
        hours: "Mon-Sun: 5:00 PM - 12:00 AM",
        website: "https://shabuexpress.example.com",
        status: "active",
      },
      {
        restaurantName: "Golden Dragon Buffet",
        category: "AYCE Buffet",
        city: "Riverside",
        state: "CA",
        address: "7913 Vineyard Ave",
        phone: "(951) 555-0110",
        hours: "Mon-Sun: 11:00 AM - 10:00 PM",
        website: "https://goldendragon.example.com",
        status: "active",
      },
    ];

    const allMenuItems = [
      // Tea Topia (index 0)
      { restaurantIndex: 0, items: [
        { itemName: "Classic Milk Tea", category: "Boba Tea", price: 4.50 },
        { itemName: "Taro Milk Tea", category: "Boba Tea", price: 5.25 },
        { itemName: "Thai Milk Tea", category: "Boba Tea", price: 4.75 },
        { itemName: "Mango Smoothie", category: "Smoothie", price: 5.50 },
        { itemName: "Strawberry Green Tea", category: "Fruit Tea", price: 4.25 },
        { itemName: "Brown Sugar Boba", category: "Boba Tea", price: 5.75 },
        { itemName: "Lychee Jelly Tea", category: "Fruit Tea", price: 4.50 },
        { itemName: "Matcha Latte", category: "Milk Tea", price: 5.00 },
        { itemName: "Wintermelon Tea", category: "Fruit Tea", price: 4.25 },
      ]},
      // Sushi Paradise (index 1)
      { restaurantIndex: 1, items: [
        { itemName: "California Roll", category: "Sushi Roll", price: 8.95 },
        { itemName: "Spicy Tuna Roll", category: "Sushi Roll", price: 9.95 },
        { itemName: "Rainbow Roll", category: "Sushi Roll", price: 12.95 },
        { itemName: "Salmon Nigiri (2pc)", category: "Nigiri", price: 6.50 },
        { itemName: "Tuna Sashimi", category: "Sashimi", price: 8.95 },
        { itemName: "Dragon Roll", category: "Sushi Roll", price: 13.95 },
        { itemName: "Yellowtail Roll", category: "Sushi Roll", price: 9.50 },
        { itemName: "Miso Soup", category: "Soup", price: 3.50 },
        { itemName: "Edamame", category: "Appetizer", price: 4.95 },
      ]},
      // Ramen House (index 2)
      { restaurantIndex: 2, items: [
        { itemName: "Tonkotsu Ramen", category: "Ramen", price: 11.95 },
        { itemName: "Miso Ramen", category: "Ramen", price: 11.95 },
        { itemName: "Spicy Miso Ramen", category: "Ramen", price: 12.95 },
        { itemName: "Shoyu Ramen", category: "Ramen", price: 10.95 },
        { itemName: "Vegetable Ramen", category: "Ramen", price: 10.95 },
        { itemName: "Gyoza (8pc)", category: "Appetizer", price: 5.95 },
        { itemName: "Karaage Chicken", category: "Appetizer", price: 7.95 },
        { itemName: "Chashu Bowl", category: "Rice Bowl", price: 9.95 },
      ]},
      // Morning Brew Café (index 3)
      { restaurantIndex: 3, items: [
        { itemName: "Cappuccino", category: "Coffee", price: 4.50 },
        { itemName: "Latte", category: "Coffee", price: 4.75 },
        { itemName: "Americano", category: "Coffee", price: 3.95 },
        { itemName: "Mocha", category: "Coffee", price: 5.25 },
        { itemName: "Cold Brew", category: "Coffee", price: 4.95 },
        { itemName: "Avocado Toast", category: "Food", price: 8.95 },
        { itemName: "Breakfast Burrito", category: "Food", price: 9.95 },
        { itemName: "Croissant", category: "Pastry", price: 3.95 },
        { itemName: "Chocolate Chip Cookie", category: "Pastry", price: 2.95 },
      ]},
      // Sweet Treats Yogurt (index 4)
      { restaurantIndex: 4, items: [
        { itemName: "Original Tart (Self-Serve)", category: "Frozen Yogurt", price: 0.55 },
        { itemName: "Chocolate Froyo", category: "Frozen Yogurt", price: 0.55 },
        { itemName: "Strawberry Froyo", category: "Frozen Yogurt", price: 0.55 },
        { itemName: "Toppings Bar", category: "Toppings", price: 1.25 },
        { itemName: "Waffle Cone Bowl", category: "Toppings", price: 2.95 },
        { itemName: "Crepe with Fruit", category: "Crepe", price: 7.95 },
        { itemName: "Smoothie", category: "Drink", price: 6.95 },
        { itemName: "Shave Ice", category: "Dessert", price: 5.95 },
      ]},
      // KBBQ Palace (index 5)
      { restaurantIndex: 5, items: [
        { itemName: "AYCE Lunch (2hr)", category: "All You Can Eat", price: 24.95 },
        { itemName: "AYCE Dinner (2hr)", category: "All You Can Eat", price: 29.95 },
        { itemName: "Premium Beef Brisket", category: "Meat", price: 0 },
        { itemName: "Galbi (Marinated Beef)", category: "Meat", price: 0 },
        { itemName: "Pork Belly", category: "Meat", price: 0 },
        { itemName: "Chicken Bulgogi", category: "Meat", price: 0 },
        { itemName: "Steamed Egg", category: "Side Dish", price: 4.95 },
        { itemName: "Kimchi Fried Rice", category: "Side Dish", price: 6.95 },
        { itemName: "Soju Bottle", category: "Alcohol", price: 12.95 },
      ]},
      // Burger Joint (index 6)
      { restaurantIndex: 6, items: [
        { itemName: "Classic Cheeseburger", category: "Burger", price: 9.95 },
        { itemName: "Bacon Burger", category: "Burger", price: 11.95 },
        { itemName: "Veggie Burger", category: "Burger", price: 10.95 },
        { itemName: "Double Stack Burger", category: "Burger", price: 13.95 },
        { itemName: "Crispy Chicken Sandwich", category: "Sandwich", price: 10.95 },
        { itemName: "Loaded Fries", category: "Side", price: 6.95 },
        { itemName: "Onion Rings", category: "Side", price: 5.95 },
        { itemName: "Milkshake", category: "Drink", price: 5.95 },
      ]},
      // Donut Dreams (index 7)
      { restaurantIndex: 7, items: [
        { itemName: "Glazed Donut", category: "Donut", price: 1.95 },
        { itemName: "Chocolate Sprinkle", category: "Donut", price: 2.25 },
        { itemName: "Blueberry Cake", category: "Donut", price: 2.50 },
        { itemName: "Old Fashioned", category: "Donut", price: 2.25 },
        { itemName: "Cronut", category: "Pastry", price: 3.95 },
        { itemName: "Apple Fritter", category: "Donut", price: 2.95 },
        { itemName: "Donut Holes (6pc)", category: "Donut", price: 3.50 },
        { itemName: "Iced Coffee", category: "Drink", price: 3.95 },
      ]},
      // Shabu Shabu Express (index 8)
      { restaurantIndex: 8, items: [
        { itemName: "Lunch Shabu (Beef)", category: "Shabu Shabu", price: 18.95 },
        { itemName: "Dinner Shabu (Beef)", category: "Shabu Shabu", price: 23.95 },
        { itemName: "Premium Wagyu", category: "Shabu Shabu", price: 34.95 },
        { itemName: "Lamb Shabu", category: "Shabu Shabu", price: 21.95 },
        { itemName: "Vegetable Shabu", category: "Shabu Shabu", price: 16.95 },
        { itemName: "Extra Meat Plate", category: "Add-on", price: 12.95 },
        { itemName: "Udon Noodles", category: "Noodles", price: 4.95 },
        { itemName: "Rice Bowl", category: "Side", price: 3.95 },
      ]},
      // Golden Dragon Buffet (index 9)
      { restaurantIndex: 9, items: [
        { itemName: "Lunch Buffet", category: "Buffet", price: 14.95 },
        { itemName: "Dinner Buffet", category: "Buffet", price: 18.95 },
        { itemName: "Weekend Seafood Buffet", category: "Buffet", price: 24.95 },
        { itemName: "Drink Included", category: "Beverage", price: 2.95 },
        { itemName: "Sushi Station", category: "Station", price: 0 },
        { itemName: "Mongolian Grill", category: "Station", price: 0 },
        { itemName: "Dessert Bar", category: "Station", price: 0 },
        { itemName: "Crab Legs (Weekend)", category: "Premium", price: 0 },
      ]},
    ];

    const sampleUserIds = ["user1", "user2", "user3", "user4", "user5"];
    const visitCounts = [
      [12, 8, 5, 3, 2], // Restaurant 0
      [10, 7, 4, 2, 1], // Restaurant 1
      [9, 6, 3, 2, 2],  // Restaurant 2
      [8, 5, 4, 1, 1],  // Restaurant 3
      [7, 4, 3, 1, 0],  // Restaurant 4
      [11, 8, 5, 2, 1], // Restaurant 5
      [6, 4, 2, 1, 0],  // Restaurant 6
      [5, 3, 2, 0, 0],  // Restaurant 7
      [4, 2, 1, 0, 0],  // Restaurant 8
      [8, 5, 3, 1, 0],  // Restaurant 9
    ];

    // Insert restaurants and collect their IDs
    const restaurantIds: any[] = [];
    for (const restaurant of restaurants) {
      const id = await ctx.db.insert("restaurants", restaurant);
      restaurantIds.push(id);
    }

    // Insert menu items for each restaurant
    for (const { restaurantIndex, items } of allMenuItems) {
      const restaurantId = restaurantIds[restaurantIndex];
      const restaurant = restaurants[restaurantIndex];

      for (const item of items) {
        await ctx.db.insert("menuItems", {
          restaurantId,
          restaurantName: restaurant.restaurantName,
          itemName: item.itemName,
          category: item.category,
          price: item.price,
        });
      }
    }

    // Create sample visits
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurantId = restaurantIds[i];
      const visits = visitCounts[i] || [];

      for (let j = 0; j < sampleUserIds.length; j++) {
        const userId = sampleUserIds[j];
        const numVisits = visits[j] || 0;

        for (let k = 0; k < numVisits; k++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const timestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
          await ctx.db.insert("restaurantVisits", {
            userId,
            restaurantId,
            timestamp,
          });
        }
      }
    }

    // Calculate totals
    let totalMenuItems = 0;
    for (const { items } of allMenuItems) {
      totalMenuItems += items.length;
    }

    let totalVisits = 0;
    for (const visits of visitCounts) {
      for (const count of visits) {
        totalVisits += count;
      }
    }

    return {
      message: "Database seeded successfully!",
      summary: {
        restaurantsAdded: restaurants.length,
        totalMenuItems,
        totalVisits,
      },
    };
  },
});
