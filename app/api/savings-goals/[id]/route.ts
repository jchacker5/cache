import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
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

    const { id } = await params

    const goal = await client.query(api.savingsGoals.get, { id: id as any })
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
    }

    return NextResponse.json(goal)
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

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateSavingsGoalSchema.parse(body)

    // Verify savings goal exists and belongs to user
    const existingGoal = await client.query(api.savingsGoals.get, { id: id as any })
    if (!existingGoal || existingGoal.userId !== userId) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
    }

    // Update savings goal
    await client.mutation(api.savingsGoals.update, {
      id: id as any,
      name: validatedData.name,
      targetAmount: validatedData.target_amount,
      currentAmount: validatedData.current_amount,
      deadline: validatedData.deadline,
      priority: validatedData.priority,
      category: validatedData.category,
      monthlyContribution: validatedData.monthly_contribution,
      description: validatedData.description,
      isCompleted: validatedData.is_completed,
    })

    const goal = await client.query(api.savingsGoals.get, { id: id as any })

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

    const { id } = await params

    // Verify savings goal exists and belongs to user
    const goal = await client.query(api.savingsGoals.get, { id: id as any })
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
    }

    // Delete savings goal
    await client.mutation(api.savingsGoals.remove, { id: id as any })

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

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'contribute') {
      const body = await request.json()
      const validatedData = contributeSchema.parse(body)

      // Verify savings goal exists and belongs to user
      const goal = await client.query(api.savingsGoals.get, { id: id as any })
      if (!goal || goal.userId !== userId) {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 })
      }

      // Add contribution
      await client.mutation(api.savingsGoals.addContribution, {
        goalId: id as any,
        userId,
        amount: validatedData.amount,
        date: new Date().toISOString().split('T')[0],
        notes: validatedData.notes,
      })

      const updatedGoal = await client.query(api.savingsGoals.get, { id: id as any })

      return NextResponse.json(updatedGoal, { status: 201 })
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
