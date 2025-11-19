import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.period) {
      budgets = budgets.filter((b) => b.period === args.period);
    }
    if (args.activeOnly) {
      budgets = budgets.filter((b) => b.isActive);
    }

    budgets.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // Calculate spending for each budget
    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const category = budget.categoryId ? await ctx.db.get(budget.categoryId as any) : null;
        const endDate = budget.endDate || new Date().toISOString().split("T")[0];

        const transactions = await ctx.db
          .query("transactions")
          .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
          .collect();

        const spending = transactions
          .filter(
            (t) =>
              t.categoryId === budget.categoryId &&
              t.type === "expense" &&
              t.date >= budget.startDate &&
              t.date <= endDate
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          ...budget,
          categories: category ? { name: category.name, icon: category.icon, color: category.color } : null,
          current_spending: spending,
          remaining: budget.amount - spending,
          percentage_used: (spending / budget.amount) * 100,
        };
      })
    );

    return enriched;
  },
});

export const get = query({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.id);
    if (!budget) return null;

    const category = budget.categoryId ? await ctx.db.get(budget.categoryId as any) : null;
    const endDate = budget.endDate || new Date().toISOString().split("T")[0];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_id", (q) => q.eq("userId", budget.userId))
      .collect();

    const spending = transactions
      .filter(
        (t) =>
          t.categoryId === budget.categoryId &&
          t.type === "expense" &&
          t.date >= budget.startDate &&
          t.date <= endDate
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      ...budget,
      categories: category ? { name: category.name, icon: category.icon, color: category.color } : null,
      current_spending: spending,
      remaining: budget.amount - spending,
      percentage_used: (spending / budget.amount) * 100,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    categoryId: v.string(),
    name: v.string(),
    amount: v.number(),
    period: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    alertThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for existing active budget
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const duplicate = existing.find(
      (b) => b.categoryId === args.categoryId && b.period === args.period && b.isActive
    );

    if (duplicate) {
      throw new Error("A budget already exists for this category and period");
    }

    const now = Date.now();
    return await ctx.db.insert("budgets", {
      userId: args.userId,
      categoryId: args.categoryId,
      name: args.name,
      amount: args.amount,
      period: args.period,
      startDate: args.startDate,
      endDate: args.endDate,
      alertThreshold: args.alertThreshold,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("budgets"),
    categoryId: v.optional(v.string()),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    alertThreshold: v.optional(v.number()),
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
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

