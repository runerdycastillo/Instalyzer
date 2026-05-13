# Google Analytics Future Integration

Created: May 13, 2026

## Decision Status

Google Analytics is intentionally deferred. Instalyzer skipped Google Analytics during the first Firebase/Auth setup so the near-term work can stay focused on auth, workspace access, Firestore ownership, and account trust.

## Why Defer It

- The product is still pre-launch and the core account/data flow is more important than traffic reporting.
- Analytics should not be added until privacy copy, consent behavior, and tracked event scope are clear.
- The app handles sensitive Instagram export data, so measurement should be conservative and avoid raw user content, usernames, export contents, or dataset-derived private details.

## Likely Future Path

- Use GA4 when the marketing site and app onboarding need real traffic and conversion visibility.
- Add a public browser env value such as `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Load analytics only in production-like environments.
- Keep Firebase Auth and GA4 separate unless there is a clear reason to connect product analytics through Firebase.
- Track high-level behavior only, such as page views, sign-up starts, completed sign-ups, dataset creation starts, tool opens, and contact form submissions.
- Do not track uploaded file contents, parsed follower data, private account names, raw exports, or personally identifying dataset details.

## Before Implementation

- Reconfirm the privacy policy language covers the selected analytics provider and cookie/local storage behavior.
- Decide whether cookie consent is needed before GA4 loads.
- Decide which events matter for launch reporting.
- Confirm the Google account/project ownership path after the Cloud Identity Free decision is settled.

## Implementation Notes

- Prefer a small isolated analytics helper instead of sprinkling GA calls through components.
- Keep route/page tracking compatible with the Next.js App Router.
- Make analytics fail silently if the measurement ID is missing.
- Document each tracked custom event in this file before shipping it.

