import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    type: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.type) {
      insights = insights.filter((i) => i.type === args.type);
    }
    if (args.isRead !== undefined) {
      insights = insights.filter((i) => i.isRead === args.isRead);
    }

    // Filter out expired insights
    const now = Date.now();
    insights = insights.filter((i) => !i.expiresAt || i.expiresAt > now);

    return insights.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("aiInsights") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    data: v.optional(v.any()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      description: args.description,
      data: args.data,
      priority: args.priority,
      isRead: false,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: { id: v.id("aiInsights") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isRead: true,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("aiInsights") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

