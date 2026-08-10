/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as geocoding from "../geocoding.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as items from "../items.js";
import type * as notifications from "../notifications.js";
import type * as query from "../query.js";
import type * as restaurantImport from "../restaurantImport.js";
import type * as restaurants from "../restaurants.js";
import type * as review from "../review.js";
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
  auth: typeof auth;
  authz: typeof authz;
  geocoding: typeof geocoding;
  http: typeof http;
  images: typeof images;
  items: typeof items;
  notifications: typeof notifications;
  query: typeof query;
  restaurantImport: typeof restaurantImport;
  restaurants: typeof restaurants;
  review: typeof review;
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

export declare const components: {};
