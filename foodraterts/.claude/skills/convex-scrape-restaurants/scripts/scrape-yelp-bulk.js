// scrape-yelp-bulk.js — parse Yelp directory exports to JSONL ready for Convex insert
const fs = require("fs");
const path = require("path");

/**
 * Normalizes a raw hours string or basic object into a clean string representation.
 * @param {string} hoursStr 
 */
function normalizeHours(hoursStr) {
  if (!hoursStr) return "";
  
  // Clean up common messy formatting artifacts from scrapers
  return hoursStr
    .replace(/a\.?m/gi, "am")
    .replace(/p\.?m/gi, "pm")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts category tags from a hierarchy string.
 * Example: "Diner > American > Burgers" → ["diner", "american", "burgers"]
 * @param {string} hierarchy 
 */
function extractCategoryTags(hierarchy) {
  if (!hierarchy) return [];
  return hierarchy
    .split(">")
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);
}

/**
 * Parse a CSV line into a structured restaurant object matching your Convex schema
 * @param {string} line 
 * @param {string[]} headers 
 */
function parseYelpRow(line, headers) {
  if (!line.trim()) return null;

  // Simple CSV split (Note: Doesn't handle escaped commas in quotes perfectly, 
  // but matches the lightweight logic of your original script)
  const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
  
  // Create a key-value mapping of the row data
  const rowData = {};
  headers.forEach((header, index) => {
    rowData[header] = cols[index] || "";
  });

  // Fallback if the line is malformed or missing the crucial 'name' column
  if (!rowData.name) return null;

  // Build the clean object structured for Convex injection
  return {
    name: rowData.name,
    city: rowData.city || "",
    categories: extractCategoryTags(rowData.category || rowData.hierarchy || ""),
    hours: normalizeHours(rowData.hours || ""),
    website: rowData.website || undefined,
    logoUrl: rowData.logourl || ""
  };
}

function main() {
  const args = process.argv.slice(2);
  
  // Helper to find named arguments easily
  const getArgValue = (flag) => {
    const index = args.findIndex(arg => arg.startsWith(flag));
    if (index === -1) return null;
    if (args[index].includes("=")) {
      return args[index].split("=")[1];
    }
    return args[index + 1];
  };

  const inputPath = getArgValue("--input");
  let outputPath = getArgValue("--output") || "restaurants.jsonl";

  if (!inputPath) {
    console.log("Usage: node scrape-yelp-bulk.js --input=FILE [--output=JSONL]");
    return;
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found at execution path: ${inputPath}`);
    process.exit(1);
  }

  if (!outputPath.endsWith(".jsonl")) {
    outputPath += ".jsonl";
  }

  console.log(`Reading: ${inputPath}...`);
  const csvText = fs.readFileSync(inputPath, "utf8").replace(/\r/g, "");
  const lines = csvText.split("\n").filter(line => line.trim() !== "");
  
  if (lines.length === 0) {
    console.error("Error: The provided input file is empty.");
    process.exit(1);
  }

  // Extract and clean header row definitions
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  console.log("Target columns mapped:", headers.join(", "));

  const parsedRows = [];

  // Loop through rows skipping the header line
  for (let i = 1; i < lines.length; i++) {
    const parsedObj = parseYelpRow(lines[i], headers);
    if (parsedObj) {
      // Convex bulk imports require JSON Lines format (one standalone valid JSON object per line)
      parsedRows.push(JSON.stringify(parsedObj));
    }
  }

  fs.writeFileSync(outputPath, parsedRows.join("\n"));
  console.log(`Success! Extracted ${parsedRows.length} listings → Saved to ${outputPath}`);
}

// Run if called directly via CLI
if (require.main === module) {
  main();
}

module.exports = { parseYelpRow, normalizeHours, extractCategoryTags };