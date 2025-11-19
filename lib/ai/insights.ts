import { grokClient } from '@/lib/grok/client'

export interface FinancialInsight {
  id?: string
  type: 'spending_pattern' | 'budget_recommendation' | 'anomaly_detection' | 'savings_opportunity'
  title: string
  content: string
  confidence: number
  data?: any
  created_at?: string
}

export interface FinancialData {
  transactions: any[]
  budgets: any[]
  accounts: any[]
  goals: any[]
  userId: string
}

export async function generateInsights(
  data: FinancialData,
  types: string[] = ['all']
): Promise<FinancialInsight[]> {
  const insights: FinancialInsight[] = []

  try {
    if (types.includes('all') || types.includes('spending_pattern')) {
      const spendingInsights = await generateSpendingInsights(data)
      insights.push(...spendingInsights)
    }

    if (types.includes('all') || types.includes('budget_recommendation')) {
      const budgetInsights = await generateBudgetInsights(data)
      insights.push(...budgetInsights)
    }

    if (types.includes('all') || types.includes('anomaly_detection')) {
      const anomalyInsights = await generateAnomalyInsights(data)
      insights.push(...anomalyInsights)
    }

    if (types.includes('all') || types.includes('savings_opportunity')) {
      const savingsInsights = await generateSavingsInsights(data)
      insights.push(...savingsInsights)
    }

    // Sort by confidence (highest first)
    return insights.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error('Error generating insights:', error)
    return []
  }
}

async function generateSpendingInsights(data: FinancialData): Promise<FinancialInsight[]> {
  const { transactions } = data

  if (transactions.length < 5) {
    return []
  }

  // Calculate spending by category
  const categorySpending: Record<string, number> = {}
  transactions
    .filter(t => t.amount < 0) // Only expenses
    .forEach(t => {
      const category = t.categories?.name || 'Uncategorized'
      categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount)
    })

  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  if (topCategories.length === 0) {
    return []
  }

  const insights: FinancialInsight[] = []

  // Top spending category insight
  const [topCategory, topAmount] = topCategories[0]
  insights.push({
    type: 'spending_pattern',
    title: `${topCategory} is Your Biggest Expense`,
    content: `You've spent $${topAmount.toFixed(2)} on ${topCategory} recently, making it your largest expense category.`,
    confidence: 0.9,
    data: { category: topCategory, amount: topAmount, ranking: 1 }
  })

  // Spending distribution insight
  if (topCategories.length >= 2) {
    const totalSpending = topCategories.reduce((sum, [, amount]) => sum + amount, 0)
    const topPercentage = (topAmount / totalSpending) * 100

    if (topPercentage > 60) {
      insights.push({
        type: 'spending_pattern',
        title: 'Concentrated Spending Pattern',
        content: `${topPercentage.toFixed(0)}% of your spending is in ${topCategory}. Consider diversifying your expenses for better financial balance.`,
        confidence: 0.8,
        data: { category: topCategory, percentage: topPercentage }
      })
    }
  }

  return insights
}

async function generateBudgetInsights(data: FinancialData): Promise<FinancialInsight[]> {
  const { budgets, transactions } = data

  if (budgets.length === 0) {
    return [{
      type: 'budget_recommendation',
      title: 'Start Budgeting Today',
      content: 'You haven\'t set up any budgets yet. Creating budgets helps you control spending and reach your financial goals.',
      confidence: 0.95,
      data: { action: 'create_first_budget' }
    }]
  }

  const insights: FinancialInsight[] = []

  // Check for at-risk budgets
  const atRiskBudgets = budgets.filter(budget => {
    const usageRate = budget.spent / budget.amount
    return usageRate >= budget.alert_threshold
  })

  atRiskBudgets.forEach(budget => {
    const usageRate = budget.spent / budget.amount
    const remaining = budget.amount - budget.spent

    insights.push({
      type: 'budget_recommendation',
      title: `${budget.categories?.name || budget.name} Budget Alert`,
      content: `You've used ${(usageRate * 100).toFixed(0)}% of your ${budget.categories?.name || budget.name} budget. Only $${remaining.toFixed(2)} remaining.`,
      confidence: 0.9,
      data: {
        budget_id: budget.id,
        usage_rate: usageRate,
        remaining: remaining,
        category: budget.categories?.name || budget.name
      }
    })
  })

  // Check for under-utilized budgets
  const underUtilizedBudgets = budgets.filter(budget => {
    const usageRate = budget.spent / budget.amount
    return usageRate < 0.3 // Less than 30% used
  })

  if (underUtilizedBudgets.length > 0) {
    insights.push({
      type: 'budget_recommendation',
      title: 'Consider Adjusting Budgets',
      content: `You have ${underUtilizedBudgets.length} budget${underUtilizedBudgets.length > 1 ? 's' : ''} that are under 30% utilized. Consider reallocating funds to other categories.`,
      confidence: 0.7,
      data: { under_utilized_count: underUtilizedBudgets.length }
    })
  }

  return insights
}

