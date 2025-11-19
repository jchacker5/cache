import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['checking', 'savings', 'credit', 'investment']).optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
  institution: z.string().optional(),
  account_number: z.string().optional(),
  last_four: z.string().optional(),
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

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }
      console.error('Error fetching account:', error)
      return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
    }

    // Get recent transactions for this account
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        type,
        date,
        categories(name, icon, color)
      `)
      .eq('account_id', id)
      .order('date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      ...account,
      recent_transactions: transactions || [],
    })
  } catch (error) {
    console.error('Account fetch error:', error)
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
    const validatedData = updateAccountSchema.parse(body)

    // Verify account exists and belongs to user
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update account
    const { data: account, error } = await supabase
      .from('accounts')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
    }

    return NextResponse.json(account)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Account update error:', error)
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

    // Check if account has transactions
    const { data: transactions, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', id)
      .eq('user_id', userId)
      .limit(1)

    if (checkError) {
      console.error('Error checking for transactions:', checkError)
      return NextResponse.json({ error: 'Failed to check account' }, { status: 500 })
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions. Transfer or delete transactions first.' },
        { status: 400 }
      )
    }

    // Delete account
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting account:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
