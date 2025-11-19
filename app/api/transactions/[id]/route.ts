import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateTransactionSchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
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

    const supabase = createClient()
    const { id } = params

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(name, type, currency),
        categories(name, icon, color)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      console.error('Error fetching transaction:', error)
      return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
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

    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Validate input
    const validatedData = updateTransactionSchema.parse(body)

    // Verify transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // If account_id is being updated, verify it belongs to user
    if (validatedData.account_id) {
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', validatedData.account_id)
        .eq('user_id', userId)
        .single()

      if (accountError || !account) {
        return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
      }
    }

    // If category_id is being updated, verify it belongs to user
    if (validatedData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', validatedData.category_id)
        .eq('user_id', userId)
        .single()

      if (categoryError || !category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
    }

    // Update transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        accounts(name, type, currency),
        categories(name, icon, color)
      `)
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

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

    const supabase = createClient()
    const { id } = params

    // Delete transaction (this will also update budget spending via trigger)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting transaction:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
