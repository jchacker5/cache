import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grokClient } from '@/lib/grok/client'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { z } from 'zod'

const querySchema = z.object({
  query: z.string().min(1),
  context: z.object({
    user_id: z.string(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query } = querySchema.parse(body)

    // Gather relevant financial data for context
    const [transactionsResult, budgetsResult, accountsResult, savingsGoalsResult] = await Promise.all([
      client.query(api.transactions.list, {
        userId,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limit: 50,
      }),
      client.query(api.budgets.list, {
        userId,
        activeOnly: true,
      }),
      client.query(api.accounts.list, {
        userId,
        activeOnly: true,
      }),
      client.query(api.savingsGoals.list, {
        userId,
        completed: 'false',
      }),
    ])

    // Extract data from results
    const transactions = transactionsResult.transactions || []
    const budgets = budgetsResult || []
    const accounts = accountsResult || []
    const savingsGoals = savingsGoalsResult || []

    // Calculate key metrics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0)

    const totalExpenses = Math.abs(transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0))

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    // Create context for AI
    const context = `
User Financial Data Summary:
- Total Account Balance: $${totalBalance.toFixed(2)}
- Monthly Income (last 30 days): $${totalIncome.toFixed(2)}
- Monthly Expenses (last 30 days): $${totalExpenses.toFixed(2)}
- Net Cash Flow: $${(totalIncome - totalExpenses).toFixed(2)}
- Active Budgets: ${budgets.length}
- Savings Goals: ${savingsGoals.length}

Recent Transactions (last 30 days): ${transactions.slice(0, 10).map(t =>
  `${t.date}: ${t.description} - $${t.amount > 0 ? '+' : ''}${t.amount} (${t.categories?.name || 'Uncategorized'})`
).join(', ')}

Budgets: ${budgets.map(b =>
  `${b.categories?.name || b.name}: $${b.current_spending}/${b.amount} (${b.period})`
).join(', ')}

Accounts: ${accounts.map(a =>
  `${a.name}: $${a.balance} (${a.type})`
).join(', ')}
`

    // Create the AI prompt
    const prompt = `
You are a helpful financial assistant for the Cache spending management app. Analyze the user's query and provide a helpful, accurate response based on their financial data.

User Query: "${query}"

Financial Context:
${context}

Guidelines:
- Be concise but informative
- Use specific numbers and examples from their data when relevant
- If they ask about trends or patterns, reference their actual transaction data
- For budget questions, reference their active budgets and spending
- For account questions, reference their account balances
- If they ask for advice, be helpful but conservative
- Always format currency amounts properly
- If the data doesn't support a definitive answer, say so clearly

Respond naturally as a financial assistant would.
`

    const response = await grokClient.query(prompt, context)

    // Store the query for analytics
    try {
      await client.mutation(api.aiQueries.create, {
        userId,
        query,
        response,
        context: {
          total_balance: totalBalance,
          monthly_income: totalIncome,
          monthly_expenses: totalExpenses,
          budgets_count: budgets.length,
          goals_count: savingsGoals.length,
        },
      })
    } catch (error) {
      // Don't fail the response if analytics storage fails
      console.error('Failed to store AI query:', error)
    }

    return NextResponse.json({
      response,
      context: {
        total_balance: totalBalance,
        monthly_income: totalIncome,
        monthly_expenses: totalExpenses,
      }
    })
  } catch (error) {
    console.error('AI query error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Sorry, I encountered an error processing your question. Please try again.' },
      { status: 500 }
    )
  }
}
