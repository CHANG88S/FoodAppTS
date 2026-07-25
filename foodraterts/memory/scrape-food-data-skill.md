---
name: restaurant-scraping-skill
description: Skill that scrapes food/drink establishment data (addresses, ratings, hours) from online directories.
metadata:
  type: project
---

# Restaurant Data Scraper Skill

A specialized skill for scraping publicly available information about restaurants, boba shops, cafes and other food/drink establishments to populate the FoodAppTS directory listing feature. The goal is to gather structured data that can be stored in Convex tables or directly mapped to existing restaurant entities.

**Why:** Populating a new app with real establishment data requires manual research time - this automates discovery across popular business directories (Yelp, Google Business Profile snippets, TripAdvisor public listings, Instagram for visual verification). The scraper handles missing fields gracefully and consolidates information into a consistent format suitable for import or API integration.

**How to apply:** 
- Use when user requests location data collection for multiple businesses
- Handles scraping from common sources while respecting robots.txt and rate limits
- Consolidates fragmented info across platforms (same business found on Yelp, Google Maps website)
- Returns structured JSON with all fields mapped consistently even if source varies

[[schema-example]] [[convex-schema-for-restaurants]]
