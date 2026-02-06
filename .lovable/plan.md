

## Root Cause Analysis: Admin Role Not Applied

**Problem:** After logging in with `archangelsarva001@gmail.com`, the UI shows a regular user instead of admin.

**Root Cause:** The `user_roles` table still contains `role = 'user'` for this user. The previous role update was never successfully executed -- the database still has the old value.

**Why this happened:**
- The `user_roles` table has strict RLS policies: `UPDATE` uses `USING (false)`, meaning no direct updates are allowed through the normal API.
- Role changes are designed to go through the `update_user_role` RPC function, which itself checks that the caller is already an admin -- creating a chicken-and-egg problem for the first admin.
- The previous attempt to update the role did not complete.

**Fix:**
Run a database migration to directly update the role. Migrations execute as the database superadmin, bypassing all RLS policies.

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = 'a6c835b4-a822-4444-b0bc-ecf810b38378';
```

This is a one-line data fix. No schema changes or code modifications are needed. Once applied, the Header component's `checkAdminStatus` function will correctly detect the admin role via the `is_admin` and `get_user_role` RPC calls, and the full admin UI (User Management, Tool Dev, Manage Tools, Tool Approvals) will appear.

