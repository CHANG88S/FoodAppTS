NAME: fix-convex-typescript-errors
Fixes common Convex and TypeScript compilation errors such as ctx.db.get union types, missing auth helper properties, and array collect vs take syntax. Use when users present TypeScript errors in Convex files.

Instructions
Fix Convex TypeScript Errors
This skill provides a systematic approach to identifying and resolving recurring TypeScript compilation errors in Convex backend files.

Common Error Patterns & Fixes
1. Database Document Union Type Mismatch (ctx.db.get())
Symptom: Property '...' does not exist on type '{ ... } | { ... }' or errors accessing properties like username, name, profilePicture, itemId, restaurantId, etc. after await ctx.db.get(...).
Cause: Convex ctx.db.get() returns a union of all possible document types in your schema, so TypeScript doesn't know which table's fields are present.
Fix: Typecast the fetched document as any:
const user = (await ctx.db.get(userId as any)) as any;
2. Query Builder .take() vs .collect()
Symptom: Property 'collect' does not exist on type '...'
Cause: Calling .collect() on a query result after using .take(N). In Convex, .take(N) immediately executes the query and returns an array, whereas .collect() is called on query builders before .take().
Fix: Remove .collect() when using .take(N):
// Incorrect
const items = await ctx.db.query("table").take(10).collect();

// Correct
const items = await ctx.db.query("table").take(10);
3. Missing Auth Helper Method (ctx.auth.getUserId())
Symptom: Property 'getUserId' does not exist on type 'Auth'
Cause: Using @convex-dev/auth, the correct way to get the logged-in user ID is using getAuthUserId(ctx) from @convex-dev/auth/server, not ctx.auth.getUserId().
Fix: Import and use getAuthUserId:
import { getAuthUserId } from "@convex-dev/auth/server";
const userId = await getAuthUserId(ctx);
4. Implicit any Parameter Types in Arrow Functions
Symptom: Parameter '...' implicitly has an 'any' type.
Cause: TypeScript strict mode enabled without parameter types on map/filter callbacks.
Fix: Explicitly type parameters:
items.map(async (item: any) => { ... })
5. Incorrect Filter Chaining (q.eq().eq())
Symptom: Property 'eq' does not exist on type 'Expression<boolean>'
Cause: Chaining multiple .eq() methods directly on a filter expression.
Fix: Wrap multiple conditions in q.and(...):
.filter((q) =>
    q.and(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("contentType"), args.contentType)
    )
) 
