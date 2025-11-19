import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    categoryId: v.optional(v.string()),
    accountId: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"), v.literal("transfer"))),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Apply filters
    if (args.categoryId) {
      transactions = transactions.filter((t) => t.categoryId === args.categoryId);
    }
    if (args.accountId) {
      transactions = transactions.filter((t) => t.accountId === args.accountId);
    }
    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          (t.merchant && t.merchant.toLowerCase().includes(query))
      );
    }
    if (args.startDate) {
      transactions = transactions.filter((t) => t.date >= args.startDate!);
    }
    if (args.endDate) {
      transactions = transactions.filter((t) => t.date <= args.endDate!);
    }

    // Apply sorting
    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";
    transactions.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const page = args.page || 1;
    const limit = args.limit || 50;
    const offset = (page - 1) * limit;
    const paginated = transactions.slice(offset, offset + limit);

    // Fetch related data
    const enriched = await Promise.all(
      paginated.map(async (t) => {
        const account = t.accountId ? await ctx.db.get(t.accountId as any) : null;
        const category = t.categoryId ? await ctx.db.get(t.categoryId as any) : null;
        return {
          ...t,
          accounts: account ? { name: account.name, type: account.type, currency: account.currency } : null,
          categories: category ? { name: category.name, icon: category.icon, color: category.color } : null,
        };
      })
    );

    return {
      transactions: enriched,
      pagination: {
        page,
        limit,
        total: transactions.length,
        pages: Math.ceil(transactions.length / limit),
      },
    };
  },
});

export const get = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    if (!transaction) return null;

    const account = transaction.accountId ? await ctx.db.get(transaction.accountId as any) : null;
    const category = transaction.categoryId ? await ctx.db.get(transaction.categoryId as any) : null;

    return {
      ...transaction,
      accounts: account ? { name: account.name, type: account.type, currency: account.currency } : null,
      categories: category ? { name: category.name, icon: category.icon, color: category.color } : null,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    accountId: v.string(),
    categoryId: v.optional(v.string()),
    description: v.string(),
    merchant: v.optional(v.string()),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    date: v.string(),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("transactions", {
      userId: args.userId,
      accountId: args.accountId,
      categoryId: args.categoryId,
      description: args.description,
      merchant: args.merchant,
      amount: args.amount,
      type: args.type,
      date: args.date,
      notes: args.notes,
      tags: args.tags,
      isRecurring: args.isRecurring,
      createdAt: now,
      updatedAt: now,
    });

    // Update account balance
    const account = await ctx.db.get(args.accountId as any);
    if (account) {
      const newBalance = account.balance + args.amount;
      await ctx.db.patch(args.accountId as any, {
        balance: newBalance,
        updatedAt: Date.now(),
      });
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    accountId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    description: v.optional(v.string()),
    merchant: v.optional(v.string()),
    amount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"), v.literal("transfer"))),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Transaction not found");

    // If amount or account changed, update balances
    if (args.amount !== undefined || args.accountId !== undefined) {
      const oldAccount = await ctx.db.get(existing.accountId as any);
      if (oldAccount && args.amount !== undefined) {
        const oldBalance = oldAccount.balance - existing.amount;
        await ctx.db.patch(existing.accountId as any, {
          balance: oldBalance,
          updatedAt: Date.now(),
        });
      }

      const newAccountId = args.accountId || existing.accountId;
      const newAmount = args.amount !== undefined ? args.amount : existing.amount;
      const newAccount = await ctx.db.get(newAccountId as any);
      if (newAccount) {
        const newBalance = newAccount.balance + newAmount;
        await ctx.db.patch(newAccountId as any, {
          balance: newBalance,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    if (!transaction) return;

    // Update account balance
    const account = await ctx.db.get(transaction.accountId as any);
    if (account) {
      const newBalance = account.balance - transaction.amount;
      await ctx.db.patch(transaction.accountId as any, {
        balance: newBalance,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
  },
});

