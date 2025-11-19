import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateTransactionSchema = z.object({
  account_id: z.string().optional(),
  category_id: z.string().optional(),
  description: z.string().min(1).optional(),
  merchant: z.string().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
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

    const transaction = await client.query(api.transactions.get, { id: id as any })
    if (!transaction || transaction.userId !== userId) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction fetch error:', error)
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
    const validatedData = updateTransactionSchema.parse(body)

    // Verify transaction exists and belongs to user
    const existingTransaction = await client.query(api.transactions.get, { id: id as any })
    if (!existingTransaction || existingTransaction.userId !== userId) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // If account_id is being updated, verify it belongs to user
    if (validatedData.account_id) {
      const account = await client.query(api.accounts.get, { id: validatedData.account_id as any })
      if (!account || account.userId !== userId) {
        return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
      }
    }

    // If category_id is being updated, verify it belongs to user
    if (validatedData.category_id) {
      const category = await client.query(api.categories.get, { id: validatedData.category_id as any })
      if (!category || category.userId !== userId) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
    }

    // Update transaction
    await client.mutation(api.transactions.update, {
      id: id as any,
      accountId: validatedData.account_id,
      categoryId: validatedData.category_id,
      description: validatedData.description,
      merchant: validatedData.merchant,
      amount: validatedData.amount ? (validatedData.type === 'expense' ? -validatedData.amount : validatedData.amount) : undefined,
      type: validatedData.type,
      date: validatedData.date,
      notes: validatedData.notes,
      tags: validatedData.tags,
    })

    const transaction = await client.query(api.transactions.get, { id: id as any })

    return NextResponse.json(transaction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Transaction update error:', error)
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

    // Verify transaction exists and belongs to user
    const transaction = await client.query(api.transactions.get, { id: id as any })
    if (!transaction || transaction.userId !== userId) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Delete transaction
    await client.mutation(api.transactions.remove, { id: id as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
