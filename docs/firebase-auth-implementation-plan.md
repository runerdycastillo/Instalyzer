# Firebase Auth Implementation Plan

Last updated: May 6, 2026

## Purpose

This document captures the recommended Firebase direction for Instalyzer authentication, account ownership, and future persistence.

The goal is to add real accounts without overbuilding the backend too early:

`Firebase Auth first, secure session cookies second, Firestore ownership third`

## Recommendation

Use Firebase as the account foundation.

Recommended Firebase services:

- Firebase Authentication for email/password and Google sign-in.
- Firebase Admin SDK for server-side token verification and secure session cookies.
- Cloud Firestore for user profiles, saved dataset metadata, and workspace ownership.
- Firebase Storage later only if the product intentionally stores raw export files or generated archives.

Avoid for the first implementation:

- Phone auth and SMS multi-factor auth, because SMS introduces separate billing and extra abuse controls.
- Enterprise Identity Platform features unless the app needs SAML, OIDC tenants, advanced audit logging, or organization accounts.
- Storing raw Instagram zip exports by default before privacy, retention, and deletion policies are fully designed.

Official references:

- Firebase Auth overview: https://firebase.google.com/docs/auth/
- Email/password auth: https://firebase.google.com/docs/auth/web/password-auth
- Google sign-in: https://firebase.google.com/docs/auth/web/google-signin
- Firebase Admin ID token verification: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firebase session cookies: https://firebase.google.com/docs/auth/admin/manage-cookies
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication

## Why Firebase Fits Instalyzer

Firebase is a good fit for the current product stage because:

- It gets us to production-ready sign-in faster than a custom auth system.
- It supports the basic providers we need: email/password and Google.
- It gives every user a stable `uid`, which maps naturally to saved datasets.
- Firestore security rules can enforce per-user ownership at the data layer.
- Firebase Admin lets Next.js verify user identity on the server before serving protected app data.
- The app can grow into profiles, billing metadata, saved datasets, and account settings without changing identity providers.

## Auth Architecture

Use Firebase Auth on the client, but do not rely on client-only auth for protected app behavior.

Recommended flow:

1. User signs in or signs up using Firebase client SDK.
2. Client retrieves the Firebase ID token from the signed-in user.
3. Client posts that ID token to a Next.js route handler, such as `POST /api/auth/session`.
4. Server verifies the ID token with Firebase Admin.
5. Server creates a secure Firebase session cookie.
6. Server returns success and the browser stores the `httpOnly` cookie.
7. Protected server routes and route handlers verify the session cookie before reading or writing user-owned data.
8. On sign out, the app clears the Firebase client session and calls a route handler to clear the server session cookie.

Recommended cookie properties:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: "lax"`
- scoped to the app path
- short enough to be safe, long enough to avoid annoying users

Potential cookie name:

- `instalyzer_session`

## Environment Variables

Add public Firebase web config variables:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
```

Add private Firebase Admin variables:

```text
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_AUTH_SESSION_COOKIE_NAME=instalyzer_session
```

Notes:

- Public Firebase web config is expected to be visible in the browser.
- Admin credentials must never be exposed to client components.
- The private key often needs newline handling in hosted environments.
- Do not commit real Firebase secrets.

## Packages

Expected package additions:

```text
firebase
firebase-admin
```

No auth UI package is required at first. The app already has a strong visual system, so custom sign-in/sign-up screens should fit the existing Instalyzer design.

## Phase 1: Auth Foundation

Goal:

Add secure account creation and session handling.

Deliverables:

- Firebase client initializer.
- Firebase Admin initializer.
- Sign in page.
- Sign up page.
- Sign out action.
- Session creation route handler.
- Session deletion route handler.
- Server helper to read and verify the current user.
- Basic account page that shows signed-in state.

Recommended routes:

- `/account`
- `/sign-in`
- `/sign-up`
- `/api/auth/session`
- `/api/auth/sign-out`

Success criteria:

- User can create an account with email/password.
- User can sign in with email/password.
- User can sign in with Google.
- User can refresh the page and remain signed in.
- Server can identify the signed-in user from the session cookie.
- Sign out clears both Firebase client state and the server cookie.

## Phase 2: Workspace Ownership

