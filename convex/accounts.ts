import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    type: v.optional(v.union(v.literal("checking"), v.literal("savings"), v.literal("credit"), v.literal("investment"))),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    const accounts = await query.collect();

    let filtered = accounts;
    if (args.type) {
      filtered = filtered.filter((a) => a.type === args.type);
    }
    if (args.activeOnly !== false) {
      filtered = filtered.filter((a) => a.isActive);
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("checking"), v.literal("savings"), v.literal("credit"), v.literal("investment")),
    balance: v.number(),
    currency: v.string(),
    institution: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    lastFour: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("accounts", {
      userId: args.userId,
      name: args.name,
      type: args.type,
      balance: args.balance,
      currency: args.currency,
      institution: args.institution,
      accountNumber: args.accountNumber,
      lastFour: args.lastFour,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("checking"), v.literal("savings"), v.literal("credit"), v.literal("investment"))),
    balance: v.optional(v.number()),
    currency: v.optional(v.string()),
    institution: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    lastFour: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

