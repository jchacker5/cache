import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createSavingsGoalSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).default(0),
  deadline: z.string().optional(), // ISO date string
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  monthly_contribution: z.number().min(0).default(0),
  description: z.string().optional(),
})

const updateSavingsGoalSchema = createSavingsGoalSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const completed = searchParams.get('completed')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    let query = supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)

    if (completed === 'true') {
      query = query.eq('is_completed', true)
    } else if (completed === 'false') {
      query = query.eq('is_completed', false)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: goals, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching savings goals:', error)
      return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 })
    }

    // Calculate progress and additional metrics for each goal
    const goalsWithMetrics = goals.map(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100
      const remaining = goal.target_amount - goal.current_amount
      const monthsToGoal = remaining > 0 && goal.monthly_contribution > 0
        ? Math.ceil(remaining / goal.monthly_contribution)
        : 0

      return {
        ...goal,
        progress,
        remaining,
        months_to_goal: monthsToGoal,
        is_overdue: goal.deadline && new Date(goal.deadline) < new Date() && !goal.is_completed,
      }
    })

    return NextResponse.json(goalsWithMetrics)
  } catch (error) {
    console.error('Savings goals API error:', error)
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
    const validatedData = createSavingsGoalSchema.parse(body)

    // Create savings goal
    const { data: goal, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating savings goal:', error)
      return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 })
    }

    // Calculate initial metrics
    const progress = (goal.current_amount / goal.target_amount) * 100
    const remaining = goal.target_amount - goal.current_amount

    return NextResponse.json({
      ...goal,
      progress,
      remaining,
      months_to_goal: goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : 0,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Savings goal creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
