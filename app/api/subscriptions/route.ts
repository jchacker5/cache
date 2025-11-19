import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  createStripeCustomer,
  createSubscription,
  getTierFromPriceId,
  getPriceIdFromTier,
  BASIC_PRICE_ID,
  PRO_PRICE_ID
} from '@/lib/stripe'

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier } = body

    if (!tier || !['basic', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get user info from Clerk
    const { user } = await auth()

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Create Stripe customer
    const customer = await createStripeCustomer(userId, user.primaryEmailAddress.emailAddress)

    // Create subscription
    const priceId = tier === 'basic' ? BASIC_PRICE_ID : PRO_PRICE_ID
    const subscription = await createSubscription(customer.id, priceId, 14) // 14-day trial

    // Return client secret for payment confirmation
    const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// GET /api/subscriptions - Get current user's subscription
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real app, you'd fetch from your database
    // For now, return a mock response
    return NextResponse.json({
      status: 'trialing',
      tier: 'basic',
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
