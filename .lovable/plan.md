

# Rebuild Database Schema and Backend Logic

Since the original database was lost when Lovable Cloud replaced the external Supabase project, all tables, functions, triggers, and RLS policies need to be recreated. The frontend code is intact and tells us exactly what schema is needed.

---

## Step 1: Create Core Tables

### 1a. `users` table
- `id` (UUID, primary key, references auth.users)
- `email` (text, not null)
- `full_name` (text, nullable)
- `role` (text, default 'user' -- values: 'admin', 'moderator', 'user')
- `is_active` (boolean, default true)
- `is_subscribed` (boolean, default false)
- `stripe_customer_id` (text, nullable)
- `created_at` (timestamptz, default now())

### 1b. `credits` table
- `id` (UUID, primary key, default gen_random_uuid())
- `user_id` (UUID, not null, references auth.users, unique)
- `current_credits` (integer, default 0)
- `total_purchased` (integer, default 0)
- `last_purchase_date` (timestamptz, nullable)
- `last_updated` (timestamptz, default now())

### 1c. `ai_tools` table
- `id` (UUID, primary key, default gen_random_uuid())
- `name` (text, not null)
- `description` (text, not null)
- `category` (text, not null)
- `credit_cost` (integer, default 1)
- `input_fields` (jsonb, default '[]')
- `icon_url` (text, nullable)
- `webhook_url` (text, nullable)
- `output_type` (text, default 'smart')
- `is_active` (boolean, default true)
- `approval_status` (text, default 'pending')
- `reviewed_at` (timestamptz, nullable)
- `reviewed_by` (UUID, nullable)
- `created_at` (timestamptz, default now())

### 1d. `tool_usages` table
- `id` (UUID, primary key, default gen_random_uuid())
- `user_id` (UUID, not null, references auth.users)
- `tool_id` (UUID, not null, references ai_tools)
- `input_data` (jsonb, nullable)
- `webhook_response` (jsonb, nullable)
- `credits_deducted` (integer, default 0)
- `used_at` (timestamptz, default now())

### 1e. `audit_logs` table
- `id` (UUID, primary key, default gen_random_uuid())
- `user_id` (UUID, not null)
- `action` (text, not null)
- `resource_type` (text, nullable)
- `resource_id` (text, nullable)
- `old_values` (jsonb, nullable)
- `new_values` (jsonb, nullable)
- `created_at` (timestamptz, default now())

---

## Step 2: Create Database Functions (RPCs)

### 2a. `get_user_role(_user_id UUID)` returns text
Returns the role from the users table, defaulting to 'user'.

### 2b. `is_admin(_user_id UUID)` returns boolean
Returns true if the user's role is 'admin'.

### 2c. `get_user_credits(_user_id UUID)` returns integer
Returns current_credits from credits table. Returns 999999 (unlimited) for admin users.

### 2d. `update_user_role(_target_user_id UUID, _new_role text)` returns boolean
Updates a user's role. Only callable by admins (enforced via security definer + check).

### 2e. `toggle_user_status(_user_id UUID, _is_active boolean)` returns boolean
Toggles a user's active status.

---

## Step 3: Create Trigger for Auto-Creating User Records

A trigger on `auth.users` insert that automatically:
- Creates a row in `users` table with the new user's id, email, and full_name from metadata
- Creates a row in `credits` table with default 0 credits

This uses a `SECURITY DEFINER` function on the `public` schema triggered after insert on `auth.users`.

---

## Step 4: Set Up Row Level Security (RLS)

### `users` table
- SELECT: Users can read their own row; admins can read all
- UPDATE: Users can update their own row (limited fields); admins can update all
- INSERT: Only via trigger (service role)

### `credits` table
- SELECT: Users can read their own credits
- UPDATE: Service role only (edge functions handle updates)

### `ai_tools` table
- SELECT: Anyone authenticated can read active tools; admins/moderators can read all
- INSERT: Admins and moderators can insert
- UPDATE: Admins and moderators can update
- DELETE: Admins can delete

### `tool_usages` table
- SELECT: Users can read their own usage
- INSERT: Authenticated users can insert their own usage

### `audit_logs` table
- SELECT: Admins only
- INSERT: Service role only (via edge functions)

---

## Step 5: Deploy and Verify Edge Functions

All 6 existing edge functions will be redeployed. They should work once the tables and functions exist:
- `admin-users`
- `check-subscription`
- `create-checkout`
- `customer-portal`
- `purchase-credits`
- `verify-payment`

---

## Step 6: Create Initial Admin User Record

After tables are created, the first user who signs up (or the owner email `archangelsarva001@gmail.com` referenced in code) should be assigned the 'admin' role manually or via a seed migration.

---

## Technical Notes

- All database changes will be done via SQL migrations
- The `users` table uses `id` that matches `auth.users.id` but without a foreign key constraint (per Lovable Cloud guidelines)
- RLS policies will use `auth.uid()` for row-level access control
- The `get_user_credits` function returns 999999 for admins to give them unlimited credits (matching existing frontend logic)
- Edge functions already have STRIPE_SECRET_KEY configured in secrets

