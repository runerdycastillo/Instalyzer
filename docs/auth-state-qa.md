# Auth State QA

Use this as the living checklist for auth behavior and error-state coverage.
Keep it separate from the responsive matrix so viewport issues and state issues
do not get mixed together.

## Status Key

- `Implemented`: code is in place
- `Reviewed`: we looked at the UI and shaped the presentation
- `Needs live test`: still needs a real manual trigger
- `Recheck`: behavior changed recently and should be confirmed again

## Sign-In

Applies to both `/sign-in` and the signed-out auth form on `/account`.

| State | Status | Notes |
| --- | --- | --- |
| Incorrect email or password | Implemented, Reviewed | Compact red inline message is in place |
| Too many attempts | Implemented, Reviewed | Copy shortened to a one-liner |
| Invalid email format | Implemented, Needs live test | Error copy exists but should still be manually triggered |
| Network failure | Implemented, Needs live test | Error copy exists but should still be manually triggered |
| Google popup blocked | Implemented, Needs live test | Error copy exists but should still be manually triggered |
| Google popup closed by user | Implemented, Recheck | Silent cancel by design; latest calmer popup behavior should be confirmed |
| Google popup pending state | Implemented, Reviewed | Reduced to a quick shimmer; clicking Google again should refocus the existing popup |
| Email submit pending state | Implemented, Reviewed | Static label with button morph only |
| Successful email sign-in | Implemented, Needs live test | Confirm route transition and session handoff |
| Successful Google sign-in | Implemented, Needs live test | Confirm route transition and session handoff |
| Session creation failure after auth | Implemented, Needs live test | Fallback message exists for `/api/auth/session` failure |
| Password reveal toggle | Implemented, Reviewed | Eye toggle added to password field |
| Google OAuth support identity | Implemented, Reviewed | Popup now shows the `support@instalyzer.app` support identity after Google Workspace/domain/IAM setup |

## Sign-Up

Sign-up is email/password only by design. Google is kept as a sign-in option, not an account creation path.

| State | Status | Notes |
| --- | --- | --- |
| Password mismatch | Implemented, Needs live test | Inline error exists |
| Email already in use | Implemented, Needs live test | Firebase copy is in place |
| Weak password | Implemented, Needs live test | Firebase copy is in place |
| Invalid email format | Implemented, Needs live test | Firebase copy is in place |
| Network failure | Implemented, Needs live test | Firebase copy is in place |
| Create account pending state | Implemented, Reviewed | Static label with button morph only |
| Successful email sign-up | Implemented, Needs live test | Confirm account creation and redirect |
| Password reveal toggles | Implemented, Reviewed | Added to password and confirm password |

## Account / Signed-Out Auth Shell

| State | Status | Notes |
| --- | --- | --- |
| Sign-in form layout on signed-out account | Implemented, Reviewed | Matches sign-in treatment across breakpoints |
| Sign-out failure message | Implemented, Needs live test | Inline error exists on failed sign-out |
| Desktop CTA vs mobile auth switch behavior | Implemented, Reviewed | Desktop hero CTA stays separate; smaller widths use inline auth switch |

## Route-Level States

| State | Status | Notes |
| --- | --- | --- |
| Global loading screen | Implemented, Needs sweep | Added app-level `loading.tsx` |
| Global error screen | Implemented, Needs sweep | Added app-level `error.tsx` |
| Global not-found screen | Implemented, Needs sweep | Added app-level `not-found.tsx` |
| Dataset index loading state | Implemented, Needs sweep | Skeleton exists |
| Dataset not found state | Implemented, Needs sweep | Styled missing-dataset state exists |

## Next Checks

1. Run the dedicated sign-up failure-state pass: password mismatch, email already in use, weak password, invalid email, and network failure.
2. Trigger one real successful email sign-up and confirm redirect/session handoff.
3. Recheck Google popup close/cancel and second-click refocus on `/sign-in` and signed-out `/account`.
4. Force one blocked-popup case.
5. Force one sign-out failure case.
