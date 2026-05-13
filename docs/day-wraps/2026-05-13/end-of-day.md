# End Of Day - May 13, 2026

Today is May 13, 2026.

## What We Finished

- merged the Mac `mac-updates` branch into `main`, pushed it, then deleted the old remote branch after confirming the merge landed cleanly
- kept the local dev server running at `http://127.0.0.1:3000`
- polished auth UI behavior:
  - made display/chrome UI text unselectable while leaving inputs, form messages, and copyable long-form text selectable
  - removed Google from the sign-up form so sign-up is email/password only
  - kept Google on `/sign-in` and the signed-out `/account` auth form
  - kept the hidden behavior where clicking the Google button again refocuses the existing popup instead of spawning a second one
  - enlarged and spaced out masked password bullets in auth password fields
- updated `docs/auth-state-qa.md` so it matches the current auth product decisions:
  - sign-in QA applies to both `/sign-in` and signed-out `/account`
  - sign-up is email/password only
  - stale Google sign-up checks were removed
  - Google OAuth support identity setup is documented as reviewed

## What We Learned

- the Google popup support email does not require migrating the real support inbox away from Microsoft 365
- the paid Google Workspace seat is probably not the long-term fit if we only need a Google-recognized identity for OAuth branding and Cloud project access
- Cloud Identity Free should be the next thing to try:
  - keep Outlook/Microsoft 365 as the actual `support@instalyzer.app` inbox
  - keep `support@instalyzer.app` as a managed Google identity
  - move that identity away from paid Workspace licensing if Cloud Identity Free preserves the OAuth support email behavior
- browsers may not always force a popup above every other window, but the app now makes the correct user-gesture focus request when the Google button is clicked again

## Open Items

- walk through Cloud Identity Free setup next session:
  - add Cloud Identity Free from Google Admin if available
  - confirm `support@instalyzer.app` keeps a managed Google identity without a paid Workspace/Gmail license
  - confirm Google Auth Platform still lets `support@instalyzer.app` remain the user support email
  - leave Outlook/Microsoft 365 MX/mail hosting untouched
- run the dedicated sign-up error QA pass:
  - password mismatch
  - email already in use
  - weak password
  - invalid email
  - network failure
  - successful email sign-up and redirect/session handoff
- sweep loading and route-level states:
  - global `loading.tsx`
  - global `error.tsx`
  - global `not-found.tsx`
  - dataset index loading skeleton
  - dataset creation loading state
  - dataset workspace loading panels
- implement forgot-password support when ready
- restore or rotate the working Microsoft Graph client secret, then retest the `/contact` form with real delivery
- recheck Google popup close/cancel and second-click refocus on `/sign-in` and signed-out `/account`

## Priority For Next Session

1. Start with the Cloud Identity Free walkthrough so we can avoid paying for Workspace if the only requirement is Google identity/OAuth support email.
2. Run the sign-up error-state QA pass and adjust copy or UI spacing as needed.
3. Sweep loading/error/not-found states across the app and document what still needs polish.
4. Implement forgot-password if the auth QA pass is stable.
5. Restore/rotate the Microsoft Graph client secret and retest support contact delivery.

## Working Notes

- Do not click `Activate Gmail` in Google Workspace unless we intentionally decide to migrate mail away from Outlook/Microsoft 365.
- Keep Outlook/Microsoft 365 as the real mailbox until there is a strong reason to migrate.
- Do not delete the `support@instalyzer.app` Google identity; the goal is to remove paid Workspace dependency, not remove the Google account identity.
- Do not commit `.env.local`, `.secrets`, or any secret-bearing file.
- Current local work is not committed yet; review and commit the auth polish plus doc updates before pushing.
