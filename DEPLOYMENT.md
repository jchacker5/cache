# Deployment Guide for Cache App

## Prerequisites

Before deploying, ensure you have:

1. **Clerk Account** - For authentication
2. **Stripe Account** - For subscription billing
3. **Convex Account** - For backend and database
4. **Vercel Account** - For deployment

## Environment Variables Setup

### 1. Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or use existing
3. Copy the following keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 2. Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create products and prices:
   - **Basic Plan**: $20/month
   - **Pro Plan**: $50/month

3. Copy the price IDs and keys:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

4. Set up webhooks:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

5. Copy the webhook secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Convex Configuration

1. Install Convex CLI (if not already installed):
```bash
npm install -g convex
```

2. Initialize Convex in your project:
```bash
npx convex dev
```

This will:
- Prompt you to log in with GitHub
- Create a Convex project
- Generate the Convex URL and save it to your `.env.local` file
- Start the Convex dev server to sync your functions

3. Copy the Convex URL to your environment variables:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

4. The schema and functions are already defined in the `convex/` directory. The dev server will automatically sync them to your Convex deployment.

## Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave default)

### 2. Environment Variables

Add all environment variables from the setup above in Vercel's Environment Variables section:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CONVEX_URL`

### 3. Domain Configuration

1. In Vercel project settings, add your custom domain
2. Update DNS records as instructed
3. Enable SSL (automatic)

### 4. Build & Deploy

1. Push your code to the main branch
2. Vercel will automatically build and deploy
3. Monitor the deployment in the Vercel dashboard

## Post-Deployment Checklist

### Authentication
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Protected routes redirect properly
- [ ] User profiles are created

### Billing
- [ ] Stripe webhooks are receiving events
- [ ] Subscription creation works
- [ ] Trial period starts correctly
- [ ] Payment processing works
- [ ] Billing page shows correct information

### Database
- [ ] User data is being stored
- [ ] Transactions are saved
- [ ] All CRUD operations work

### General
- [ ] App loads without errors
- [ ] Mobile responsiveness works
- [ ] All pages are accessible
- [ ] Performance is acceptable

## Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor page views and performance

### Stripe Dashboard
- Monitor subscription metrics
- Track failed payments
- Review webhook delivery

### Error Tracking
- Consider adding Sentry or similar for error tracking

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Ensure all dependencies are installed
   - Check for TypeScript errors

2. **Authentication Issues**
   - Verify Clerk keys are correct
   - Check middleware configuration
   - Ensure callback URLs are set in Clerk

3. **Payment Issues**
   - Verify Stripe keys and price IDs
   - Check webhook endpoint is correct
   - Test webhook delivery in Stripe dashboard

4. **Database Issues**
   - Ensure Convex project is active
   - Check Convex dashboard for function errors
   - Verify NEXT_PUBLIC_CONVEX_URL is set correctly
   - Run `npx convex dev` to sync functions

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Stripe webhook logs
3. Check browser console for client-side errors
4. Contact support@cacheapp.com
