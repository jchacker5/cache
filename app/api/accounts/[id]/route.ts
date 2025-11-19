import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
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

    const { id } = params

    const account = await client.query(api.accounts.get, { id: id as any })
    if (!account || account.userId !== userId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get recent transactions for this account
    const transactions = await client.query(api.transactions.list, {
      userId,
      accountId: id,
      limit: 10,
    })

    return NextResponse.json({
      ...account,
      recent_transactions: transactions.transactions || [],
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

    const { id } = params
    const body = await request.json()

    // Validate input
    const validatedData = updateAccountSchema.parse(body)

    // Verify account exists and belongs to user
    const existingAccount = await client.query(api.accounts.get, { id: id as any })
    if (!existingAccount || existingAccount.userId !== userId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update account
    await client.mutation(api.accounts.update, {
      id: id as any,
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance,
      currency: validatedData.currency,
      institution: validatedData.institution,
      accountNumber: validatedData.account_number,
      lastFour: validatedData.last_four,
      isActive: validatedData.is_active,
    })

    const account = await client.query(api.accounts.get, { id: id as any })

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

    const { id } = params

    // Verify account exists and belongs to user
    const account = await client.query(api.accounts.get, { id: id as any })
    if (!account || account.userId !== userId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check if account has transactions
    const transactions = await client.query(api.transactions.list, {
      userId,
      accountId: id,
      limit: 1,
    })

    if (transactions.transactions && transactions.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions. Transfer or delete transactions first.' },
        { status: 400 }
      )
    }

    // Delete account
    await client.mutation(api.accounts.remove, { id: id as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
