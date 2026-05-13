# End Of Day - May 12, 2026

Today is May 12, 2026.

## What We Finished

- recovered the Mac local setup so this machine can work on the repo cleanly:
  - switched off the stale merged branch state and recreated a fresh `mac-updates` branch from current `main`
  - installed local dependencies
  - created a new local `.env.local` on the Mac
  - restored Firebase client and admin environment values
  - restored Microsoft Graph mail configuration except for final verification of the existing client secret value
- resolved the local Firebase Admin/module setup issues on the Mac:
  - cleared the missing `firebase-admin/app` build error by installing the project dependencies
  - fixed the browser timer typings in `components/auth/auth-form.tsx` so the project builds cleanly on this machine
- tightened the contact form fallback experience:
  - replaced the heavier fallback copy with concise lowercase messaging
  - standardized the error/fallback tone so it stays visually aligned with the rest of the product
  - current fallback message is:
    - `unavailable right now. email us directly.`
- polished the auth route layouts further:
  - pushed `/sign-up` and `/sign-in` toward a more auth-first presentation
  - removed the secondary feature-card grids from the dedicated auth routes
  - improved laptop-height behavior so the important auth surface fits the first screen more naturally
  - aligned the vertical placement of sign-up and sign-in so they read as a pair
  - removed the awkward fake empty height at the bottom of sign-in while keeping the pair visually consistent
- worked through a strong manual sign-in QA pass:
  - successful email sign-in
  - successful Google sign-in
  - invalid email handling
  - incorrect credentials handling
  - network failure handling
  - Google popup close/cancel behavior
  - retry behavior after closing the popup
- improved Google popup behavior in code:
  - if a Google auth popup is already open and falls behind the browser, clicking the Google button now focuses the existing popup instead of spawning another one
- cleaned up CSS diagnostics in `app/globals.css`:
  - removed empty rulesets
  - added the standard `line-clamp` property next to `-webkit-line-clamp`
- finished the Google OAuth support identity cleanup:
  - verified ownership of `instalyzer.app` through Google Workspace using a manual TXT verification record
  - created and signed into the `support@instalyzer.app` Google identity
  - added `support@instalyzer.app` to the Instalyzer Google Cloud project IAM
  - updated the Google Auth Platform `User support email` so the Google popup no longer shows the personal Gmail address

## What We Learned

- Google Auth Platform `User support email` is stricter than it first appears:
  - verifying the domain alone was not enough
  - the support address needed to exist as a real Google identity
  - the support address needed project access
  - the Branding change ultimately had to be completed from a session that could reach the real Instalyzer project context with that identity
- manual TXT verification was the right move:
  - it let us verify the domain without immediately migrating `@instalyzer.app` mail away from Outlook/o365
- the Google Cloud project picker can be misleading when a new account defaults into a starter project
  - direct project URLs and IAM checks were more reliable than trusting the picker alone

## Open Items

- the Microsoft Graph mail flow still needs the final working `MICROSOFT_GRAPH_CLIENT_SECRET` value from the PC or a deliberate secret rotation
- the contact form should be retested after the correct Graph secret is restored
- sign-up failure-state QA still needs its own dedicated pass:
  - password mismatch
  - email already in use
  - weak password
  - invalid email
  - network failure
  - Google popup close/retry behavior on the sign-up route
- forgot-password flow is still a planned future auth feature, not yet implemented

## Priority For Next Session

1. Merge `mac-updates` from the PC once today’s Mac changes are reviewed.
2. Restore or rotate the working Microsoft Graph client secret on the PC and then mirror it back to the Mac.
3. Retest the `/contact` submission flow with the real Graph secret in place.
4. Work through the sign-up QA pass the same way sign-in was reviewed.
5. Implement forgot-password support when ready.

## Working Notes

- Do not click `Activate Gmail` in Google Workspace unless there is an intentional decision to migrate domain mail away from Outlook/o365.
- Keep the Google Workspace/domain verification work separate from mail-hosting changes.
- Do not commit `.env.local` or any other secret-bearing files.
- The Mac environment is now a valid working machine for the project, but the PC still has the authoritative working Microsoft Graph secret until that value is synced or rotated.
