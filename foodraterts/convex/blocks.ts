import { MutationCtx, QueryCtx, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Block checks for interaction enforcement. Blocks are bidirectional for
// interactions: neither participant can message, like, comment on, or follow
// the other. Public content remains visible to both sides.

async function findBlock(ctx: QueryCtx, blockerId: string, blockedId: string) {
  return ctx.db
    .query("userBlocks")
    .withIndex("by_blocker_and_blocked", (q) =>
      q.eq("blockerId", blockerId).eq("blockedId", blockedId)
    )
    .first();
}

// True if either user has blocked the other.
export async function hasBlockBetween(ctx: QueryCtx, userA: string, userB: string) {
  if (userA === userB) return false;
  if (await findBlock(ctx, userA, userB)) return true;
  return !!(await findBlock(ctx, userB, userA));
}

// Remove any follow relationship between the two users, in both directions.
// Called when a block is created: followUser enforces blocks going forward,
// but follows that predate the block must be deleted here. Returns how many
// follow docs were removed (0, 1, or 2).
export async function severFollowsBetween(ctx: MutationCtx, userA: string, userB: string) {
  let removed = 0;

  const aFollowsB = await ctx.db
    .query("follows")
    .withIndex("by_follow_pair", (q) =>
      q.eq("followerId", userA).eq("followingId", userB)
    )
    .first();
  if (aFollowsB) {
    await ctx.db.delete(aFollowsB._id);
    removed++;
  }

  const bFollowsA = await ctx.db
    .query("follows")
    .withIndex("by_follow_pair", (q) =>
      q.eq("followerId", userB).eq("followingId", userA)
    )
    .first();
  if (bFollowsA) {
    await ctx.db.delete(bFollowsA._id);
    removed++;
  }

  return removed;
}

// One-time repair for blocks created before blockUser began severing follows:
// removes stale follow relationships for every existing block pair.
export const repairStaleBlockFollows = internalMutation({
  args: {},
  handler: async (ctx) => {
    let blocksChecked = 0;
    let pairsSevered = 0;

    for await (const block of ctx.db.query("userBlocks")) {
      blocksChecked++;
      if ((await severFollowsBetween(ctx, block.blockerId, block.blockedId)) > 0) {
        pairsSevered++;
      }
    }

    return { blocksChecked, pairsSevered };
  },
});