async function generateAnomalyInsights(data: FinancialData): Promise<FinancialInsight[]> {
  const { transactions } = data

  if (transactions.length < 10) {
    return []
  }

  const expenses = transactions.filter(t => t.amount < 0)
  const amounts = expenses.map(t => Math.abs(t.amount))

  if (amounts.length === 0) {
    return []
  }

  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
  )

  // Find transactions that are 2+ standard deviations above the mean
  const anomalies = expenses.filter(t => Math.abs(t.amount) > avgAmount + (2 * stdDev))

  const insights: FinancialInsight[] = []

  anomalies.slice(0, 2).forEach(anomaly => { // Limit to 2 anomalies
    insights.push({
      type: 'anomaly_detection',
      title: 'Unusual Large Expense',
      content: `You spent $${Math.abs(anomaly.amount).toFixed(2)} on "${anomaly.description}" - significantly higher than your average transaction of $${avgAmount.toFixed(2)}.`,
      confidence: 0.8,
      data: {
        transaction_id: anomaly.id,
        amount: Math.abs(anomaly.amount),
        average_amount: avgAmount,
        date: anomaly.date,
        merchant: anomaly.merchant
      }
    })
  })

  // Check for frequent small transactions
  const smallTransactions = expenses.filter(t => Math.abs(t.amount) < 5)
  if (smallTransactions.length > expenses.length * 0.3) { // More than 30% are small
    const smallTotal = smallTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    insights.push({
      type: 'anomaly_detection',
      title: 'Frequent Small Purchases',
      content: `${smallTransactions.length} transactions under $5 total $${smallTotal.toFixed(2)}. Consider using cash or tracking these more carefully.`,
      confidence: 0.6,
      data: {
        small_transaction_count: smallTransactions.length,
        small_total: smallTotal
      }
    })
  }

  return insights
}

async function generateSavingsInsights(data: FinancialData): Promise<FinancialInsight[]> {
  const { transactions, accounts, goals } = data

  const insights: FinancialInsight[] = []

  // Calculate savings rate
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTransactions = transactions.filter(t =>
    new Date(t.date) >= thirtyDaysAgo
  )

  const monthlyIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = Math.abs(recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) : 0
  const netSavings = monthlyIncome - monthlyExpenses

  // Savings rate insight
  if (savingsRate < 0.1 && monthlyIncome > 0) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Low Savings Rate Detected',
      content: `Your current savings rate is ${(savingsRate * 100).toFixed(1)}%. Aim for at least 20% to build wealth faster.`,
      confidence: 0.85,
      data: { savings_rate: savingsRate, target_rate: 0.2 }
    })
  } else if (savingsRate > 0.3) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Excellent Savings Rate!',
      content: `You're saving ${(savingsRate * 100).toFixed(1)}% of your income. Keep up the great work!`,
      confidence: 0.9,
      data: { savings_rate: savingsRate }
    })
  }

  // Emergency fund check
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const emergencyFundGoal = goals.find(g =>
    g.category === 'essential' ||
    g.name.toLowerCase().includes('emergency') ||
    g.name.toLowerCase().includes('fund')
  )

  if (!emergencyFundGoal && totalBalance < monthlyExpenses * 3) {
    insights.push({
      type: 'savings_opportunity',
      title: 'Build Your Emergency Fund',
      content: `Consider saving 3-6 months of expenses ($${monthlyExpenses * 3}) for emergencies. You currently have $${totalBalance.toFixed(2)}.`,
      confidence: 0.9,
      data: {
        recommended_amount: monthlyExpenses * 3,
        current_balance: totalBalance
      }
    })
  }

  // High-interest debt check
  const creditAccounts = accounts.filter(acc => acc.type === 'credit' && acc.balance < 0)
  const totalDebt = Math.abs(creditAccounts.reduce((sum, acc) => sum + acc.balance, 0))

  if (totalDebt > 0 && monthlyIncome > 0) {
    const debtToIncomeRatio = totalDebt / monthlyIncome
    if (debtToIncomeRatio > 0.2) {
      insights.push({
        type: 'savings_opportunity',
        title: 'Consider Debt Payoff Strategy',
        content: `Your debt-to-income ratio is ${(debtToIncomeRatio * 100).toFixed(1)}%. Focus on paying down high-interest debt to improve your financial health.`,
        confidence: 0.8,
        data: {
          total_debt: totalDebt,
          debt_to_income_ratio: debtToIncomeRatio
        }
      })
    }
  }

  return insights
}

// Helper function to determine insight priority
export function prioritizeInsights(insights: FinancialInsight[]): FinancialInsight[] {
  const priorityOrder = {
    'budget_recommendation': 1,
    'anomaly_detection': 2,
    'savings_opportunity': 3,
    'spending_pattern': 4,
  }

  return insights.sort((a, b) => {
    // First sort by priority (lower number = higher priority)
    const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type]
    if (priorityDiff !== 0) return priorityDiff

    // Then by confidence (higher first)
    return b.confidence - a.confidence
  })
}
