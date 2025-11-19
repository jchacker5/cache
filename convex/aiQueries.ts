import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiQueries")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    query: v.string(),
    response: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiQueries", {
      userId: args.userId,
      query: args.query,
      response: args.response,
      context: args.context,
      createdAt: Date.now(),
    });
  },
});

