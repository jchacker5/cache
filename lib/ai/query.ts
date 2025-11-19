import { grokClient } from '@/lib/grok/client'

export interface FinancialQuery {
  query: string
  userId: string
  context?: {
    total_balance?: number
    monthly_income?: number
    monthly_expenses?: number
    budgets_count?: number
    goals_count?: number
  }
}

export interface QueryResponse {
  response: string
  context: any
  confidence?: number
}

export async function processFinancialQuery(query: FinancialQuery): Promise<QueryResponse> {
  try {
    // Create context string for the AI
    const context = buildQueryContext(query.context)

    // Create the AI prompt
    const prompt = `
You are a helpful financial assistant for the Cache spending management app. Analyze the user's query and provide a helpful, accurate response based on their financial data.

User Query: "${query.query}"

${context}

Guidelines for responding:
- Be concise but informative (aim for 2-4 sentences)
- Use specific numbers from their data when relevant
- If they ask about trends, reference their actual data patterns
- For budget questions, mention their active budgets
- For account questions, reference their balances
- If they ask for advice, be helpful but conservative
- Always format currency amounts properly (e.g., $1,234.56)
- If the data doesn't support a definitive answer, say so clearly
- Use friendly, professional tone
- If they ask about features, explain how Cache can help

Common query types and responses:
- "How much did I spend on food this month?" → Look at food transactions
- "What's my biggest expense?" → Find highest transaction amounts
- "Am I on track with my budget?" → Compare budget limits vs spending
- "How much do I save each month?" → Calculate income minus expenses
- "Where can I cut spending?" → Identify high-spending categories

Respond naturally as a financial assistant would.
`

    const response = await grokClient.query(prompt, context, {
      temperature: 0.7,
      maxTokens: 500,
    })

    return {
      response,
      context: query.context,
      confidence: 0.8, // Default confidence for successful responses
    }
  } catch (error) {
    console.error('AI query processing error:', error)

    // Fallback response
    return {
      response: "I'm sorry, I encountered an error processing your question. Please try rephrasing or ask again in a moment.",
      context: query.context || {},
      confidence: 0,
    }
  }
}

function buildQueryContext(context?: FinancialQuery['context']): string {
  if (!context) {
    return 'Financial Context: Limited data available.'
  }

  let contextString = 'Financial Context:\n'

  if (context.total_balance !== undefined) {
    contextString += `- Total Account Balance: $${context.total_balance.toLocaleString()}\n`
  }

  if (context.monthly_income !== undefined) {
    contextString += `- Monthly Income: $${context.monthly_income.toLocaleString()}\n`
  }

  if (context.monthly_expenses !== undefined) {
    contextString += `- Monthly Expenses: $${context.monthly_expenses.toLocaleString()}\n`
  }

  if (context.budgets_count !== undefined) {
    contextString += `- Active Budgets: ${context.budgets_count}\n`
  }

  if (context.goals_count !== undefined) {
    contextString += `- Savings Goals: ${context.goals_count}\n`
  }

  // Add calculated metrics
  if (context.monthly_income !== undefined && context.monthly_expenses !== undefined) {
    const netFlow = context.monthly_income - context.monthly_expenses
    const savingsRate = context.monthly_income > 0 ? (netFlow / context.monthly_income) * 100 : 0

    contextString += `- Net Cash Flow: ${netFlow >= 0 ? '+' : ''}$${netFlow.toLocaleString()}\n`
    contextString += `- Savings Rate: ${savingsRate.toFixed(1)}%\n`
  }

  return contextString
}

// Helper function to extract key financial metrics from database results
export function extractFinancialMetrics(transactions: any[], budgets: any[], accounts: any[], goals: any[]) {
  // Calculate metrics from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTransactions = transactions.filter(t =>
    new Date(t.date) >= thirtyDaysAgo
  )

  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = Math.abs(recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  return {
    total_balance: totalBalance,
    monthly_income: totalIncome,
    monthly_expenses: totalExpenses,
    budgets_count: budgets.length,
    goals_count: goals.length,
  }
}

// Function to determine if a query needs detailed transaction data
export function requiresDetailedData(query: string): boolean {
  const detailedKeywords = [
    'how much', 'total', 'spent', 'biggest', 'largest', 'most expensive',
    'average', 'trend', 'pattern', 'compare', 'versus', 'vs',
    'breakdown', 'details', 'specific', 'exact'
  ]

  const lowerQuery = query.toLowerCase()
  return detailedKeywords.some(keyword => lowerQuery.includes(keyword))
}

// Function to categorize query intent
export function categorizeQueryIntent(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('spend') || lowerQuery.includes('expense') || lowerQuery.includes('cost')) {
    return 'spending_analysis'
  }

  if (lowerQuery.includes('budget') || lowerQuery.includes('limit') || lowerQuery.includes('track')) {
    return 'budget_management'
  }

  if (lowerQuery.includes('save') || lowerQuery.includes('saving') || lowerQuery.includes('goal')) {
    return 'savings_planning'
  }

  if (lowerQuery.includes('balance') || lowerQuery.includes('account') || lowerQuery.includes('money')) {
    return 'account_overview'
  }

  if (lowerQuery.includes('advice') || lowerQuery.includes('recommend') || lowerQuery.includes('should')) {
    return 'financial_advice'
  }

  return 'general_inquiry'
}
