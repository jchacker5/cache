import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grokClient } from '@/lib/grok/client'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    // Get existing insights that aren't expired
    const existingInsights = await client.query(api.aiInsights.list, {
      userId,
      type: type === 'all' ? undefined : type,
      isRead: undefined,
    })

    // If we have recent insights and no specific type requested, return them
    if (existingInsights && existingInsights.length > 0 && type === 'all') {
      return NextResponse.json(existingInsights)
    }

    // Generate new insights
    const insights = await generateInsights(userId, type)

    // Store insights in database
    for (const insight of insights) {
      try {
        await client.mutation(api.aiInsights.create, {
          userId,
          type: insight.type,
          title: insight.title,
          description: insight.content,
          data: insight.data,
          priority: insight.confidence > 0.8 ? 'high' : insight.confidence > 0.6 ? 'medium' : 'low',
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        })
      } catch (error) {
        console.error('Error storing insight:', error)
        // Don't fail the response if storage fails
      }
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

async function generateInsights(userId: string, type: string) {
  const insights = []

  // Get financial data for analysis
  const [transactionsResult, budgetsResult, accountsResult, goalsResult] = await Promise.all([
    client.query(api.transactions.list, {
      userId,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      limit: 100,
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

  const transactions = transactionsResult.transactions || []
  const budgets = budgetsResult || []
  const accounts = accountsResult || []
  const goals = goalsResult || []

  // Generate spending pattern insights
  if (type === 'all' || type === 'spending_pattern') {
    const spendingInsights = await generateSpendingInsights(transactions)
    insights.push(...spendingInsights)
  }

  // Generate budget recommendations
  if (type === 'all' || type === 'budget_recommendation') {
    const budgetInsights = await generateBudgetInsights(transactions, budgets)
    insights.push(...budgetInsights)
  }

  // Generate anomaly detection
  if (type === 'all' || type === 'anomaly_detection') {
    const anomalyInsights = await generateAnomalyInsights(transactions)
    insights.push(...anomalyInsights)
  }

  // Generate savings opportunities
  if (type === 'all' || type === 'savings_opportunity') {
    const savingsInsights = await generateSavingsInsights(transactions, goals, accounts)
    insights.push(...savingsInsights)
  }

  return insights
}

async function generateSpendingInsights(transactions: any[]) {
  if (transactions.length < 10) {
    return []
  }

  const prompt = `
Analyze this spending data and identify key patterns and insights:

Transactions (last 90 days):
${transactions.slice(0, 50).map(t =>
  `${t.date}: ${t.description} - $${Math.abs(t.amount)} (${t.categories?.name || 'Uncategorized'})`
).join('\n')}

Identify 2-3 key spending patterns or insights. Focus on:
- Top spending categories
- Spending trends
- Unusual patterns
- Potential areas for optimization

Format as JSON array of insights with this structure:
[{
  "type": "spending_pattern",
  "title": "Brief title",
  "content": "Detailed insight",
  "confidence": 0.8,
  "data": {"key": "value"}
}]
`

  try {
    const response = await grokClient.queryStructured(
      prompt,
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['spending_pattern'] },
            title: { type: 'string', maxLength: 50 },
            content: { type: 'string', maxLength: 200 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            data: { type: 'object' }
          },
          required: ['type', 'title', 'content', 'confidence']
        }
      }
    )

    return response || []
  } catch (error) {
    console.error('Error generating spending insights:', error)
    return []
  }
}

async function generateBudgetInsights(transactions: any[], budgets: any[]) {
  if (budgets.length === 0) {
    return [{
      type: 'budget_recommendation',
      title: 'Set Up Budgets',
      content: 'You don\'t have any active budgets. Setting up budgets helps you control spending and reach financial goals.',
      confidence: 0.9,
      data: { action: 'create_budget' }
    }]
  }

  const atRiskBudgets = budgets.filter(b => (b.current_spending / b.amount) >= b.alertThreshold)

  if (atRiskBudgets.length > 0) {
    return atRiskBudgets.map(budget => ({
      type: 'budget_recommendation',
      title: `${budget.categories?.name || budget.name} Budget Alert`,
      content: `You've used ${(budget.current_spending / budget.amount * 100).toFixed(0)}% of your ${budget.categories?.name || budget.name} budget. Consider reducing spending in this category.`,
      confidence: 0.85,
      data: { budget_id: budget._id, usage_percentage: budget.current_spending / budget.amount }
    }))
  }

  return []
}

async function generateAnomalyInsights(transactions: any[]) {
  if (transactions.length < 20) {
    return []
  }

  // Simple anomaly detection: look for unusually large transactions
  const expenses = transactions.filter(t => t.amount < 0)
  const amounts = expenses.map(t => Math.abs(t.amount))
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
  )

  const anomalies = expenses.filter(t =>
    Math.abs(t.amount) > avgAmount + (2 * stdDev)
  )

  if (anomalies.length > 0) {
    return anomalies.slice(0, 2).map(anomaly => ({
      type: 'anomaly_detection',
      title: 'Unusual Large Expense',
      content: `You made a large expense of $${Math.abs(anomaly.amount)} on ${anomaly.description}. This is significantly higher than your average transaction.`,
      confidence: 0.75,
      data: {
        transaction_id: anomaly._id,
        amount: Math.abs(anomaly.amount),
        date: anomaly.date
      }
    }))
  }

  return []
}

async function generateSavingsInsights(transactions: any[], goals: any[], accounts: any[]) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) / 3 // Approximate monthly

  const monthlyExpenses = Math.abs(transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0)) / 3

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) : 0

  const insights = []

  // Savings rate insight
  if (savingsRate < 0.1) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Low Savings Rate',
      content: `Your current savings rate is ${(savingsRate * 100).toFixed(1)}%. Consider increasing it to at least 20% for better financial health.`,
      confidence: 0.8,
      data: { savings_rate: savingsRate }
    })
  }

  // Emergency fund check
  const emergencyFundGoal = goals.find(g => g.category === 'emergency' || g.name.toLowerCase().includes('emergency'))
  if (!emergencyFundGoal && totalBalance < 3000) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Build Emergency Fund',
      content: 'Consider building an emergency fund with 3-6 months of expenses. This provides financial security.',
      confidence: 0.9,
      data: { recommended_amount: monthlyExpenses * 3 }
    })
  }

  return insights
}
