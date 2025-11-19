# Testing Checklist for Convex Migration

## Pre-Testing Setup

1. ✅ Convex project initialized (`npx convex dev`)
2. ✅ Environment variable `NEXT_PUBLIC_CONVEX_URL` set in `.env.local`
3. ✅ Convex schema deployed (all tables and indexes created)
4. ✅ All Convex functions synced

## API Routes Testing

### Accounts API (`/api/accounts`)
- [ ] GET `/api/accounts` - List all accounts
- [ ] GET `/api/accounts?type=checking` - Filter by type
- [ ] GET `/api/accounts?activeOnly=false` - Include inactive
- [ ] POST `/api/accounts` - Create new account
- [ ] GET `/api/accounts/[id]` - Get single account
- [ ] PUT `/api/accounts/[id]` - Update account
- [ ] DELETE `/api/accounts/[id]` - Delete account (with no transactions)

### Transactions API (`/api/transactions`)
- [ ] GET `/api/transactions` - List transactions with pagination
- [ ] GET `/api/transactions?category=cat_id` - Filter by category
- [ ] GET `/api/transactions?account=acc_id` - Filter by account
- [ ] GET `/api/transactions?type=expense` - Filter by type
- [ ] GET `/api/transactions?search=coffee` - Search transactions
- [ ] GET `/api/transactions?startDate=2024-01-01&endDate=2024-12-31` - Date range
- [ ] POST `/api/transactions` - Create transaction (updates account balance)
- [ ] GET `/api/transactions/[id]` - Get single transaction
- [ ] PUT `/api/transactions/[id]` - Update transaction (updates balances)
- [ ] DELETE `/api/transactions/[id]` - Delete transaction (updates balance)

### Budgets API (`/api/budgets`)
- [ ] GET `/api/budgets` - List budgets
- [ ] GET `/api/budgets?period=monthly` - Filter by period
- [ ] GET `/api/budgets?activeOnly=true` - Filter active budgets
- [ ] POST `/api/budgets` - Create budget
- [ ] GET `/api/budgets/[id]` - Get single budget with spending
- [ ] PUT `/api/budgets/[id]` - Update budget
- [ ] DELETE `/api/budgets/[id]` - Delete budget

### Categories API (`/api/categories`)
- [ ] GET `/api/categories` - List categories (creates defaults if none exist)

### Savings Goals API (`/api/savings-goals`)
- [ ] GET `/api/savings-goals` - List savings goals
- [ ] GET `/api/savings-goals?completed=false` - Filter incomplete
- [ ] GET `/api/savings-goals?priority=high` - Filter by priority
- [ ] POST `/api/savings-goals` - Create savings goal
- [ ] GET `/api/savings-goals/[id]` - Get goal with contributions
- [ ] PUT `/api/savings-goals/[id]` - Update goal
- [ ] DELETE `/api/savings-goals/[id]` - Delete goal
- [ ] POST `/api/savings-goals/[id]?action=contribute` - Add contribution

### AI APIs
- [ ] POST `/api/ai/query` - Query AI with financial context
- [ ] GET `/api/ai/insights` - Get AI insights
- [ ] GET `/api/ai/insights?type=spending_pattern` - Filter insights

## Frontend Pages Testing

### Dashboard (`/dashboard`)
- [ ] Page loads without errors
- [ ] Metrics display correctly (balance, income, expenses)
- [ ] Recent transactions show
- [ ] Budgets display with spending
- [ ] AI query interface works
- [ ] Data refreshes when new transactions added

### Transactions Page (`/dashboard/transactions`)
- [ ] Transactions list loads
- [ ] Filters work (category, account, type, search)
- [ ] Pagination works
- [ ] Create transaction form works
- [ ] Edit transaction works
- [ ] Delete transaction works
- [ ] Account balance updates after transaction

### Accounts Page (`/dashboard/balance`)
- [ ] Accounts list loads
- [ ] Create account works
- [ ] Edit account works
- [ ] Delete account works (only if no transactions)
- [ ] Account balances display correctly

### Budgets Page (`/dashboard/budgets`)
- [ ] Budgets list loads with spending
- [ ] Create budget works
- [ ] Edit budget works
- [ ] Delete budget works
- [ ] Budget progress bars display correctly

### Savings Goals Page (`/dashboard/savings`)
- [ ] Savings goals list loads
- [ ] Create goal works
- [ ] Add contribution works
- [ ] Progress tracking works
- [ ] Edit goal works
- [ ] Delete goal works

### Reports Page (`/dashboard/reports`)
- [ ] Reports load with transaction data
- [ ] Charts display correctly
- [ ] AI insights load

## Data Integrity Tests

- [ ] Creating transaction updates account balance
- [ ] Updating transaction updates both old and new account balances
- [ ] Deleting transaction updates account balance
- [ ] Budget spending calculated correctly from transactions
- [ ] Savings goal contributions update goal amount
- [ ] Categories created automatically for new users
- [ ] User sync works when signing in with Clerk

## Error Handling

- [ ] Unauthorized requests return 401
- [ ] Invalid data returns 400 with error details
- [ ] Missing resources return 404
- [ ] Server errors return 500
- [ ] Network errors handled gracefully in frontend

## Performance

- [ ] API routes respond in < 500ms
- [ ] Large transaction lists paginate correctly
- [ ] Dashboard loads in < 2s
- [ ] No memory leaks in long-running sessions

## Convex-Specific Tests

- [ ] All queries use proper indexes
- [ ] Mutations are atomic
- [ ] Data persists across page refreshes
- [ ] Real-time updates work (if implemented)
- [ ] Convex dashboard shows all functions
- [ ] No errors in Convex function logs

