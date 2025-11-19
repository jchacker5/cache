import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createBudgetSchema = z.object({
  category_id: z.string(),
  name: z.string().min(1),
  amount: z.number().positive(),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  start_date: z.string(),
  end_date: z.string().optional(),
  alert_threshold: z.number().min(0).max(1).default(0.9),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const period = searchParams.get('period') || 'monthly'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const budgets = await client.query(api.budgets.list, {
      userId,
      period: period as 'weekly' | 'monthly' | 'yearly',
      activeOnly,
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Budgets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createBudgetSchema.parse(body)

    // Verify category belongs to user
    const category = await client.query(api.categories.get, { id: validatedData.category_id as any })
    if (!category || category.userId !== userId) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create budget
    try {
      const budgetId = await client.mutation(api.budgets.create, {
        userId,
        categoryId: validatedData.category_id,
        name: validatedData.name,
        amount: validatedData.amount,
        period: validatedData.period,
        startDate: validatedData.start_date,
        endDate: validatedData.end_date,
        alertThreshold: validatedData.alert_threshold,
      })

      const budget = await client.query(api.budgets.get, { id: budgetId })

      return NextResponse.json(budget, { status: 201 })
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'A budget already exists for this category and period' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Budget creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
