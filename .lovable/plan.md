

## Add Sidebar Layout for Authenticated Pages

This plan creates a `DashboardLayout` component using the existing shadcn `Sidebar` and wraps the authenticated routes (`/dashboard`, `/settings`, `/usage`) with it. Navigation links currently in `Header.tsx` will be moved into the sidebar, and the Header will be simplified for authenticated pages.

---

### 1. Create `src/layouts/DashboardLayout.tsx`

A new layout component that:
- Uses `SidebarProvider` wrapping the entire layout
- Renders a `Sidebar` (collapsible, icon mode) with navigation links:
  - **Main group:** Dashboard (`/dashboard`), Usage (`/usage`)
  - **Settings group** (visible to all): Profile Settings (`/settings?tab=profile`)
  - **Admin group** (visible to admin/moderator): User Management, Tool Dev, Manage Tools, Tool Approvals (all `/settings?tab=...`)
- Includes a `SidebarHeader` with the AutoHub logo/branding
- Includes a `SidebarFooter` with Sign Out button and ThemeToggle
- Uses `useLocation` to highlight the active route
- Fetches admin/moderator status via the same `supabase.rpc` calls currently in `Header.tsx`
- Renders a top bar with `SidebarTrigger` (for toggling) and the credits Badge (with `font-mono`)
- Uses `Outlet` from react-router-dom to render child route content in the main area
- Applies `bg-noise` class to the main content wrapper for texture

### 2. Update `src/App.tsx`

- Import `DashboardLayout`
- Wrap `/dashboard`, `/settings`, and `/usage` in a parent `<Route>` with `element={<DashboardLayout />}`:

```text
<Route element={<DashboardLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/usage" element={<Usage />} />
</Route>
```

### 3. Update `src/pages/Dashboard.tsx`

- Remove the `<Header user={user} />` import and usage (the layout now provides navigation)
- The page content stays as-is but without the Header wrapper

### 4. Update `src/pages/Settings.tsx`

- Remove the back button (sidebar provides navigation)
- Remove redundant wrapper div structure since the layout handles the outer shell

### 5. Update `src/pages/Usage.tsx`

- Remove the "Back to Dashboard" button (sidebar provides navigation)
- Remove standalone page wrapper since the layout handles it

### 6. Simplify `src/components/Header.tsx`

- Remove the authenticated-user navigation links (Dashboard, Usage, Settings dropdown) since they now live in the sidebar
- Keep only: logo, ThemeToggle, and unauthenticated links (Features, Pricing, Sign In, Get Started)
- The Header continues to be used on public pages (`/`, `/auth`, `/features`, etc.)

---

### Summary of Files

| File | Action |
|------|--------|
| `src/layouts/DashboardLayout.tsx` | **Create** -- SidebarProvider + Sidebar + Outlet layout |
| `src/App.tsx` | **Edit** -- Wrap auth routes in DashboardLayout |
| `src/pages/Dashboard.tsx` | **Edit** -- Remove Header usage |
| `src/pages/Settings.tsx` | **Edit** -- Remove back button, simplify wrapper |
| `src/pages/Usage.tsx` | **Edit** -- Remove back button, simplify wrapper |
| `src/components/Header.tsx` | **Edit** -- Remove authenticated nav links, keep public-only |

