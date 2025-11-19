import { grokClient } from '@/lib/grok/client'

export interface CategorizationResult {
  category: string
  confidence: number
  explanation: string
  ai_categorized: boolean
}

export interface TransactionForCategorization {
  description: string
  merchant?: string
  amount: number
}

export async function categorizeTransaction(
  transaction: TransactionForCategorization
): Promise<CategorizationResult> {
  try {
    const prompt = `
Analyze this transaction and categorize it appropriately for personal finance tracking.

Transaction Details:
- Description: ${transaction.description}
${transaction.merchant ? `- Merchant: ${transaction.merchant}` : ''}
- Amount: ${transaction.amount > 0 ? 'income' : 'expense'} of $${Math.abs(transaction.amount)}

Based on the transaction details, determine:
1. The most appropriate category from these options: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Healthcare, Income, Transfer, Other
2. Your confidence level (high, medium, low)
3. A brief explanation for your choice

Respond in JSON format with this structure:
{
  "category": "Category Name",
  "confidence": "high|medium|low",
  "explanation": "Brief explanation"
}
`

    const response = await grokClient.queryStructured(
      prompt,
      {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Income', 'Transfer', 'Other']
          },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low']
          },
          explanation: {
            type: 'string',
            maxLength: 100
          }
        },
        required: ['category', 'confidence', 'explanation']
      }
    )

    // Convert category name to match our database format
    const categoryMap: Record<string, string> = {
      'Food & Dining': 'Food',
      'Transportation': 'Transport',
      'Shopping': 'Shopping',
      'Bills & Utilities': 'Bills',
      'Entertainment': 'Entertainment',
      'Healthcare': 'Healthcare',
      'Income': 'Income',
      'Transfer': 'Transfer',
      'Other': 'Other'
    }

    const mappedCategory = categoryMap[response.category] || 'Other'

    // Convert confidence to numeric value
    const confidenceMap = {
      high: 0.9,
      medium: 0.7,
      low: 0.5
    }

    return {
      category: mappedCategory,
      confidence: confidenceMap[response.confidence as keyof typeof confidenceMap],
      explanation: response.explanation,
      ai_categorized: true,
    }
  } catch (error) {
    console.error('AI categorization error:', error)

    // Fallback categorization based on keywords
    return fallbackCategorization(transaction)
  }
}

function fallbackCategorization(transaction: TransactionForCategorization): CategorizationResult {
  const { description, merchant, amount } = transaction
  const text = `${description} ${merchant || ''}`.toLowerCase()

  // Income patterns
  if (amount > 0 || text.includes('salary') || text.includes('payroll') || text.includes('deposit')) {
    return {
      category: 'Income',
      confidence: 0.6,
      explanation: 'Detected as income based on amount and keywords',
      ai_categorized: false,
    }
  }

  // Expense categorization based on keywords
  const patterns = [
    { keywords: ['grocery', 'restaurant', 'food', 'cafe', 'starbucks', 'mcdonald', 'kfc'], category: 'Food' },
    { keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'train', 'bus', 'parking'], category: 'Transport' },
    { keywords: ['amazon', 'walmart', 'target', 'shopping', 'store', 'mall'], category: 'Shopping' },
    { keywords: ['electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance'], category: 'Bills' },
    { keywords: ['movie', 'netflix', 'spotify', 'cinema', 'theater', 'concert'], category: 'Entertainment' },
    { keywords: ['pharmacy', 'doctor', 'hospital', 'medical', 'dental'], category: 'Healthcare' },
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => text.includes(keyword))) {
      return {
        category: pattern.category,
        confidence: 0.7,
        explanation: `Detected "${pattern.category}" category based on keywords: ${pattern.keywords.find(k => text.includes(k))}`,
        ai_categorized: false,
      }
    }
  }

  // Default fallback
  return {
    category: 'Other',
    confidence: 0.3,
    explanation: 'Could not determine category from transaction details',
    ai_categorized: false,
  }
}

export async function batchCategorizeTransactions(
  transactions: TransactionForCategorization[]
): Promise<CategorizationResult[]> {
  const results: CategorizationResult[] = []

  // Process in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    const batchPromises = batch.map(categorizeTransaction)

    try {
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    } catch (error) {
      console.error('Batch categorization error:', error)
      // Fallback to individual processing with delays
      for (const transaction of batch) {
        try {
          const result = await categorizeTransaction(transaction)
          results.push(result)
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          results.push(fallbackCategorization(transaction))
        }
      }
    }
  }

  return results
}
