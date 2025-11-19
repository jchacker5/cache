-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit', 'investment');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE insight_type AS ENUM ('spending_pattern', 'budget_recommendation', 'anomaly_detection', 'savings_opportunity');

-- Users table (extends Clerk user data)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- Default categories (will be inserted for new users)
CREATE TABLE default_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  institution TEXT,
  account_number TEXT,
  last_four TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  merchant TEXT,
  amount DECIMAL(15,2) NOT NULL,
  type transaction_type NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,
  tags TEXT[],
  ai_categorized BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period budget_period DEFAULT 'monthly',
  spent DECIMAL(15,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold DECIMAL(3,2) DEFAULT 0.9, -- Alert when 90% spent
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, category_id, period, start_date)
);

-- Savings goals table
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  category TEXT, -- 'emergency', 'major_purchase', 'lifestyle', 'education', etc.
  monthly_contribution DECIMAL(15,2),
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Savings contributions table
CREATE TABLE savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type insight_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  confidence DECIMAL(3,2),
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Query History
CREATE TABLE ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO default_categories (name, icon, color) VALUES
  ('Food & Dining', 'utensils', '#3b82f6'),
  ('Transportation', 'car', '#8b5cf6'),
  ('Shopping', 'shopping-cart', '#ec4899'),
  ('Bills & Utilities', 'home', '#f59e0b'),
  ('Entertainment', 'tv', '#10b981'),
  ('Healthcare', 'heart', '#ef4444'),
  ('Income', 'dollar-sign', '#22c55e'),
  ('Transfer', 'arrow-right-left', '#6b7280'),
  ('Other', 'more-horizontal', '#9ca3af');

-- Create indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_id);
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_ai_insights_user_type ON ai_insights(user_id, type);
CREATE INDEX idx_ai_queries_user ON ai_queries(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Accounts policies
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Savings goals policies
CREATE POLICY "Users can view their own savings goals" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals" ON savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals" ON savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Savings contributions policies
CREATE POLICY "Users can view their own savings contributions" ON savings_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings contributions" ON savings_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings contributions" ON savings_contributions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings contributions" ON savings_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- AI Insights policies
CREATE POLICY "Users can view their own AI insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI insights" ON ai_insights
  FOR DELETE USING (auth.uid() = user_id);

-- AI Queries policies
CREATE POLICY "Users can view their own AI queries" ON ai_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI queries" ON ai_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for data consistency

-- Function to update budget spending
CREATE OR REPLACE FUNCTION update_budget_spending()
RETURNS TRIGGER AS $$
BEGIN
  -- Update budget spending when transactions are inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    UPDATE budgets
    SET spent = spent + NEW.amount,
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND category_id = NEW.category_id
      AND period = 'monthly'
      AND is_active = TRUE;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category change
    IF OLD.category_id != NEW.category_id THEN
      UPDATE budgets
      SET spent = spent - OLD.amount,
          updated_at = NOW()
      WHERE user_id = OLD.user_id
        AND category_id = OLD.category_id
        AND period = 'monthly'
        AND is_active = TRUE;

      UPDATE budgets
      SET spent = spent + NEW.amount,
          updated_at = NOW()
      WHERE user_id = NEW.user_id
        AND category_id = NEW.category_id
        AND period = 'monthly'
        AND is_active = TRUE;
    ELSE
      UPDATE budgets
      SET spent = spent - OLD.amount + NEW.amount,
          updated_at = NOW()
      WHERE user_id = NEW.user_id
        AND category_id = NEW.category_id
        AND period = 'monthly'
        AND is_active = TRUE;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE budgets
    SET spent = spent - OLD.amount,
        updated_at = NOW()
    WHERE user_id = OLD.user_id
      AND category_id = OLD.category_id
      AND period = 'monthly'
      AND is_active = TRUE;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update budget spending
CREATE TRIGGER update_budget_spending_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_budget_spending();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, is_default)
  SELECT NEW.id, name, icon, color, TRUE
  FROM default_categories;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default categories for new users
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE accounts
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE accounts
    SET balance = balance - OLD.amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE accounts
    SET balance = balance - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update account balance
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();
