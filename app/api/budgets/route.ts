import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1),
  amount: z.number().positive(),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  start_date: z.string(), // ISO date string
  end_date: z.string().optional(),
  alert_threshold: z.number().min(0).max(1).default(0.9),
})

const updateBudgetSchema = createBudgetSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const period = searchParams.get('period') || 'monthly'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = supabase
      .from('budgets')
      .select(`
        *,
        categories(name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('period', period)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: budgets, error } = await query.order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching budgets:', error)
      return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
    }

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Get spending for current period
        const { data: spending, error: spendingError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('date', budget.start_date)
          .lte('date', budget.end_date || new Date().toISOString().split('T')[0])

        if (spendingError) {
          console.error('Error calculating spending:', spendingError)
          return { ...budget, current_spending: 0 }
        }

        const currentSpending = spending.reduce((sum, t) => sum + Math.abs(t.amount), 0)

        return {
          ...budget,
          current_spending: currentSpending,
          remaining: budget.amount - currentSpending,
          percentage_used: (currentSpending / budget.amount) * 100,
        }
      })
    )

    return NextResponse.json(budgetsWithSpending)
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

    const supabase = createClient()
    const body = await request.json()

    // Validate input
    const validatedData = createBudgetSchema.parse(body)

    // Verify category belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .eq('user_id', userId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Check for existing budget for same category and period
    const { data: existingBudget, error: checkError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', validatedData.category_id)
      .eq('period', validatedData.period)
      .eq('is_active', true)
      .single()

    if (existingBudget) {
      return NextResponse.json(
        { error: 'A budget already exists for this category and period' },
        { status: 400 }
      )
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select(`
        *,
        categories(name, icon, color)
      `)
      .single()

    if (error) {
      console.error('Error creating budget:', error)
      return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
    }

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Budget creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
