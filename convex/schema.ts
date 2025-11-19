import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]),

  accounts: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("checking"), v.literal("savings"), v.literal("credit"), v.literal("investment")),
    balance: v.number(),
    currency: v.string(),
    institution: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    lastFour: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  defaultCategories: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }),

  transactions: defineTable({
    userId: v.string(),
    accountId: v.string(),
    categoryId: v.optional(v.string()),
    description: v.string(),
    merchant: v.optional(v.string()),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    date: v.string(), // ISO date string
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isRecurring: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_account_id", ["accountId"])
    .index("by_category_id", ["categoryId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"]),

  budgets: defineTable({
    userId: v.string(),
    categoryId: v.string(),
    name: v.string(),
    amount: v.number(),
    period: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()), // ISO date string
    alertThreshold: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_period", ["userId", "period"])
    .index("by_user_and_active", ["userId", "isActive"]),

  savingsGoals: defineTable({
    userId: v.string(),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()), // ISO date string
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    monthlyContribution: v.number(),
    description: v.optional(v.string()),
    isCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_completed", ["userId", "isCompleted"]),

  savingsGoalContributions: defineTable({
    goalId: v.id("savingsGoals"),
    userId: v.string(),
    amount: v.number(),
    date: v.string(), // ISO date string
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_goal_id", ["goalId"])
    .index("by_user_id", ["userId"]),

  aiQueries: defineTable({
    userId: v.string(),
    query: v.string(),
    response: v.string(),
    context: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  aiInsights: defineTable({
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    data: v.optional(v.any()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isRead: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_read", ["userId", "isRead"]),
});

