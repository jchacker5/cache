import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const defaultCategories = [
  { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B" },
  { name: "Transportation", icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping", icon: "🛍️", color: "#45B7D1" },
  { name: "Bills & Utilities", icon: "💡", color: "#FFA07A" },
  { name: "Entertainment", icon: "🎬", color: "#98D8C8" },
  { name: "Healthcare", icon: "🏥", color: "#F7DC6F" },
  { name: "Education", icon: "📚", color: "#BB8FCE" },
  { name: "Travel", icon: "✈️", color: "#85C1E2" },
  { name: "Personal Care", icon: "💅", color: "#F1948A" },
  { name: "Gifts & Donations", icon: "🎁", color: "#F8C471" },
];

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userCategories = await ctx.db
      .query("categories")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (userCategories.length === 0) {
      // Create default categories for user
      const now = Date.now();
      const created = await Promise.all(
        defaultCategories.map((cat) =>
          ctx.db.insert("categories", {
            userId: args.userId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
            createdAt: now,
            updatedAt: now,
          })
        )
      );

      return await Promise.all(created.map((id) => ctx.db.get(id)));
    }

    return userCategories.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("categories", {
      userId: args.userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
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
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

