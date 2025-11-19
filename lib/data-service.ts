// Data service that calls the API routes (which use Convex)
// This provides a clean interface for frontend components

export interface Transaction {
  id: string
  userId: string
  accountId: string
  categoryId?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description: string
  merchant?: string
  date: string
  isRecurring?: boolean
  notes?: string
  tags?: string[]
}

export interface Account {
  id: string
  userId: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  currency: string
  institution?: string
  isActive: boolean
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  spent?: number
  current_spending?: number
  remaining?: number
  alertThreshold: number
  isActive: boolean
}

// Data service functions that call API routes
export class DataService {
  static async getDashboardMetrics(userId: string) {
    try {
      const [transactions, accounts] = await Promise.all([
        this.getTransactions(userId),
        this.getAccounts(userId),
      ])

      // Calculate metrics
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const last28DaysStart = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
      const last365DaysStart = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

      // Today's spending
      const todaySpending = Math.abs(
        transactions
          .filter(t => t.type === 'expense' && new Date(t.date) >= todayStart)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      )

      // Last 28 days spending
      const last28DaysSpending = Math.abs(
        transactions
          .filter(t => t.type === 'expense' && new Date(t.date) >= last28DaysStart)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      )

      // Last 365 days spending
      const last365DaysSpending = Math.abs(
        transactions
          .filter(t => t.type === 'expense' && new Date(t.date) >= last365DaysStart)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      )

      // Cash (total liquid assets)
      const cash = accounts
        .filter(a => a.type !== 'credit')
        .reduce((sum, a) => sum + a.balance, 0)

      // Monthly burn rate (last 30 days average spending)
      const monthlyBurn = last28DaysSpending * (30/28)

      // Runway (months of cash left at current burn rate)
      const runway = cash > 0 && monthlyBurn > 0 ? cash / monthlyBurn : 0

      return {
        cash,
        burn: monthlyBurn,
        runway,
        todaySpending,
        last28Days: last28DaysSpending,
        last365Days: last365DaysSpending,
      }
    } catch (error) {
      console.error('Error getting dashboard metrics:', error)
      // Return default values on error
      return {
        cash: 0,
        burn: 0,
        runway: 0,
        todaySpending: 0,
        last28Days: 0,
        last365Days: 0,
      }
    }
  }

  static async getRecentTransactions(userId: string, limit: number = 10) {
    try {
      const response = await fetch(`/api/transactions?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      return (data.transactions || []).slice(0, limit)
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      return []
    }
  }

  static async getTransactions(userId: string) {
    try {
      const response = await fetch('/api/transactions')
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      return data.transactions || []
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  static async getAccounts(userId: string) {
    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      return await response.json()
    } catch (error) {
      console.error('Error fetching accounts:', error)
      return []
    }
  }

  static async getBudgets(userId: string) {
    try {
      const response = await fetch('/api/budgets')
      if (!response.ok) throw new Error('Failed to fetch budgets')
      return await response.json()
    } catch (error) {
      console.error('Error fetching budgets:', error)
      return []
    }
  }

  static async getSavingsGoals(userId: string) {
    try {
      const response = await fetch('/api/savings-goals')
      if (!response.ok) throw new Error('Failed to fetch savings goals')
      return await response.json()
    } catch (error) {
      console.error('Error fetching savings goals:', error)
      return []
    }
  }

  static async getAiInsights(userId: string) {
    try {
      const response = await fetch('/api/ai/insights')
      if (!response.ok) throw new Error('Failed to fetch AI insights')
      return await response.json()
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      return []
    }
  }
}