Goal:

Connect datasets and workspace state to the authenticated user.

Deliverables:

- Firestore `users/{uid}` profile document.
- Firestore dataset metadata collection.
- Dataset creation saves ownership metadata.
- Workspace loads only the current user's datasets.
- Existing local/mock dataset behavior is migrated or wrapped behind a persistence boundary.

Suggested Firestore shape:

```text
users/{uid}
  email
  displayName
  photoURL
  createdAt
  updatedAt

users/{uid}/datasets/{datasetId}
  label
  handle
  importedAt
  archiveStartDate
  archiveEndDate
  overviewStartDate
  overviewEndDate
  exportFormat
  importSource
  exportType
  dataDetected
  toolReadiness
  createdAt
  updatedAt
```

Success criteria:

- A signed-in user sees only their own saved datasets.
- Dataset labels, import dates, and overview metadata persist across reloads.
- Unauthenticated users are routed to sign in before accessing saved workspace state.

## Phase 3: Privacy, Retention, And Deletion

Goal:

Make account data handling explicit before storing sensitive export content.

Deliverables:

- Data retention policy for parsed datasets.
- Account deletion flow.
- Dataset deletion flow.
- Support-facing deletion request handling.
- Firestore rules reviewed against user ownership.
- Product copy updated to explain what is stored and what is not.

Important decision:

At launch, prefer storing parsed metadata and tool-ready derived data instead of raw Instagram zip files unless raw archive storage becomes necessary.

## Phase 4: Optional Storage

Goal:

Only add Firebase Storage if the product needs durable file storage.

Possible reasons to add Storage:

- Users need to reprocess the same archive later.
- Support needs recoverable import diagnostics.
- Future tools require source files that are not captured in parsed metadata.

Requirements before adding Storage:

- Clear deletion policy.
- Clear retention window.
- Per-user Storage security rules.
- Upload size limits.
- Cost and abuse controls.
- UI copy explaining whether the zip is stored.

Suggested default:

Do not store raw zip exports in Firebase Storage for the first auth implementation.

## Phase 5: Billing And Account Status

Goal:

Prepare account state for paid plans without mixing billing into the initial auth implementation.

Possible user fields:

```text
plan
billingStatus
stripeCustomerId
trialStartedAt
trialEndsAt
```

Notes:

- Billing provider can be added later.
- Firebase Auth should remain identity.
- Firestore can hold product/account metadata.
- Billing webhooks should update server-owned fields only.

## Security Checklist

Before launch:

- Verify all server reads/writes check the authenticated `uid`.
- Add Firestore security rules for `users/{uid}` ownership.
- Keep Firebase Admin code server-only.
- Do not trust client-provided `uid` values.
- Use verified session cookies for protected route handlers.
- Add clear error states for expired sessions.
- Handle duplicate account/provider errors cleanly.
- Require email verification if account abuse becomes a concern.
- Add rate limits or abuse controls around auth-sensitive endpoints if needed.

## Implementation Order

Recommended first build sequence:

1. Add Firebase project config and packages.
2. Add Firebase client and Admin helper modules.
3. Build sign-in and sign-up UI.
4. Add session cookie route handlers.
5. Add `getCurrentUser` server helper.
6. Replace `/account` placeholder with real account state.
7. Add sign-out flow.
8. Connect workspace route access to signed-in session.
9. Add Firestore user profile creation.
10. Persist saved dataset metadata under the signed-in user.

## Open Product Decisions

Decide before implementation starts:

- Should unauthenticated users still be allowed to try the upload flow locally?
- Should account creation happen before upload or after successful dataset review?
- Should Google sign-in be primary, or equal with email/password?
- Should email verification be required before saving datasets?
- Should raw Instagram exports ever be stored, or only parsed results?
- What is the account deletion retention window?

## Current Recommendation For Launch

For the first auth version:

- Allow users to browse marketing/help pages without auth.
- Let unauthenticated users understand the upload flow, but require sign-in before saving a dataset.
- Support email/password and Google.
- Use secure session cookies for protected app routes.
- Store user profile and dataset metadata in Firestore.
- Do not store raw Instagram zip files by default.
- Keep Firebase Storage and billing for later phases.
