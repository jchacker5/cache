import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).optional(),
  target_amount: z.number().positive().optional(),
  current_amount: z.number().min(0).optional(),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  monthly_contribution: z.number().min(0).optional(),
  description: z.string().optional(),
  is_completed: z.boolean().optional(),
})

const contributeSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = await params

    const { data: goal, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
      }
      console.error('Error fetching savings goal:', error)
      return NextResponse.json({ error: 'Failed to fetch savings goal' }, { status: 500 })
    }

    // Get contribution history
    const { data: contributions, error: contributionsError } = await supabase
      .from('savings_contributions')
      .select('*')
      .eq('savings_goal_id', id)
      .order('date', { ascending: false })

    // Calculate metrics
    const progress = (goal.current_amount / goal.target_amount) * 100
    const remaining = goal.target_amount - goal.current_amount
    const monthsToGoal = remaining > 0 && goal.monthly_contribution > 0
      ? Math.ceil(remaining / goal.monthly_contribution)
      : 0

    return NextResponse.json({
      ...goal,
      progress,
      remaining,
      months_to_goal: monthsToGoal,
      is_overdue: goal.deadline && new Date(goal.deadline) < new Date() && !goal.is_completed,
      contributions: contributions || [],
    })
  } catch (error) {
    console.error('Savings goal fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateSavingsGoalSchema.parse(body)

    // Verify savings goal exists and belongs to user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
    }

    // Update savings goal
    const { data: goal, error } = await supabase
      .from('savings_goals')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating savings goal:', error)
      return NextResponse.json({ error: 'Failed to update savings goal' }, { status: 500 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Savings goal update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = await params

    // Delete savings goal (this will cascade to contributions)
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting savings goal:', error)
      return NextResponse.json({ error: 'Failed to delete savings goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Savings goal deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/savings-goals/[id]/contribute - Add contribution to savings goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'contribute') {
      const body = await request.json()
      const validatedData = contributeSchema.parse(body)

      // Verify savings goal exists and belongs to user
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('id, current_amount')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !goal) {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
      }

      // Add contribution
      const { data: contribution, error: contributionError } = await supabase
        .from('savings_contributions')
        .insert({
          user_id: userId,
          savings_goal_id: id,
          amount: validatedData.amount,
          date: new Date().toISOString().split('T')[0],
          notes: validatedData.notes,
        })
        .select()
        .single()

      if (contributionError) {
        console.error('Error adding contribution:', contributionError)
        return NextResponse.json({ error: 'Failed to add contribution' }, { status: 500 })
      }

      // Update savings goal current amount
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: goal.current_amount + validatedData.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating savings goal amount:', updateError)
        return NextResponse.json({ error: 'Failed to update savings goal' }, { status: 500 })
      }

      return NextResponse.json(contribution, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Savings goal contribution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
