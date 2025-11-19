import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    completed: v.optional(v.union(v.literal("true"), v.literal("false"))),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    let goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.completed === "true") {
      goals = goals.filter((g) => g.isCompleted);
    } else if (args.completed === "false") {
      goals = goals.filter((g) => !g.isCompleted);
    }

    if (args.category) {
      goals = goals.filter((g) => g.category === args.category);
    }

    if (args.priority) {
      goals = goals.filter((g) => g.priority === args.priority);
    }

    goals.sort((a, b) => b.createdAt - a.createdAt);

    return goals.map((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthsToGoal =
        remaining > 0 && goal.monthlyContribution > 0
          ? Math.ceil(remaining / goal.monthlyContribution)
          : 0;

      return {
        ...goal,
        progress,
        remaining,
        months_to_goal: monthsToGoal,
        is_overdue: goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted,
      };
    });
  },
});

export const get = query({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) return null;

    const contributions = await ctx.db
      .query("savingsGoalContributions")
      .withIndex("by_goal_id", (q) => q.eq("goalId", args.id))
      .collect();

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;

    return {
      ...goal,
      contributions,
      progress,
      remaining,
      months_to_goal:
        remaining > 0 && goal.monthlyContribution > 0
          ? Math.ceil(remaining / goal.monthlyContribution)
          : 0,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    monthlyContribution: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("savingsGoals", {
      userId: args.userId,
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount,
      deadline: args.deadline,
      priority: args.priority,
      category: args.category,
      monthlyContribution: args.monthlyContribution,
      description: args.description,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("savingsGoals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    monthlyContribution: v.optional(v.number()),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
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
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    // Delete related contributions
    const contributions = await ctx.db
      .query("savingsGoalContributions")
      .withIndex("by_goal_id", (q) => q.eq("goalId", args.id))
      .collect();

    await Promise.all(contributions.map((c) => ctx.db.delete(c._id)));

    await ctx.db.delete(args.id);
  },
});

export const addContribution = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    userId: v.string(),
    amount: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const now = Date.now();
    await ctx.db.insert("savingsGoalContributions", {
      goalId: args.goalId,
      userId: args.userId,
      amount: args.amount,
      date: args.date,
      notes: args.notes,
      createdAt: now,
    });

    const newAmount = goal.currentAmount + args.amount;
    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
      isCompleted: newAmount >= goal.targetAmount,
      updatedAt: Date.now(),
    });
  },
});

