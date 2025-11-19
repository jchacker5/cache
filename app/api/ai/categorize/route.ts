import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grokClient } from '@/lib/grok/client'
import { z } from 'zod'

const categorizeSchema = z.object({
  description: z.string().min(1),
  merchant: z.string().optional(),
  amount: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, merchant, amount } = categorizeSchema.parse(body)

    // Create prompt for categorization
    const prompt = `
Analyze this transaction and categorize it appropriately for personal finance tracking.

Transaction Details:
- Description: ${description}
${merchant ? `- Merchant: ${merchant}` : ''}
- Amount: ${amount > 0 ? 'income' : 'expense'} of $${Math.abs(amount)}

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

    return NextResponse.json({
      category: mappedCategory,
      confidence: confidenceMap[response.confidence as keyof typeof confidenceMap],
      explanation: response.explanation,
      ai_categorized: true,
    })
  } catch (error) {
    console.error('AI categorization error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to categorize transaction', fallback: 'Other' },
      { status: 500 }
    )
  }
}
