import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createTransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  description: z.string().min(1),
  merchant: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  date: z.string(), // ISO date string
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const updateTransactionSchema = createTransactionSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const categoryFilter = searchParams.get('category')
    const accountFilter = searchParams.get('account')
    const typeFilter = searchParams.get('type')
    const searchQuery = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts(name, type, currency),
        categories(name, icon, color)
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)

    // Apply filters
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter)
    }

    if (accountFilter && accountFilter !== 'all') {
      query = query.eq('account_id', accountFilter)
    }

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }

    if (searchQuery) {
      query = query.or(`description.ilike.%${searchQuery}%,merchant.ilike.%${searchQuery}%`)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Transactions API error:', error)
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
    const validatedData = createTransactionSchema.parse(body)

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', validatedData.account_id)
      .eq('user_id', userId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
    }

    // If category is provided, verify it belongs to user
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

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        ...validatedData,
      })
      .select(`
        *,
        accounts(name, type, currency),
        categories(name, icon, color)
      `)
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Transaction creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
