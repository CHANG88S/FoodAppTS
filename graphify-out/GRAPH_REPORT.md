# Graph Report - .  (2026-08-13)

## Corpus Check
- 205 files · ~473,751 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 772 nodes · 840 edges · 160 communities (60 shown, 100 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Convex Auth
- App Screen
- Convex Backend
- App Screen
- Linting
- Messages Screen
- Settings Screen
- Convex Backend
- Convex Auth
- App Screen
- Convex Skills
- Convex Backend
- Expo Config
- Build Tools
- TypeScript Config
- Convex Skills
- Restaurant Screen
- Convex Skills
- Messaging API
- Convex Skills
- App Screen
- App Screen
- Convex Backend
- Convex Backend
- Social API
- Styling
- Convex Auth
- Convex Skills
- Notification API
- Convex Backend
- Convex Backend
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Backend
- Home Screen
- App Screen
- App Screen
- Review API
- Convex Backend
- Convex Skills
- Restaurant Screen
- UI Component
- Convex Skills
- Convex Skills
- Convex Skills
- Android Config
- Convex Backend
- Community 48
- Convex Backend
- Convex Backend
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Linting
- Community 59
- Convex Backend
- Convex Backend
- Convex Backend
- Convex Auth
- Package Dependencies
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Expo Config
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Package Dependencies
- Authentication
- Navigation
- TypeScript Config
- Convex Backend
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Convex Skills
- Profile Screen
- Community 155
- Convex Backend
- Convex Backend
- Community 159

## God Nodes (most connected - your core abstractions)
1. `expo-router` - 26 edges
2. `api` - 26 edges
3. `expo` - 16 edges
4. `convex` - 14 edges
5. `compilerOptions` - 13 edges
6. `formatCount()` - 11 edges
7. `query` - 11 edges
8. `mutation` - 11 edges
9. `convex-self-heal` - 11 edges
10. `convex-advisor` - 10 edges

## Surprising Connections (you probably didn't know these)
- `FoodRater Project README` --cites--> `FoodRater App`  [INFERRED]
  README.md → CLAUDE.md
- `App Home Page Screenshot` --shares_branding_with--> `App Icon`  [INFERRED]
  assets/App Home Page.png → foodraterts/assets/images/icon.png
- `App Menu Page Screenshot` --shares_branding_with--> `App Icon`  [INFERRED]
  assets/App Menu Page.png → foodraterts/assets/images/icon.png
- `TweetDetailScreen()` --calls--> `formatCount()`  [EXTRACTED]
  foodraterts/app/social/[tweetId].tsx → foodraterts/utils/formatters.ts
- `Convex Deployment Advisor` --semantically_similar_to--> `Convex Authorization Auditor`  [INFERRED] [semantically similar]
  foodraterts/.agents/skills/convex-advisor/SKILL.md → foodraterts/.agents/skills/convex-authz/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Convex Authentication and Authorization** — foodraterts_agents_skills_convex_auth_skill, foodraterts_agents_skills_convex_authz_skill, convex_auth_foundation, convex_auth_requireowner [EXTRACTED 0.95]
- **Convex Component Architecture Patterns** — foodraterts_agents_skills_convex_create_component_skill, convex_component_local, convex_component_packaged, convex_component_hybrid, convex_component_advanced, convex_component_boundary [EXTRACTED 0.95]
- **Convex Deployment Safety and Monitoring** — foodraterts_agents_skills_convex_deploy_guard_skill, foodraterts_agents_skills_convex_advisor_skill, foodraterts_agents_skills_convex_cost_skill, foodraterts_agents_skills_convex_backup_skill, convex_deployment_types, convex_insights_tool [EXTRACTED 0.90]
- **Insights Query System** — foodraterts__agents__skills__convex-insights_convex-insights, foodraterts__agents__skills__convex-insights_convex-advisor, foodraterts__agents__skills__convex-insights_deploy-guard, foodraterts__agents__skills__convex-insights_official-convex-mcp, foodraterts__agents__skills__convex-insights_monitor, foodraterts__agents__skills__convex-insights_sentinel, foodraterts__agents__skills__convex-insights_findings-bus [EXTRACTED 0.95]
- **Audit Pipeline** — foodraterts__agents__skills__convex-launch-readiness_convex-launch-readiness, foodraterts__agents__skills__convex-launch-readiness_convex-authz, foodraterts__agents__skills__convex-launch-readiness_convex-reviewer, foodraterts__agents__skills__convex-launch-readiness_convex-advisor, foodraterts__agents__skills__convex-launch-readiness_convex-insights, foodraterts__agents__skills__convex-launch-readiness_findings-bus, foodraterts__agents__skills__convex-launch-readiness_deploy-guard [EXTRACTED 1.00]
- **Migration Workflow** — foodraterts__agents__skills__convex-migrate-rehearse_convex-migrate-rehearse, foodraterts__agents__skills__convex-migrate-rehearse_deploy-guard, foodraterts__agents__skills__convex-migrate-rehearse_migrate, foodraterts__agents__skills__convex-migrate-rehearse_convex-dev-migrations [EXTRACTED 1.00]
- **Optimization Workflow** — foodraterts__agents__skills__convex-optimize_convex-optimize, foodraterts__agents__skills__convex-optimize_launch-readiness, foodraterts__agents__skills__convex-optimize_check-updates, foodraterts__agents__skills__convex-optimize_sentinel [EXTRACTED 0.95]
- **Self-Heal Workflow** — foodraterts__agents__skills__convex-self-heal_convex-self-heal, foodraterts__agents__skills__convex-self-heal_sentinel, foodraterts__agents__skills__convex-self-heal_findings-bus, foodraterts__agents__skills__convex-self-heal_monitor, foodraterts__agents__skills__convex-self-heal_convex-insights, foodraterts__agents__skills__convex-self-heal_convex-advisor, foodraterts__agents__skills__convex-self-heal_convex-reviewer, foodraterts__agents__skills__convex-self-heal_convex-authz, foodraterts__agents__skills__convex-self-heal_convex-expert, foodraterts__agents__skills__convex-self-heal_migrate-rehearse, foodraterts__agents__skills__convex-self-heal_convex-test, foodraterts__agents__skills__convex-self-heal_deploy-guard [EXTRACTED 1.00]
- **Verification Pipeline** — foodraterts__agents__skills__convex-verify_convex-verify, foodraterts__agents__skills__convex-verify_convex-test, foodraterts__agents__skills__convex-verify_vitest, foodraterts__agents__skills__convex-verify_edge-runtime-v, foodraterts__agents__skills__convex-verify_convex-authz, foodraterts__agents__skills__convex-verify_test, foodraterts__agents__skills__convex-verify_findings-bus, foodraterts__agents__skills__convex-verify_convex-expert [EXTRACTED 0.95]
- **Convex Backend Ecosystem** — foodraterts__agents__skills__convex_convex, foodraterts__agents__skills__convex_convex-add, foodraterts__agents__skills__convex_capability-catalog, foodraterts__agents__skills__convex_convex-quickstart, foodraterts__agents__skills__convex_convex-expert, foodraterts__agents__skills__convex_convex-reviewer, foodraterts__agents__skills__convex_convex-verify, foodraterts__agents__skills__convex_convex-monitor, foodraterts__agents__skills__convex_convex-sentinel, foodraterts__agents__skills__convex_convex-self-heal, foodraterts__agents__skills__convex_convex-migrate, foodraterts__agents__skills__convex_convex-migrate-rehearse, foodraterts__agents__skills__convex_convex-cost, foodraterts__agents__skills__convex_convex-explain-app, foodraterts__agents__skills__convex_convex-test [EXTRACTED 1.00]
- **Convex auth workflow** — foodraterts__claude_skills_convex-auth_skill_authentication_workflow, foodraterts__claude_skills_convex-auth_skill_jose_key_generation, foodraterts__claude_skills_convex-authz_skill_requireidentity_requireowner_pattern [EXTRACTED 0.90]
- **Convex component types** — foodraterts__claude_skills_convex-create-component_skill_local_component, foodraterts__claude_skills_convex-create-component_skill_packaged_component, foodraterts__claude_skills_convex-create-component_skill_hybrid_component, foodraterts__claude_skills_convex-create-component_skill_component_architecture [EXTRACTED 0.95]
- **Convex advanced patterns** — foodraterts__claude_skills_convex-create-component_references_advanced-patterns_md_function_handle_callback, foodraterts__claude_skills_convex-create-component_references_advanced-patterns_md_validator_extension, foodraterts__claude_skills_convex-create-component_references_advanced-patterns_md_globals_table_pattern, foodraterts__claude_skills_convex-create-component_references_advanced-patterns_md_class-based_client_wrapper, foodraterts__claude_skills_convex-create-component_references_advanced-patterns_md_advanced_component_patterns [EXTRACTED 0.85]
- **Convex deployment safety** — foodraterts__claude_skills_convex-deploy-guard_skill_production_consent_gate, foodraterts__claude_skills_convex-backup_skill_restore_drill [INFERRED 0.80]
- **Convex Audit Capabilities** — convex_capability_launch_readiness, convex_capability_authorization, convex_capability_optimization [EXTRACTED 0.85]
- **Convex Quality Assurance** — foodraterts_claude_skills_convex_test_skill_md, foodraterts_claude_skills_convex_verify_skill_md, foodraterts_claude_skills_convex_reviewer_skill_md [EXTRACTED 0.85]
- **Convex Lifecycle Management** — convex_capability_migration, convex_capability_self_healing, convex_capability_optimization [EXTRACTED 0.90]
- **FoodRater App Screenshots** — assets_app_home_page_png, assets_app_menu_page_png [EXTRACTED 1.00]
- **Convex Skill Icons** — foodraterts__agents_skills_convex-create-component_assets_icon_svg, foodraterts__agents_skills_convex-quickstart_assets_icon_svg, foodraterts__claude_skills_convex-create-component_assets_icon_svg, foodraterts__claude_skills_convex-quickstart_assets_icon_svg [EXTRACTED 1.00]
- **FoodRater Branding Assets** — foodraterts_assets_images_adaptive-icon_png, foodraterts_assets_images_favicon_png, foodraterts_assets_images_icon_png, foodraterts_assets_images_splash-icon_png [EXTRACTED 1.00]

## Communities (160 total, 100 thin omitted)

### Community 0 - "Convex Auth"
Cohesion: 0.05
Nodes (38): ADMIN_ROLES, getCurrentUserRole, isAdmin, isStaff, requireAdmin(), requireAdminAction(), requireStaff(), STAFF_ROLES (+30 more)

### Community 1 - "App Screen"
Cohesion: 0.05
Nodes (35): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, projectId, typedRoutes, expo (+27 more)

### Community 2 - "Convex Backend"
Cohesion: 0.07
Nodes (30): Convex Authentication Guidelines, Authorization Audit, Launch Readiness Audit, Schema Migration, Backend Optimization, Production Self-Healing, Findings Bus System, Convex Reactive Backend Platform (+22 more)

### Community 3 - "App Screen"
Cohesion: 0.09
Nodes (9): styles, styles, styles, styles, styles, styles, Drawer, styles (+1 more)

### Community 4 - "Linting"
Cohesion: 0.08
Nodes (24): @babel/core, eslint, eslint-config-expo, devDependencies, @babel/core, eslint, eslint-config-expo, @react-native-community/cli (+16 more)

### Community 5 - "Messages Screen"
Cohesion: 0.13
Nodes (18): ChatScreen(), styles, MessagesScreen(), styles, TabType, PostDetailScreen(), styles, Profile() (+10 more)

### Community 6 - "Settings Screen"
Cohesion: 0.11
Nodes (9): styles, styles, CATEGORIES, styles, styles, ImageUploaderProps, styles, api (+1 more)

### Community 7 - "Convex Backend"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Convex Auth"
Cohesion: 0.10
Nodes (18): deleteAccount, followUser, getFollowers, getFollowing, getInternalUserByUsername, getInternalViewer, getUser, getUserByUsername (+10 more)

### Community 9 - "App Screen"
Cohesion: 0.16
Nodes (10): styles, TweetDetailScreen(), formatRelativeTime(), Notification, NotificationScreen(), styles, styles, User (+2 more)

### Community 10 - "Convex Skills"
Cohesion: 0.13
Nodes (15): capability catalog, convex, convex-add, convex-cost, convex-expert, convex-explain-app, convex-migrate, convex-migrate-rehearse (+7 more)

### Community 11 - "Convex Backend"
Cohesion: 0.13
Nodes (12): approveMenuItemSuggestion, approvePlaceSuggestion, approvePlaceSuggestionWithChain, checkPotentialChains, getMyMenuItemSuggestions, getMyPlaceSuggestions, listMenuItemSuggestions, listPlaceSuggestions (+4 more)

### Community 12 - "Expo Config"
Cohesion: 0.15
Nodes (13): add, convex, expo-blur, expo-dev-client, expo-symbols, dependencies, add, convex (+5 more)

### Community 13 - "Build Tools"
Cohesion: 0.26
Nodes (12): buildAddress(), __dirname, importToConvex(), inferCategory(), main(), normalizePhone(), normalizeWebsite(), osmElementToRestaurant() (+4 more)

### Community 14 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, paths, strict, extends, include, @firebase/auth, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 15 - "Convex Skills"
Cohesion: 0.17
Nodes (12): convex-advisor, convex-authz, convex-expert, convex-insights, convex-reviewer, convex-self-heal, convex-test, deploy-guard (+4 more)

### Community 16 - "Restaurant Screen"
Cohesion: 0.17
Nodes (9): Criterion, PREDEFINED_CRITERIA, styles, Option, RatingMenu(), RatingMenuProps, styles, react (+1 more)

### Community 17 - "Convex Skills"
Cohesion: 0.18
Nodes (11): convex-expert, convex-reviewer, convex-sentinel, deploy-guard, findings bus, functionSpec, insights, official Convex MCP (+3 more)

### Community 18 - "Messaging API"
Cohesion: 0.18
Nodes (10): generateUploadUrl, getMessages, getUnreadCount, listConversations, markMessagesAsRead, searchUsers, sendImageMessage, sendMessage (+2 more)

### Community 19 - "Convex Skills"
Cohesion: 0.20
Nodes (10): OpenAI agent config, Hybrid component approach, Local component approach, Build validation order, Packaged component approach, Component architecture, convex-create-component skill, Hybrid component (+2 more)

### Community 20 - "App Screen"
Cohesion: 0.22
Nodes (6): Application, Configuration, MainApplication, ReactApplication, ReactHost, ReactNativeHost

### Community 21 - "App Screen"
Cohesion: 0.22
Nodes (4): Bundle, MainActivity, ReactActivity, ReactActivityDelegate

### Community 22 - "Convex Backend"
Cohesion: 0.25
Nodes (5): { auth, signIn, signOut, store, isAuthenticated }, internalMutation, http, bulkInsertRestaurants, restaurantValidator

### Community 23 - "Convex Backend"
Cohesion: 0.22
Nodes (7): mutation, createTweet, generateUploadUrl, getPublicUrl, getPublicUrls, saveRestaurantPhoto, seed

### Community 24 - "Social API"
Cohesion: 0.22
Nodes (8): addCommentToTweet, createTweet, deleteCommentFromTweet, deleteTweet, generateUploadUrl, getTweetsByUserId, getUserTweets, toggleLikeTweet

### Community 25 - "Styling"
Cohesion: 0.25
Nodes (8): AppBreakpoints, appThemes, breakpoints, lightTheme, otherTheme, react-native-unistyles, UnistylesBreakpoints, UnistylesThemes

### Community 26 - "Convex Auth"
Cohesion: 0.29
Nodes (8): Auth Foundation Check, requireOwner Pattern, Convex Insights Tool, Optimistic Concurrency Control, Convex Deployment Advisor, Convex Authentication Setup, Convex Authorization Auditor, Convex Cost Analysis

### Community 27 - "Convex Skills"
Cohesion: 0.25
Nodes (8): convex-authz, convex-expert, convex-test, convex-verify, @edge-runtime/vm, findings bus, test, vitest

### Community 28 - "Notification API"
Cohesion: 0.25
Nodes (7): createNotificationForSuggestion(), createNotificationInternal, deleteNotification, getUnreadCount, listNotifications, markAllAsRead, markAsRead

### Community 29 - "Convex Backend"
Cohesion: 0.29
Nodes (7): Convex Backend Platform, Convex Data Model, Expo Framework, FoodRater App, React Native, FoodRater Project README, Individual Item Rating Concept

### Community 30 - "Convex Backend"
Cohesion: 0.43
Nodes (7): Advanced Component Patterns, Component Boundary Pattern, Hybrid Component Pattern, Local Component Pattern, Packaged Component Pattern, Function Handles Pattern, Convex Component Creation

### Community 31 - "Convex Skills"
Cohesion: 0.29
Nodes (7): convex-authz, convex-explain-app, convex-launch-readiness, convex-expert, deploy-guard, functionSpec, official MCP

### Community 32 - "Convex Skills"
Cohesion: 0.29
Nodes (7): convex-advisor, convex-insights, deploy-guard, findings bus, monitor, official Convex MCP, sentinel

### Community 33 - "Convex Skills"
Cohesion: 0.29
Nodes (7): convex-advisor, convex-authz, convex-insights, convex-launch-readiness, convex-reviewer, deploy-guard, findings bus

### Community 34 - "Convex Backend"
Cohesion: 0.33
Nodes (4): query, getAppStatistics, updateRestaurantCoordinates, get

### Community 35 - "Home Screen"
Cohesion: 0.40
Nodes (6): App Home Page Screenshot, App Menu Page Screenshot, Adaptive App Icon, App Favicon, App Icon, Splash Screen Icon

### Community 36 - "App Screen"
Cohesion: 0.33
Nodes (4): COLOR_OPTIONS, ICE_OPTIONS, styles, SWEETNESS_OPTIONS

### Community 38 - "Review API"
Cohesion: 0.33
Nodes (5): internal, addCommentToReview, deleteCommentFromReview, submitItemReview, toggleLikeReview

### Community 39 - "Convex Backend"
Cohesion: 0.33
Nodes (4): DataModel, Doc, Id, TableNames

### Community 40 - "Convex Skills"
Cohesion: 0.40
Nodes (5): Advanced component patterns, Class-based client wrapper, Function handle callback, Globals table pattern, Validator extension

### Community 43 - "Convex Skills"
Cohesion: 0.50
Nodes (4): convex-expert, add-hosting, capability catalog, convex-add

### Community 44 - "Convex Skills"
Cohesion: 0.50
Nodes (4): @convex-dev/migrations, convex-migrate-rehearse, deploy-guard, migrate

### Community 45 - "Convex Skills"
Cohesion: 0.50
Nodes (4): check-updates, convex-optimize, launch-readiness, sentinel

### Community 46 - "Android Config"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 47 - "Convex Backend"
Cohesion: 0.50
Nodes (3): aiFiles, enabled, $schema

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (3): batchGeocodeRestaurants(), geocodeAddress(), restaurants

### Community 49 - "Convex Backend"
Cohesion: 0.67
Nodes (3): Restore Drill Procedure, Migrate Rehearse Primitives, Convex Backup and Restore

### Community 50 - "Convex Backend"
Cohesion: 0.67
Nodes (3): Convex Environment Variables, Convex Stripe Billing Integration, Stripe Payment Integration

### Community 51 - "Convex Skills"
Cohesion: 0.67
Nodes (3): @convex-dev/agent, env micro power, convex-agent

### Community 52 - "Convex Skills"
Cohesion: 0.67
Nodes (3): convex-expert, convex-quickstart, quickstart-recipe

### Community 53 - "Convex Skills"
Cohesion: 0.67
Nodes (3): ai-runner, @convex-dev/sentinel, convex-sentinel

### Community 54 - "Convex Skills"
Cohesion: 0.67
Nodes (3): Authorization audit, Four authz shapes, requireIdentity/requireOwner pattern

### Community 55 - "Convex Skills"
Cohesion: 0.67
Nodes (3): confirm-cost gate, convex-cost skill, Cost attribution

### Community 56 - "Convex Skills"
Cohesion: 0.67
Nodes (3): convex-insights skill, Dashboard deep link, Log query workflow

### Community 57 - "Convex Skills"
Cohesion: 0.67
Nodes (3): Convex Seed Skill, Restaurant Data Scraper Skill, Restaurant Scraping Capability

## Knowledge Gaps
- **443 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+438 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **100 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Expo Config` to `Linting`, `Restaurant Screen`, `Convex Backend`, `Convex Auth`, `Package Dependencies`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Expo Config`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`, `Package Dependencies`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `react` connect `Restaurant Screen` to `Expo Config`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _443 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Convex Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.048484848484848485 - nodes in this community are weakly interconnected._
- **Should `App Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Convex Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.0735632183908046 - nodes in this community are weakly interconnected._
- **Should `App Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.09116809116809117 - nodes in this community are weakly interconnected._