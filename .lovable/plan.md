

## Make User Admin

**Goal:** Promote the user `archangelsarva001@gmail.com` (ID: `a6c835b4-a822-4444-b0bc-ecf810b38378`) from `user` role to `admin`.

**What will be done:**
- Update the existing role record in the `user_roles` table from `user` to `admin` for this user.

**Technical detail:**
- Execute the following SQL via a data operation:
```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = 'a6c835b4-a822-4444-b0bc-ecf810b38378';
```

This is a single data update -- no schema changes or code modifications are needed.

