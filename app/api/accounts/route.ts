import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['checking', 'savings', 'credit', 'investment']),
  balance: z.number().default(0),
  currency: z.string().default('USD'),
  institution: z.string().optional(),
  account_number: z.string().optional(),
  last_four: z.string().optional(),
  is_active: z.boolean().default(true),
})

const updateAccountSchema = createAccountSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    let query = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    if (type) {
      query = query.eq('type', type)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: accounts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Calculate additional metrics for each account
    const accountsWithMetrics = accounts.map(account => {
      // For credit accounts, balance represents debt (negative)
      const availableBalance = account.type === 'credit' ? account.balance : account.balance
      const isOverdrawn = account.type !== 'credit' && account.balance < 0

      return {
        ...account,
        available_balance: availableBalance,
        is_overdrawn: isOverdrawn,
      }
    })

    return NextResponse.json(accountsWithMetrics)
  } catch (error) {
    console.error('Accounts API error:', error)
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
    const validatedData = createAccountSchema.parse(body)

    // Create account
    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Account creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
