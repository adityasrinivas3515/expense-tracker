# Ledgerly Expense Tracker

Ledgerly is a frontend-first personal finance app with branded Clerk authentication, local transaction storage, budget planning, analytics, and responsive views.

## Run in this workspace

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/ledgerly run dev
```

The project requires the automatically provisioned Clerk environment variables:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

Do not commit those values into source files. They are managed as workspace secrets.

## Auth routes

- `/` — public Ledgerly welcome page
- `/sign-in` — branded Clerk sign-in screen
- `/sign-up` — branded Clerk account creation screen
- `/user-portal` — authenticated finance dashboard

The finance routes are only available after sign-in. Sign out is available from the account card in the sidebar.

## Data storage

Transactions, budgets, and display currency remain in browser `localStorage`, as requested for the frontend-only tracker. Authentication is handled by Clerk.