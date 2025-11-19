import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createTransactionSchema = z.object({
  account_id: z.string(),
  category_id: z.string().optional(),
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

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const categoryFilter = searchParams.get('category')
    const accountFilter = searchParams.get('account')
    const typeFilter = searchParams.get('type')
    const searchQuery = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const result = await client.query(api.transactions.list, {
      userId,
      page,
      limit,
      categoryId: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
      accountId: accountFilter && accountFilter !== 'all' ? accountFilter : undefined,
      type: typeFilter && typeFilter !== 'all' ? typeFilter as 'income' | 'expense' | 'transfer' : undefined,
      searchQuery: searchQuery || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    })

    return NextResponse.json(result)
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

    const body = await request.json()

    // Validate input
    const validatedData = createTransactionSchema.parse(body)

    // Verify account belongs to user
    const account = await client.query(api.accounts.get, { id: validatedData.account_id as any })
    if (!account || account.userId !== userId) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
    }

    // If category is provided, verify it belongs to user
    if (validatedData.category_id) {
      const category = await client.query(api.categories.get, { id: validatedData.category_id as any })
      if (!category || category.userId !== userId) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
    }

    // Create transaction
    const transactionId = await client.mutation(api.transactions.create, {
      userId,
      accountId: validatedData.account_id,
      categoryId: validatedData.category_id,
      description: validatedData.description,
      merchant: validatedData.merchant,
      amount: validatedData.type === 'expense' ? -validatedData.amount : validatedData.amount,
      type: validatedData.type,
      date: validatedData.date,
      notes: validatedData.notes,
      tags: validatedData.tags,
    })

    // Fetch the created transaction with relations
    const transaction = await client.query(api.transactions.get, { id: transactionId })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Transaction creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
