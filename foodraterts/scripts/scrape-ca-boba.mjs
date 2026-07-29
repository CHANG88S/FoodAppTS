/**
 * Scrapes boba / bubble tea shops across California from OpenStreetMap
 * and bulk-imports them into the Convex restaurants table.
 *
 * Usage:
 *   node scripts/scrape-ca-boba.mjs           # scrape only, writes data/ca-boba-shops.json
 *   node scripts/scrape-ca-boba.mjs --import  # scrape + import into Convex
 */

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_PATH = join(ROOT, "data", "ca-boba-shops.json");
const BATCH_SIZE = 40;

const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-2"="US-CA"]["admin_level"="4"]->.ca;
(
  node["amenity"="cafe"]["cuisine"="bubble_tea"](area.ca);
  node["shop"="tea"](area.ca);
  node["name"~"boba|bubble tea|bubbletea|milk tea|sharetea|gong cha|kung fu tea|tastea|tiger sugar|happy lemon|coco fresh|7 leaves|ding tea|yifang|sunright|feng cha|boba guys|quickly|lollicup|chatime|presotea|heytea|boba time|bobatime|pearl tea|black sugar|tan cha|ume tea|wow wow",i](area.ca);
  way["amenity"="cafe"]["cuisine"="bubble_tea"](area.ca);
  way["shop"="tea"](area.ca);
  way["name"~"boba|bubble tea|bubbletea|milk tea|sharetea|gong cha|kung fu tea|tastea|tiger sugar|happy lemon|coco fresh|7 leaves|ding tea|yifang|sunright|feng cha|boba guys|quickly|lollicup|chatime|presotea|heytea|boba time|bobatime|pearl tea|black sugar|tan cha|ume tea|wow wow",i](area.ca);
);
out center tags;
`;

function buildAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:unit"],
  ].filter(Boolean);

  if (parts.length > 0) {
    let line = parts.join(" ");
    if (tags["addr:city"]) line += `, ${tags["addr:city"]}`;
    if (tags["addr:state"]) line += `, ${tags["addr:state"]}`;
    if (tags["addr:postcode"]) line += ` ${tags["addr:postcode"]}`;
    return line.trim();
  }

  return tags["addr:full"]?.trim() || "";
}

function inferCategory(tags) {
  if (tags.cuisine?.includes("bubble_tea")) return "Bubble Tea";
  if (tags.shop === "tea") return "Tea Shop";
  if (tags.amenity === "cafe") return "Bubble Tea";
  return "Bubble Tea";
}

function normalizePhone(phone) {
  if (!phone) return undefined;
  return phone.split(";")[0].trim();
}

function normalizeWebsite(website) {
  if (!website) return undefined;
  const url = website.split(";")[0].trim();
  if (url.startsWith("http")) return url;
  return `https://${url}`;
}

function osmElementToRestaurant(element) {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  const city =
    tags["addr:city"]?.trim() ||
    tags["addr:suburb"]?.trim() ||
    tags["addr:town"]?.trim() ||
    tags["addr:place"]?.trim() ||
    "";

  const state = tags["addr:state"]?.trim() || "CA";
  let address = buildAddress(tags);

  if (!address && lat && lon) {
    address = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  if (!city && !address) return null;

  const mapsLocation =
    lat && lon
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      : `https://www.openstreetmap.org/${element.type}/${element.id}`;

  return {
    placeId: `osm:${element.type}/${element.id}`,
    restaurantName: name,
    category: inferCategory(tags),
    city: city || "Unknown",
    state,
    address: address || "Address unavailable",
    phone: normalizePhone(tags.phone || tags["contact:phone"]),
    hours: tags.opening_hours?.trim() || undefined,
    status: tags.disused || tags.abandoned ? "closed" : "open",
    website: normalizeWebsite(tags.website || tags["contact:website"]),
    mapsLocation,
  };
}

async function scrapeCaliforniaBobaShops() {
  console.log("Querying OpenStreetMap for California boba shops...");

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "FoodRater/1.0 (restaurant directory import)",
        },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${endpoint} returned ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = await response.json();
      return transformElements(data.elements ?? []);
    } catch (error) {
      lastError = error;
      console.warn(`Overpass request failed for ${endpoint}: ${error.message}`);
    }
  }

  throw lastError ?? new Error("All Overpass endpoints failed");
}

function transformElements(elements) {
  const seen = new Set();
  const restaurants = [];

  for (const element of elements) {
    const restaurant = osmElementToRestaurant(element);
    if (!restaurant) continue;

    const dedupeKey = restaurant.placeId;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    restaurants.push(restaurant);
  }

  restaurants.sort((a, b) =>
    `${a.city}${a.restaurantName}`.localeCompare(`${b.city}${b.restaurantName}`),
  );

  console.log(`Found ${restaurants.length} boba shops in California.`);
  return restaurants;
}

function importToConvex(restaurants) {
  console.log(`Importing ${restaurants.length} restaurants in batches of ${BATCH_SIZE}...`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < restaurants.length; i += BATCH_SIZE) {
    const batch = restaurants.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(restaurants.length / BATCH_SIZE);

    const argsJson = JSON.stringify({ restaurants: batch });
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} shops)...`);

    try {
      const result = execSync(
        `npx convex run restaurantImport:bulkInsertRestaurants ${JSON.stringify(argsJson)}`,
        { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
      );
      const parsed = JSON.parse(result.trim());
      totalInserted += parsed.inserted ?? 0;
      totalSkipped += parsed.skipped ?? 0;
    } catch (error) {
      console.error(`  Batch ${batchNum} failed:`, error.stderr || error.message);
      throw error;
    }
  }

  console.log(`Import complete: ${totalInserted} inserted, ${totalSkipped} skipped (duplicates).`);
  return { totalInserted, totalSkipped };
}

async function main() {
  const shouldImport = process.argv.includes("--import");

  mkdirSync(join(ROOT, "data"), { recursive: true });

  let restaurants;
  if (!shouldImport && existsSync(OUTPUT_PATH)) {
    console.log(`Loading cached data from ${OUTPUT_PATH}`);
    restaurants = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
  } else {
    restaurants = await scrapeCaliforniaBobaShops();
    writeFileSync(OUTPUT_PATH, JSON.stringify(restaurants, null, 2), "utf8");
    console.log(`Saved to ${OUTPUT_PATH}`);
  }

  if (shouldImport) {
    importToConvex(restaurants);
  } else {
    console.log("Run with --import to load these into Convex.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
