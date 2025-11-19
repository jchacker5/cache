# Cache - Smart Spending Management

A modern SaaS application for personal finance management with subscription billing.

## Features

- **Dashboard**: Real-time financial metrics and insights
- **Transactions**: Track income and expenses with categorization
- **Budgets**: Set spending limits and monitor progress
- **Balance**: Account management and net worth tracking
- **Savings Goals**: Track progress toward financial goals
- **Reports**: Advanced analytics and spending trends
- **Subscription Billing**: Basic ($20/mo) and Pro ($50/mo) tiers with 14-day free trial

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui, Radix UI
- **Authentication**: Clerk
- **Payments**: Stripe
- **Charts**: Recharts
- **Backend & Database**: Convex
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Stripe account
- Clerk account
- Convex account (for backend and database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cache
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure environment variables (see Environment Setup below)

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

Create a `.env.local` file with the following variables:

### Clerk Authentication
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Stripe Billing
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Convex Backend
```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Database Setup

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

3. The schema and functions are already defined in the `convex/` directory. The dev server will automatically sync them to your Convex deployment.

## Stripe Setup

1. Create a Stripe account
2. Create products and prices:
   - Basic Plan: $20/month
   - Pro Plan: $50/month
3. Copy the price IDs to your environment variables
4. Set up webhook endpoint at `/api/webhooks/stripe` for events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Clerk Setup

1. Create a Clerk application
2. Configure authentication providers (email/password, Google, etc.)
3. Copy the publishable and secret keys to environment variables
4. Configure the sign-in/sign-up URLs in Clerk dashboard

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Deploy

### Production Checklist

- [ ] Environment variables configured
- [ ] Stripe webhooks set up
- [ ] Clerk application configured
- [ ] Convex project created and deployed
- [ ] Domain configured (if custom)
- [ ] SSL certificate enabled
- [ ] Monitoring and analytics set up

## Subscription Tiers

### Basic ($20/month)
- Up to 5 accounts
- Transaction tracking
- Budget management
- Basic reports
- Mobile access

### Pro ($50/month)
- Unlimited accounts
- Advanced analytics
- CSV/PDF exports
- Priority support
- All Basic features

## API Routes

### Authentication (Clerk)
- Automatic session management
- Protected routes via middleware

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get subscription status
- `POST /api/subscriptions/manage` - Manage subscription

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Structure

```
app/
├── dashboard/          # Protected dashboard pages
├── pricing/           # Pricing page
├── api/               # API routes
├── globals.css        # Global styles
└── layout.tsx         # Root layout

components/
├── ui/                # Shadcn/ui components
└── providers/         # Context providers

lib/
├── stripe.ts          # Stripe utilities
├── data-service.ts    # Mock data service
└── supabase/          # Supabase configuration

supabase/
└── migrations/        # Database migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@cacheapp.com or join our Discord community.
