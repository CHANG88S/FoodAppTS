# Graph Report - .  (2026-08-16)

## Corpus Check
- 205 files · ~475,160 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 630 nodes · 782 edges · 102 communities (42 shown, 60 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 61,475 input · 39,068 output

## Community Hubs (Navigation)
- App Configuration & Theming
- Documentation & Architecture
- User Statistics & Badges
- Build Tools & Dependencies
- Messaging System
- User Data & Restaurant Imports
- Settings & Restaurant Management
- TypeScript Configuration
- Convex Deployment & Monitoring
- Restaurant Functionality
- Authentication & Security
- Image Assets & Branding
- Navigation & Routing
- Data Models & Schema
- Component Architecture
- File Upload & Storage
- Social Features & Reviews
- Geocoding & Location Services
- Testing & Validation
- Backend API Functions
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101

## God Nodes (most connected - your core abstractions)
1. `expo-router` - 26 edges
2. `api` - 26 edges
3. `expo` - 16 edges
4. `Convex Backend` - 14 edges
5. `compilerOptions` - 13 edges
6. `formatCount()` - 11 edges
7. `query` - 11 edges
8. `mutation` - 11 edges
9. `convex` - 10 edges
10. `Convex Database Schema` - 8 edges

## Surprising Connections (you probably didn't know these)
- `FoodRater App Home Page` ----> `convex`  [EXTRACTED]
  assets/App Home Page.png → foodraterts/.claude/skills/convex/SKILL.md
- `FoodRater App Menu Page` ----> `convex`  [EXTRACTED]
  assets/App Menu Page.png → foodraterts/.claude/skills/convex/SKILL.md
- `FoodRater Project` ----> `Restaurant Data Scraper Skill`  [EXTRACTED]
  CLAUDE.md → foodraterts/memory/scrape-food-data-skill.md
- `Convex Add Capability Skill` ----> `Convex Backend`  [EXTRACTED]
  foodraterts/.agents/skills/convex-add/SKILL.md → CLAUDE.md
- `Convex Agent/RAG Backend` ----> `Convex Backend`  [EXTRACTED]
  foodraterts/.agents/skills/convex-agent/SKILL.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **convex-skills-suite** — foodraterts_agents_skills_convex_add_skill_convex_add, foodraterts_agents_skills_convex_advisor_skill_convex_advisor, foodraterts_agents_skills_convex_agent_skill_convex_agent, foodraterts_agents_skills_convex_auth_skill_convex_auth, foodraterts_agents_skills_convex_authz_skill_convex_authz, foodraterts_agents_skills_convex_backup_skill_convex_backup, foodraterts_agents_skills_convex_billing_skill_convex_billing, foodraterts_agents_skills_convex_cost_skill_convex_cost, foodraterts_agents_skills_convex_create_component_skill_convex_create_component, foodraterts_agents_skills_convex_crons_skill_convex_crons, foodraterts_agents_skills_convex_deploy_guard_skill_convex_deploy_guard, foodraterts_agents_skills_convex_design_skill_convex_design, foodraterts_agents_skills_convex_docs_skill_convex_docs, foodraterts_agents_skills_convex_domains_skill_convex_domains [INFERRED]
- **data-model-relationships** — data-model-users, data-model-restaurants, data-model-menuItems, data-model-itemReviews, data-model-tweets, data-model-restaurantVisits [INFERRED]
- **project-architecture-stack** — foodraterts-project, convex-backend, expo-router, authentication-system, profile-component [INFERRED]
- **convex-backend-workflow** — foodraterts_agents_skills_convex_expert_skill_convex_expert, concept:convex-import-rules, concept:data-access-patterns, concept:convex-function-types [INFERRED 1.00]
- **convex-production-lifecycle** — foodraterts_agents_skills_convex_sentinel_skill_convex_sentinel, foodraterts_agents_skills_convex_monitor_skill_convex_monitor, foodraterts_agents_skills_convex_self_heal_skill_convex_self_heal, foodraterts_agents_skills_convex_insights_skill_convex_insights, foodraterts_agents_skills_convex_advisor_skill_convex_advisor, foodraterts_agents_skills_convex_reviewer_skill_convex_reviewer, foodraterts_agents_skills_convex_authz_skill_convex_authz, foodraterts_agents_skills_convex_migrate_rehearse_skill_convex_migrate_rehearse [INFERRED 1.00]
- **convex-audit-ecosystem** — foodraterts_agents_skills_convex_launch_readiness_skill_convex_launch_readiness, foodraterts_agents_skills_convex_authz_skill_convex_authz, foodraterts_agents_skills_convex_reviewer_skill_convex_reviewer, foodraterts_agents_skills_convex_advisor_skill_convex_advisor, foodraterts_agents_skills_convex_insights_skill_convex_insights, concept:findings-bus [INFERRED 1.00]
- **component-authoring-patterns** — pattern:function-handles, pattern:validator-extension, pattern:globals-table, pattern:class-based-client-wrappers [INFERRED 0.95]
- **convex-skill-ecosystem** — foodraterts_claude_skills_convex_skill_convex_main, foodraterts_claude_skills_convex_quickstart_skill_convex_quickstart, foodraterts_claude_skills_convex_reviewer_skill_convex_reviewer, foodraterts_claude_skills_convex_seed_skill_convex_seed, foodraterts_claude_skills_convex_self_heal_skill_convex_self_heal, foodraterts_claude_skills_convex_sentinel_skill_convex_sentinel, foodraterts_claude_skills_convex_suggest_skill_convex_suggest, foodraterts_claude_skills_convex_test_skill_convex_test, foodraterts_claude_skills_convex_verify_skill_convex_verify, foodraterts_agents_skills_convex_create_component_skill_convex_create_component [INFERRED]
- **convex-component-architecture** — concept-local-components, concept-packaged-components, concept-hybrid-components, concept-advanced-component-patterns [INFERRED]
- **convex-verification-pipeline** — foodraterts_claude_skills_convex_reviewer_skill_convex_reviewer, foodraterts_claude_skills_convex_verify_skill_convex_verify, foodraterts_claude_skills_convex_test_skill_convex_test, rationale-verification-negative-assertions [INFERRED]

## Communities (102 total, 60 thin omitted)

### Community 0 - "App Configuration & Theming"
Cohesion: 0.05
Nodes (35): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, projectId, typedRoutes, expo (+27 more)

### Community 1 - "Documentation & Architecture"
Cohesion: 0.10
Nodes (34): Project Documentation, Authentication System, Advanced Component Patterns, Hybrid Convex Components, Local Convex Components, Packaged Convex Components, Convex Backend, Convex Functions Pattern (+26 more)

### Community 2 - "User Statistics & Badges"
Cohesion: 0.09
Nodes (9): styles, styles, styles, styles, styles, styles, Drawer, styles (+1 more)

### Community 3 - "Build Tools & Dependencies"
Cohesion: 0.08
Nodes (24): @babel/core, eslint, eslint-config-expo, devDependencies, @babel/core, eslint, eslint-config-expo, @react-native-community/cli (+16 more)

### Community 4 - "Messaging System"
Cohesion: 0.13
Nodes (18): ChatScreen(), styles, MessagesScreen(), styles, TabType, PostDetailScreen(), styles, Profile() (+10 more)

### Community 5 - "User Data & Restaurant Imports"
Cohesion: 0.08
Nodes (21): internalMutation, bulkInsertRestaurants, restaurantValidator, deleteAccount, followUser, getFollowers, getFollowing, getInternalUserByUsername (+13 more)

### Community 6 - "Settings & Restaurant Management"
Cohesion: 0.11
Nodes (9): styles, styles, CATEGORIES, styles, styles, ImageUploaderProps, styles, api (+1 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Convex Deployment & Monitoring"
Cohesion: 0.14
Nodes (17): @convex-dev/migrations, @convex-dev/sentinel, Deploy Guard, Convex Deployment Types, Findings Bus, convex-explain-app, convex-insights, convex-launch-readiness (+9 more)

### Community 9 - "Restaurant Functionality"
Cohesion: 0.12
Nodes (13): batchGeocodeAllRestaurants, filterRestaurantsByDistance, geocodeRestaurant, getCoordinatesFromZipcode, getRestaurantByName, getRestaurantDetails, getVisitCount, listAllRestaurants (+5 more)

### Community 10 - "Authentication & Security"
Cohesion: 0.16
Nodes (10): styles, TweetDetailScreen(), formatRelativeTime(), Notification, NotificationScreen(), styles, styles, User (+2 more)

### Community 11 - "Image Assets & Branding"
Cohesion: 0.16
Nodes (11): mutation, query, getAppStatistics, updateRestaurantCoordinates, createTweet, generateUploadUrl, getPublicUrl, getPublicUrls (+3 more)

### Community 12 - "Navigation & Routing"
Cohesion: 0.16
Nodes (15): Convex Quickstart Agent, convex-quickstart, convex-reviewer, convex-seed, convex-self-heal, convex-sentinel, convex, convex-suggest (+7 more)

### Community 13 - "Data Models & Schema"
Cohesion: 0.13
Nodes (12): approveMenuItemSuggestion, approvePlaceSuggestion, approvePlaceSuggestionWithChain, checkPotentialChains, getMyMenuItemSuggestions, getMyPlaceSuggestions, listMenuItemSuggestions, listPlaceSuggestions (+4 more)

### Community 14 - "Component Architecture"
Cohesion: 0.14
Nodes (13): addCommentToReview, addMenuItem, createItemReview, deleteCommentFromReview, deleteItemReview, getReviewById, getReviewsWithPhotosForRestaurant, getUserReviews (+5 more)

### Community 15 - "File Upload & Storage"
Cohesion: 0.15
Nodes (13): convex, expo-blur, expo-constants, expo-dev-client, expo-symbols, dependencies, convex, expo-blur (+5 more)

### Community 16 - "Social Features & Reviews"
Cohesion: 0.26
Nodes (12): buildAddress(), __dirname, importToConvex(), inferCategory(), main(), normalizePhone(), normalizeWebsite(), osmElementToRestaurant() (+4 more)

### Community 17 - "Geocoding & Location Services"
Cohesion: 0.15
Nodes (12): compilerOptions, paths, strict, extends, include, @firebase/auth, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 18 - "Testing & Validation"
Cohesion: 0.17
Nodes (9): Criterion, PREDEFINED_CRITERIA, styles, Option, RatingMenu(), RatingMenuProps, styles, react (+1 more)

### Community 19 - "Backend API Functions"
Cohesion: 0.21
Nodes (11): ADMIN_ROLES, getCurrentUserRole, isAdmin, isStaff, requireAdmin(), requireAdminAction(), requireStaff(), STAFF_ROLES (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (10): generateUploadUrl, getMessages, getUnreadCount, listConversations, markMessagesAsRead, searchUsers, sendImageMessage, sendMessage (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (6): Application, Configuration, MainApplication, ReactApplication, ReactHost, ReactNativeHost

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (4): Bundle, MainActivity, ReactActivity, ReactActivityDelegate

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): addCommentToTweet, createTweet, deleteCommentFromTweet, deleteTweet, generateUploadUrl, getTweetsByUserId, getUserTweets, toggleLikeTweet

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (8): AppBreakpoints, appThemes, breakpoints, lightTheme, otherTheme, react-native-unistyles, UnistylesBreakpoints, UnistylesThemes

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): createNotificationForSuggestion(), createNotificationInternal, deleteNotification, getUnreadCount, listNotifications, markAllAsRead, markAsRead

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (7): Convex Function Types, Convex Import Rules, Convex Data Access Patterns, Convex Reserved Names, convex-expert, convex-quickstart, convex

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (4): COLOR_OPTIONS, ICE_OPTIONS, styles, SWEETNESS_OPTIONS

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (5): internal, addCommentToReview, deleteCommentFromReview, submitItemReview, toggleLikeReview

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (4): DataModel, Doc, Id, TableNames

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (4): DatabaseReader, DatabaseWriter, MutationCtx, QueryCtx

### Community 35 - "Community 35"
Cohesion: 0.83
Nodes (4): OpenAI Agent for Convex Create Component, Hybrid Convex Components, Local Convex Components, Packaged Convex Components

### Community 36 - "Community 36"
Cohesion: 0.50
Nodes (4): Android Adaptive Icons, Android Launcher Icon, Launcher Icon Foreground Layer, Round Launcher Icon

### Community 37 - "Community 37"
Cohesion: 0.50
Nodes (4): Android Density Hierarchy, Android Splash Screen Logo, Splash Screen Logo MDPI, Splash Screen Logo XHDPI

### Community 38 - "Community 38"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (3): aiFiles, enabled, $schema

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (3): batchGeocodeRestaurants(), geocodeAddress(), restaurants

## Knowledge Gaps
- **313 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `File Upload & Storage` to `Build Tools & Dependencies`, `Testing & Validation`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`, `Community 82`, `Community 83`, `Community 84`, `Community 85`, `Community 86`, `Community 87`, `Community 88`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Why does `react` connect `Testing & Validation` to `File Upload & Storage`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _313 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Configuration & Theming` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Documentation & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._
- **Should `User Statistics & Badges` be split into smaller, more focused modules?**
  _Cohesion score 0.09116809116809117 - nodes in this community are weakly interconnected._
- **Should `Build Tools & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._