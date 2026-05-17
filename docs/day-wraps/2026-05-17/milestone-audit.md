# Milestone Audit - May 17, 2026

Snapshot for the current polish milestone.

## Current Phase

Phase 1: Current Surface Polish

Status:

- effectively in exit QA

Goal:

- make the local-storage product feel coherent, polished, and complete before access gating, Firestore, and paid SaaS work

## Completed This Session

- loading states were added or polished across app, workspace, storage, dataset creation, dataset detail, not-following-back, account, sign-in, sign-up, forgot-password, and reset-password routes
- not-following-back now has a dedicated tool-shaped loading state
- dataset creation now has cleaner back behavior, a narrower responsive create panel, and a modal-style creating state
- dataset details moved from overview into storage through the row details/info action
- details modal copy was simplified and close buttons were visually cleaned up
- Manage Datasets modal footer storage action changed from a loud primary button to a quieter storage-icon action
- forgot-password and reset-password routes are implemented, styled, and responsive
- reset-password invalid/expired states and normal loading states are covered
- signed-in `/account` is now a minimal useful account home with welcome copy, access details, sign-out, guide, storage, and data-control actions
- email brand trust/BIMI was documented for hard launch

## Still Open In Current Phase

- short manual QA pass through the touched auth/loading/account/storage paths
- complete any remaining live checks in `docs/auth-state-qa.md`
- decide whether the dataset overview upgrade happens before or after Phase 2 access gating

## Risks / Watch Items

- route-level auth gating can change loading and redirect behavior, so some of today's loading polish should be rechecked after gating lands
- forgot-password currently depends on Firebase action URL configuration; production URL should be revisited before public launch
- email sender avatar/BIMI is intentionally deferred, but hard launch should not forget brand trust setup
- storage remains browser-local, so account page storage language should stay honest until Firestore ownership exists
- dataset overview upgrade should not blur free overview data with future paid/premium insight claims

## Next Best Move

1. run a short Phase 1 exit QA pass
2. start Phase 2 access gating
3. implement `next=` redirects for protected-route sign-in/sign-up
4. recheck account/auth/loading after gating
5. then choose between dataset overview upgrade and Firestore dataset ownership as the next main build target

## Phase Gate

Move to Phase 2 when:

- lint/build are green
- auth/loading/account changes are documented
- the signed-in account page passes responsive checks
- forgot-password/reset-password have a known local and future production URL path
