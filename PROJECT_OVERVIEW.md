# AI Reminder Web App — Project Overview

## 1. High-level architecture

This is a Next.js 16 app using the App Router. The project contains:
- `app/` — page and API route definitions
- `components/` — reusable UI components
- `lib/` — frontend helpers and utilities
- `utility/` — general backend helper modules
- `app/api/` — server-side API routes used by the client
- `.env` / Vercel env vars — runtime configuration for auth, DB, and redirects

## 2. Authentication flow

### Manual auth
- `app/api/auth/signup/route.ts`
  - Creates a new user in the database
  - Hashes the password with bcrypt
  - Returns a JWT token on successful signup

- `app/api/auth/login/route.ts`
  - Verifies email and password
  - Checks the stored password hash using bcrypt
  - Returns a JWT token and user info on success

- `components/ui/LoginForm.tsx`
  - Submits email/password to `/api/auth/login`
  - Stores the returned JWT token in `localStorage`
  - Saves the display username locally

- `components/ui/SignUpForm.tsx`
  - Submits signup data to `/api/auth/signup`
  - Stores the returned token and user info afterwards

### Google OAuth auth
- `app/api/auth/google/start/route.ts`
  - Builds the Google OAuth authorization URL
  - Uses `GOOGLE_CLIENT_ID` from env
  - Redirects the browser to Google
  - Sets a state cookie for CSRF protection

- `app/api/auth/google/callback/route.ts`
  - Receives `code` and `state` from Google
  - Validates the state cookie
  - Exchanges the OAuth code for an access token
  - Fetches Google user info (`email`, `name`)
  - Finds or creates a local user by email
  - Signs a JWT token for your app
  - Redirects to `/lists?token=...&username=...`

- `app/lists/page.tsx`
  - Reads `token` and `username` from URL after Google redirect
  - Stores them in `localStorage`
  - Reloads or continues to show the authenticated dashboard

## 3. Main dashboard flow

### `app/lists/page.tsx`
- This is the main logged-in page for task management.
- It uses `useListsState()` from `app/lists/useListsStates.ts`.
- It checks local auth state and redirects to `/` if not authenticated.

### `app/lists/useListsStates.ts`
- Central dashboard state hook for:
  - sidebar lists
  - active list context
  - tasks
  - new task entry
  - loading states
- It loads lists from `/api/lists` using the stored JWT token.
- It also fetches tasks for the selected list.
- It caches lists locally and falls back to cached data if the network fails.

## 4. Data/routes overview

### List and task APIs
- `app/api/lists/route.ts`
  - GET: returns all lists the user owns or shares
  - POST: creates a new list for the authenticated user

- `app/api/lists/[listId]/route.ts`
  - Handles task updates inside a specific list context

- `app/api/lists/[listId]/permissions/route.ts`
  - Manages sharing and permissions for topic lists

- `app/api/tasks/route.ts`
  - Creates new tasks under the active list

- `app/api/tasks/[id]/route.ts`
  - Updates a single task by task ID

- `app/api/tasks/[id]/complete/route.ts`
  - Marks an existing task as completed

- `app/api/tasks/reset/route.ts`
  - Resets server-side task state or local cached tasks

### User/profile APIs
- `app/api/users/[userId]/route.ts`
  - Returns user profile data based on JWT and user ID

### Friends and reports
- `app/api/friends/route.ts`
  - Fetches the current user’s friends list or collaboration list

- `app/api/friends/requests/route.ts`
  - Fetches pending friend/collaboration requests

- `app/api/reports/route.ts`
  - Generates or retrieves report data for the current user

## 5. Frontend structure

### Pages
- `app/(auth)/page.tsx` — login page
- `app/(auth)/signup/page.tsx` — signup page
- `app/(auth)/forgot-password/page.tsx` — forgot password page
- `app/(auth)/reset-password/page.tsx` — reset password page
- `app/lists/page.tsx` — main task dashboard
- `app/friends/page.tsx` — friends page
- `app/groups/page.tsx` — shared groups page
- `app/reports/page.tsx` — report cards page

### UI components
- `components/ui/AuthLayout.tsx` — wraps auth pages in a centered layout
- `components/ui/ToastProvider.tsx` — shows toast notifications
- `components/ui/LoginForm.tsx` — login form UI and logic
- `components/ui/SignUpForm.tsx` — signup form UI and logic

### Task list components
- `components/tasks/ListSidebar.tsx` — the left sidebar with list navigation
- `components/tasks/TaskCard.tsx` — renders single task details
- `components/tasks/TaskEditor.tsx` — task edit/create form
- `components/tasks/AiMenu.tsx` — AI/insights menu UI
- `components/tasks/AnimatedTaskCard.tsx` — animated card UI for tasks

### Misc components
- `components/UserGreeting.tsx` — displays welcome greeting
- `components/reports/ReportCards.tsx` — report summary card UI
- `components/lists/ShareListModal.tsx` — share list dialog
- `components/lists/CollaboratorsModal.tsx` — collaborator invite dialog
- `components/friends/FriendsPage.tsx` — friends list page UI

## 6. Helper libraries

### `lib/prisma.ts`
- Provides a Prisma client instance for DB access
- Centralized database connection handling

### `lib/localSync.ts`
- Syncs locally cached tasks to the server
- Helps preserve offline updates when the user regains connectivity

### `lib/taskCategory.ts`
- Categorizes task titles into semantic categories

### `lib/taskScheduler.ts`
- Creates scheduled task reminders or resets

### `lib/taskReset.ts`
- Supports task reset logic and automation

### `lib/analytics.ts`
- Tracks app usage or analytics events

### `lib/localization.ts`
- Contains locale names / translations used in the UI

## 7. Environment and deployment

Important env vars used by the app:
- `DATABASE_URL` — database connection string
- `JWT_SECRET` — secret used to sign JWT tokens
- `GROQ_API_KEY` — third-party API key for reports or analytics
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth secret
- `GOOGLE_REDIRECT_URI` — app callback URL for Google
- `GOOGLE_OAUTH_SUCCESS_REDIRECT` — where to send users after successful login
- `NEXT_PUBLIC_APP_URL` — base URL used by the app

> On Vercel, env vars are configured in the project dashboard and take precedence over `.env`.

## 8. How auth works end-to-end

1. User clicks `Login with Google`.
2. The browser hits `/api/auth/google/start`.
3. The server redirects to Google OAuth with a callback URI.
4. Google sends the user back to `/api/auth/google/callback`.
5. The callback route exchanges the Google code for an access token.
6. The app fetches the Google user profile and finds/creates a local user.
7. A JWT token is signed and attached to the redirect URL.
8. The client page stores the JWT token and uses it for all future API requests.

## 9. What to focus on when learning

- Start with `app/api/auth/google/start/route.ts` and `.../callback/route.ts` to understand OAuth.
- Then read `app/api/auth/login/route.ts` and `app/api/auth/signup/route.ts` for local auth.
- Next, read `app/lists/page.tsx` + `app/lists/useListsStates.ts` for the authenticated dashboard.
- Finally, scan `app/api/lists/route.ts` and `components/tasks/*` for how lists and tasks are created and displayed.

## 10. Learning tip

When explaining the project:
- Describe user authentication first.
- Then explain token-based API access.
- Then explain how the dashboard loads lists and tasks.
- Mention the role of `localStorage` and JWT in keeping the session alive.

---

This file is a full project walkthrough to help you learn and explain the application quickly.
