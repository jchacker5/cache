import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createSavingsGoalSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).default(0),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  monthly_contribution: z.number().min(0).default(0),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const completed = searchParams.get('completed')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    const goals = await client.query(api.savingsGoals.list, {
      userId,
      completed: completed ? completed as 'true' | 'false' : undefined,
      category: category || undefined,
      priority: priority ? priority as 'low' | 'medium' | 'high' : undefined,
    })

    return NextResponse.json(goals)
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

    const body = await request.json()

    // Validate input
    const validatedData = createSavingsGoalSchema.parse(body)

    // Create savings goal
    const goalId = await client.mutation(api.savingsGoals.create, {
      userId,
      name: validatedData.name,
      targetAmount: validatedData.target_amount,
      currentAmount: validatedData.current_amount,
      deadline: validatedData.deadline,
      priority: validatedData.priority,
      category: validatedData.category,
      monthlyContribution: validatedData.monthly_contribution,
      description: validatedData.description,
    })

    const goal = await client.query(api.savingsGoals.get, { id: goalId })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Savings goal creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
