import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
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

    const { id } = params

    const budget = await client.query(api.budgets.get, { id: id as any })
    if (!budget || budget.userId !== userId) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json(budget)
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

    const { id } = params
    const body = await request.json()

    // Validate input
    const validatedData = updateBudgetSchema.parse(body)

    // Verify budget exists and belongs to user
    const existingBudget = await client.query(api.budgets.get, { id: id as any })
    if (!existingBudget || existingBudget.userId !== userId) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Update budget
    await client.mutation(api.budgets.update, {
      id: id as any,
      name: validatedData.name,
      amount: validatedData.amount,
      period: validatedData.period,
      startDate: validatedData.start_date,
      endDate: validatedData.end_date,
      alertThreshold: validatedData.alert_threshold,
      isActive: validatedData.is_active,
    })

    const budget = await client.query(api.budgets.get, { id: id as any })

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

    const { id } = params

    // Verify budget exists and belongs to user
    const budget = await client.query(api.budgets.get, { id: id as any })
    if (!budget || budget.userId !== userId) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Delete budget
    await client.mutation(api.budgets.remove, { id: id as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
