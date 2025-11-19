import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/convex/server'
import { api } from '@/convex/_generated/api'
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

    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const accounts = await client.query(api.accounts.list, {
      userId,
      type: type ? type as 'checking' | 'savings' | 'credit' | 'investment' : undefined,
      activeOnly: activeOnly,
    })

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

    const body = await request.json()

    // Validate input
    const validatedData = createAccountSchema.parse(body)

    // Create account
    const accountId = await client.mutation(api.accounts.create, {
      userId,
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance,
      currency: validatedData.currency,
      institution: validatedData.institution,
      accountNumber: validatedData.account_number,
      lastFour: validatedData.last_four,
      isActive: validatedData.is_active,
    })

    const account = await client.query(api.accounts.get, { id: accountId })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Account creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
