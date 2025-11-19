import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  cancelSubscription,
  resumeSubscription,
  updateSubscriptionPrice,
  getPriceIdFromTier
} from '@/lib/stripe'

// POST /api/subscriptions/manage - Manage subscription (cancel, resume, upgrade)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, subscriptionId, newTier } = body

    if (!action || !['cancel', 'resume', 'upgrade'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscriptionId)
        break

      case 'resume':
        result = await resumeSubscription(subscriptionId)
        break

      case 'upgrade':
        if (!newTier || !['basic', 'pro'].includes(newTier)) {
          return NextResponse.json({ error: 'Invalid new tier' }, { status: 400 })
        }
        const newPriceId = getPriceIdFromTier(newTier as 'basic' | 'pro')
        result = await updateSubscriptionPrice(subscriptionId, newPriceId)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: result.id,
        status: result.status,
        cancelAtPeriodEnd: result.cancel_at_period_end,
        currentPeriodEnd: new Date(result.current_period_end * 1000).toISOString(),
      }
    })
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}
