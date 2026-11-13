/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as blocks from "../blocks.js";
import type * as bookmarks from "../bookmarks.js";
import type * as geocoding from "../geocoding.js";
import type * as images from "../images.js";
import type * as items from "../items.js";
import type * as messaging from "../messaging.js";
import type * as moderation from "../moderation.js";
import type * as monitoring from "../monitoring.js";
import type * as notifications from "../notifications.js";
import type * as profanity from "../profanity.js";
import type * as query from "../query.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as restaurantImport from "../restaurantImport.js";
import type * as restaurants from "../restaurants.js";
import type * as security from "../security.js";
import type * as seed from "../seed.js";
import type * as suggestions from "../suggestions.js";
import type * as tweets from "../tweets.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  authz: typeof authz;
  blocks: typeof blocks;
  bookmarks: typeof bookmarks;
  geocoding: typeof geocoding;
  images: typeof images;
  items: typeof items;
  messaging: typeof messaging;
  moderation: typeof moderation;
  monitoring: typeof monitoring;
  notifications: typeof notifications;
  profanity: typeof profanity;
  query: typeof query;
  rateLimiter: typeof rateLimiter;
  restaurantImport: typeof restaurantImport;
  restaurants: typeof restaurants;
  security: typeof security;
  seed: typeof seed;
  suggestions: typeof suggestions;
  tweets: typeof tweets;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authApple: import("@convex-dev/auth/components/apple/_generated/component.js").ComponentApi<"authApple">;
  authGoogle: import("@convex-dev/auth/components/google/_generated/component.js").ComponentApi<"authGoogle">;
};
