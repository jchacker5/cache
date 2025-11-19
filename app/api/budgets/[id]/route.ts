import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  alert_threshold: z.number().min(0).max(1).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = params

    const { data: budget, error } = await supabase
      .from('budgets')
      .select(`
        *,
        categories(name, icon, color)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
      }
      console.error('Error fetching budget:', error)
      return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
    }

    // Calculate current spending
    const { data: spending, error: spendingError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', budget.category_id)
      .eq('type', 'expense')
      .gte('date', budget.start_date)
      .lte('date', budget.end_date || new Date().toISOString().split('T')[0])

    const currentSpending = spendingError
      ? 0
      : spending.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return NextResponse.json({
      ...budget,
      current_spending: currentSpending,
      remaining: budget.amount - currentSpending,
      percentage_used: (currentSpending / budget.amount) * 100,
    })
  } catch (error) {
    console.error('Budget fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate input
    const validatedData = updateBudgetSchema.parse(body)

    // Verify budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Update budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        categories(name, icon, color)
      `)
      .single()

    if (error) {
      console.error('Error updating budget:', error)
      return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Budget update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = params

    // Delete budget
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting budget:', error)
      return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
