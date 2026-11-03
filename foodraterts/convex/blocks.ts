import { QueryCtx } from "./_generated/server";

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
