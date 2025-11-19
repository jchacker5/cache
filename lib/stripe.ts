import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  }
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export function getBasicPriceId(): string {
  const id = process.env.STRIPE_BASIC_PRICE_ID
  if (!id) {
    throw new Error('STRIPE_BASIC_PRICE_ID is not set')
  }
  return id
}

export function getProPriceId(): string {
  const id = process.env.STRIPE_PRO_PRICE_ID
  if (!id) {
    throw new Error('STRIPE_PRO_PRICE_ID is not set')
  }
  return id
}

export const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID || ''
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || ''

export interface SubscriptionData {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  tier: 'basic' | 'pro'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export async function createStripeCustomer(userId: string, email: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    })

    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays: number = 14
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    return subscription
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function resumeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return subscription
  } catch (error) {
    console.error('Error resuming subscription:', error)
    throw error
  }
}

export async function updateSubscriptionPrice(subscriptionId: string, newPriceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Update the subscription item with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription price:', error)
    throw error
  }
}

export function getTierFromPriceId(priceId: string): 'basic' | 'pro' {
  const basicId = getBasicPriceId()
  const proId = getProPriceId()
  if (priceId === basicId) return 'basic'
  if (priceId === proId) return 'pro'
  throw new Error(`Unknown price ID: ${priceId}`)
}

export function getPriceIdFromTier(tier: 'basic' | 'pro'): string {
  if (tier === 'basic') return getBasicPriceId()
  if (tier === 'pro') return getProPriceId()
  throw new Error(`Unknown tier: ${tier}`)
}
