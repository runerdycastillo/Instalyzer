# Current Milestone Audit

Use this document for the current build phase, not full launch readiness.

Current milestone focus:

- Finish the Next.js migration for the soft-launch core user flow
- Replace placeholder routes with real product surfaces
- Preserve the static product quality while simplifying toward a free launch
- Keep momentum without losing track of polish, bugs, and gaps
- Move from Firebase auth foundation into access gating and persistent account-owned storage

## How To Use

- Update this at the end of a work session in 3-5 minutes
- Only record the highest-signal changes, risks, and next checks
- Keep launch-level concerns in `PRE_LAUNCH_SAAS_AUDIT.md`
- Treat this as the practical checkpoint doc for active development

## Current Milestone Scope

- [x] Homepage marketing flow migrated
- [x] `/help` export guide implemented
- [x] Dataset creation flow implemented
- [x] Datasets index implemented
- [x] Dataset workspace implemented
- [x] Native `Not Following Back` route implemented
- [x] Tablet/mobile workspace gate implemented below `1024px`
- [x] Tablet gate and tablet marketing/support polish completed
- [x] Short-height desktop polish pass completed for the core soft-launch surfaces
- [x] Remaining responsiveness matrix accepted through the `1024px` boundary checks
- [x] Firebase auth/account implementation plan documented
- [x] Firebase auth/account foundation implemented
- [ ] Auth UI/access polish completed
- [x] Dedicated `/app/datasets` storage/list surface implemented for local datasets
- [x] Current storage empty/full/error/loading states polished for the local-storage pass
- [ ] Parser/domain logic extracted from static scripts

## Current Roadmap - May 19, 2026

This is the working roadmap for the next stretch. It condenses the latest end-of-day notes, Firebase plan, pre-launch audit, overview research, and Tier 2 plan into the practical build sequence.

### Phase 1: Current Surface Polish

Goal:

- make the existing local-storage product feel polished and complete before wiring it deeper into persistence

Exit checks:

- finish the dataset overview upgrade as the final Phase 1 polish lane
- keep overview data export-backed and avoid reserving UI for Instagram-only in-app fields that are not present in the export
- remove or merge redundant overview/support panels left over from the old flat KPI design
- evaluate whether the new BIMI logo artwork should replace the existing app logo assets across the product
- run a focused responsive pass through the upgraded overview at the current desktop workspace breakpoints
- run a short manual QA pass through the loading/auth/account/storage paths touched in the latest polish sessions
- complete the remaining live auth checks in `docs/auth-state-qa.md`

### Phase 2: Access Gating

Goal:

- decide and enforce where authentication is required

Build next:

- protect `/app`, `/app/datasets`, `/app/datasets/new`, dataset detail routes, and tool routes
- keep home, help, contact, privacy, terms, and data deletion pages public
- make `next=` redirects work cleanly after sign-in and sign-up
- keep auth as full pages for the primary flow until contextual auth modals are actually needed
- decide whether unauthenticated users can inspect an upload locally before sign-in, or whether upload starts behind account creation

### Phase 3: Firestore Foundation

Goal:

- move from browser-local saved datasets toward signed-in, account-owned workspace data

Build next:

- create Firestore `users/{uid}` profile documents
- save dataset metadata under `users/{uid}/datasets/{datasetId}`
- persist sign-up marketing consent on the user profile with opt-in value, source, and timestamp
- load only the current user's datasets in storage and workspace routes
- add Firestore server helpers and ownership checks
- add Firestore security rules for `users/{uid}` ownership
- wrap or replace the current localStorage dataset boundary so UI surfaces can move to persistent data without a broad rewrite

### Phase 4: Data Persistence Upgrade

Goal:

- decide how much parsed Instagram data belongs in Firestore for the first persistent workspace version

Build next:

- decide how much parsed relationship/tool data should persist in Firestore
- store the minimum derived data needed to reopen the dataset workspace and Tool 1 without re-uploading
- decide whether to store tool outputs, parsed relationship records, import diagnostics, or only metadata at first
- avoid Firebase Storage/raw Instagram ZIP storage until retention and deletion rules are settled
- keep raw Instagram ZIP storage out of scope unless reprocessing, support diagnostics, or future tools truly require it

### Phase 5: Privacy, Retention, And Deletion

Goal:

- make persistent storage safe, explainable, and consistent with the public legal/support pages

Build next:

- update privacy, terms, and data deletion copy to match Firestore-backed account storage
- add reliable dataset deletion and define the account deletion path
- define the retention policy for parsed dataset data and tool outputs
- review Firestore security rules against user ownership
- add clear expired-session and permission-denied states

### Phase 6: Parser And Tool Confidence

Goal:

- make the data layer strong enough to support persistent datasets and future tools honestly

Build next:

- strengthen parser/domain extraction and realistic export fixture coverage
- verify Tool 1 against multiple realistic export shapes
- add data confidence handling for partial, missing, or unsupported export data
- improve corrupted ZIP, wrong-format, missing-data, and limited-date-range handling where needed
- choose Tool 2 only after export data support and product wording are defensible

### Phase 7: Soft-Launch QA

Goal:

- test the product like a real first user before inviting broader usage

Build next:

- run the full new-user QA path from homepage to account, upload, saved dataset, workspace, Tool 1, deletion, support, and sign-out/sign-in
- recheck responsive behavior after Firestore and auth gating are wired
- verify support/contact, privacy/deletion, and account flows against the actual stored-data behavior
- after the soft-launch deployment, verify `https://instalyzer.app/bimi.svg` is publicly reachable and then add the `default._bimi` DNS TXT record
- update `docs/PRE_LAUNCH_SAAS_AUDIT.md` with findings, must-fix items, and launch confidence

### Phase 8: Tier 2 / Hard Launch

Goal:

- turn the soft-launch product into a paid SaaS only after the core free workflow is stable

Build later:

- billing and paid-plan access control
- durable lead and marketing opt-in storage
- paid tool packaging and server-side entitlement checks
- optional Firebase Storage if raw archive retention becomes necessary
- legal/support updates for paid usage, refunds, billing help, and account deletion
- broader tool expansion after parser confidence improves

Recommended next implementation sequence:

1. run Phase 1 exit QA across auth/loading/account/storage
2. implement auth route gating
3. implement `next=` redirects for protected-route sign-in/sign-up
4. recheck signed-in/signed-out account behavior after redirects
5. decide whether to upgrade dataset overview before Firestore
6. create Firestore user profiles
7. persist Firestore dataset metadata
8. decide Firestore parsed dataset/tool data scope
9. update privacy/deletion copy for persistent data
10. harden parser/data-confidence handling
11. run the soft-launch QA pass
12. keep Tier 2 / paid SaaS planning deferred

## Latest Checkpoint - May 17, 2026

Current surface polish is effectively at the exit-check stage.

What changed:

- completed the main loading-state sweep across global, workspace, storage, dataset creation, dataset detail, not-following-back, account, sign-in, sign-up, forgot-password, and reset-password routes
- gave not-following-back a dedicated tool-shaped loading state
- polished dataset creation back behavior, create-panel sizing, and the modal-style creating state
- moved dataset details out of overview and into storage through the row info/details action
- simplified details modal content and close affordances
- added forgot-password and reset-password flows with loading, success, invalid/expired, and responsive states
- rebuilt signed-in `/account` into a minimal operational page with welcome copy, access details, sign-out, guide/storage/data-control cards, and responsive coverage
- adjusted the Manage Datasets modal footer storage action to the quieter gray button with a blue storage icon
- documented hard-launch email brand trust/BIMI work in the Tier 2 plan

Verification:

- `npm run lint` passed
- `npm run build` passed
- targeted Playwright checks covered signed-in account responsiveness from `1280px` down to `390px`
- signed-in account horizontal overflow remained `0` in checked views

Next best move:

- run a short Phase 1 exit QA pass
- start Phase 2 access gating
- add protected-route `next=` redirect handling
- recheck auth/account/loading behavior after redirects
- decide whether dataset overview upgrade or Firestore dataset ownership should be the next main build target

## Latest Checkpoint - May 16, 2026

Current surface polish is still the active phase.

What changed:

- built `/app/datasets` into the dedicated storage/list page for local saved exports
- added storage row selection, workspace opening, import action, native sort, search, active dot, and settings/rename/delete behavior
- polished storage full, empty, error, and loading states
- tightened the manage exports modal with account handles, compact settings, simplified rename, and native sort consistency
- polished not-following-back list details, including result count placement, empty-state icons, smoother pinning, scoped pin hover, and list-colored action buttons
- centered sign-in, sign-up, and account panels within the under-navbar viewport space
- refined the dev accuracy-audit layout so its main panels fit better in the viewport
- added favicon/logo assets and tuned the browser-tab icon
- matched the navbar color grade more closely to the footer while keeping the original flat nav shape

Verification:

- `npm run lint` passed
- targeted Playwright checks covered storage/manage-sort and navbar color-only changes
- horizontal overflow remained `0` in the checked views

Next best move:

- finish the remaining loading-state sweep
- decide whether not-following-back needs a dedicated loading state
- build the signed-in account page into a real operational surface
- add account/sign-in blank, loading, and error states
- rerun responsive checks after account/loading polish

## Latest Checkpoint - May 8, 2026

Firebase auth foundation is implemented and pushed.

What changed:

- created the Firebase project and enabled Email/password plus Google sign-in
- added `localhost` and `127.0.0.1` to Firebase authorized domains for local auth testing
- added Firebase client/Admin helpers
- added secure session cookie routes for sign-in and sign-out
- replaced the `/account` placeholder with real signed-in/signed-out states
- added `/sign-in` and `/sign-up`
- confirmed email/password sign-up, Google sign-in, refresh persistence, and sign-out manually
- pushed commit `03456ce` (`Add Firebase auth foundation`)

Verification:

- `npm run lint` passed
- `npm run build` passed after allowing network access for Google Fonts
- `npm audit --omit=dev` found `0 vulnerabilities`

Next best move:

- polish the auth UI before Firestore
- make `/sign-up` feel like creating a private Instalyzer workspace, not just an account form
- keep auth as dedicated pages for the primary flow and defer auth modal work until contextual save moments exist
- route primary CTAs to `/sign-up?next=/app/datasets/new`
- require sign-in before `/app`, `/app/datasets`, `/app/datasets/new`, dataset detail routes, and tool routes
- keep home, guide, pricing, contact, privacy, terms, and data deletion pages public
- after auth UI/access gating is clean, enable Firestore and add `users/{uid}` profile documents

## Latest Checkpoint - May 6, 2026

Responsiveness is wrapped for the current pass.

What changed:

- fixed manage datasets/export and tools modal backdrop placement so the sticky nav remains visible
- removed normal manage modal hard scroll-locking while keeping destructive confirm dialogs locked
- tightened short-height modal behavior below the header
- added compact quick-guide cards for the `921px-1023px` width band at short heights
- added visual-guide carousel scaling for the same near-`1024px` band
- added an extra visual-guide refinement under `750px` height for the `700px-750px` pocket
- documented the Firebase recommendation in `docs/firebase-auth-implementation-plan.md`
- added the May 6 day-wrap and milestone snapshot

Verification:

- `npm run lint` passed
- `git diff --check` passed with only expected CRLF warnings
- `npm run build` passed after allowing network access for Google Fonts

Next best move:

- start Firebase authentication from the `Next Session Start Here` checklist in `docs/firebase-auth-implementation-plan.md`
- create or confirm the Firebase project, enable Email/password and Google sign-in, and add authorized domains
- add env placeholders without committing secrets
- implement auth in this order: Firebase client/Admin helpers, sign-in/sign-up UI, session cookie route handlers, current-user server helper, account state, sign-out, then Firestore dataset ownership
- first success loop should be: sign up, sign in, refresh and stay signed in, sign out, cookie clears

## Session Audit Template

### 1. What Changed Today

- [x] New feature or route was added
- [x] Existing flow was refined
- [x] Bug or regression was fixed
- [x] Docs were updated

Notes:

- Summary:
  - the session completed the tablet gate polish pass after the desktop-first gate was implemented
  - desktop-link requests now send an internal capture notification through the support inbox for soft-launch follow-up
  - Tier 2 / hard-launch scope is documented so billing, durable capture, auth, and paid tools do not creep into the soft launch
  - the homepage, legal/support pages, contact page, and `/help` guide were cleaned up around the tablet range
  - mobile/phone-width polish is now the next responsive focus
- Files/routes touched:
  - `instalyzer-next/app/globals.css`
  - `instalyzer-next/components/marketing/help-route.tsx`
  - `instalyzer-next/app/api/desktop-link/route.ts`
  - `instalyzer-next/lib/contact/desktop-link.ts`
  - `instalyzer-next/lib/instagram/tool-catalog.ts`
  - `instalyzer-next/app/(marketing)/privacy/page.tsx`
  - `instalyzer-next/app/(marketing)/data-deletion-request/page.tsx`
  - `instalyzer-next/.env.example`
  - `docs/CURRENT_MILESTONE_AUDIT.md`
  - `docs/tier-2-hard-launch-plan.md`
  - `docs/day-wraps/2026-05-01/end-of-day.md`
  - `docs/day-wraps/2026-05-01/milestone-audit.md`
- Anything user-visible:
  - desktop-link requests now generate an internal support notification with source/referrer/UTM and opt-in context
  - the tablet workspace gate feels tighter and less empty
  - tablet nav is logo-left with workspace/guide/account actions right
  - home tablet sections were cleaned up, including tools grid, how-it-works, workspace preview, footer, and reveal behavior
  - Privacy, Terms, Data Deletion, and Contact are less cluttered at tablet widths
  - `/help` has guide modes under the heading divider and a cleaner tablet quick/visual guide treatment

### 2. What Is Stable Right Now

- [x] The updated flow works locally
- [x] No obvious regressions were introduced
- [x] The new UI matches the product direction
- [x] Navigation into and out of the changed area still works

Notes:

- Stable areas:
  - the current desktop baseline still feels strong at `1440`
  - compact desktop is now polished through `1024`
  - the contact/support handoff remains live
  - the `1024px` workspace minimum is now implemented in code
  - the desktop-link API validates email and preserves the intended `/app` URL
  - desktop-link requests are captured via an internal support notification email
  - tablet gate/home/help/legal/contact presentation is now polished enough for soft-launch review
- Confidence level:
  - high for the gate direction and transactional email handoff
  - high for tablet polish direction
  - medium for phone-width polish until the next pass is completed

### 3. What Still Feels Incomplete

- [x] Error handling is still thin
- [x] Mobile behavior still needs review

Notes:

- Main gaps:
  - desktop-link capture is email-based for soft launch, not a durable database/contact-store integration
  - the optional marketing opt-in is captured in the internal notification but not saved permanently yet
  - phone-width mobile gate polish still needs a dedicated pass
  - parser/domain extraction from the static build still remains ahead
  - tablet nav keyboard tab order should be checked later because the visual order changes at tablet widths
- Anything intentionally deferred:
  - durable lead storage, auth/accounts, and marketing automation until after gate polish is settled
  - full mobile workspace design, because mobile/tablet now intentionally hand off to desktop

### 4. Quick Risk Check

- [x] No major blocker discovered
- [x] No hidden dependency surfaced
- [x] No serious product-direction mismatch discovered
- [x] No major trust/privacy concern introduced

Notes:

- Biggest current risk:
  - mobile polish could still surface layout issues below `768px`
- What could slow the next session down:
  - jumping into auth, billing, or parser extraction before the mobile gate has the same polish level tablet now has

### 5. Quick Manual Checks

- [x] Tested the changed route manually
- [x] Tested related buttons/links
- [x] Tested refresh behavior if relevant

Notes:

- What was tested:
  - tablet gate behavior
  - desktop-link email sending with a real inbox check
  - desktop-link internal capture notification delivery was confirmed by the user
  - copy-link behavior and success-state polish
  - `/help` quick/visual guide adjustments around the tablet range
  - home tablet sections, including reveal behavior
  - legal/contact tablet cleanup
  - `npm run lint`
  - `npm run build`
- What was not tested:
  - durable lead/contact database storage, because it is intentionally deferred
  - a full phone-width visual QA sweep after the tablet polish changes

### 6. Next Best Move

- [x] Next task is clearly defined
- [x] Needed docs/context are captured
- [x] No important handoff detail is missing

Notes:

- Next recommended task:
  - run the focused mobile gate polish pass below `768px`
- Prerequisites for next session:
  - test `/app`, dataset detail, `not-following-back`, `/help`, and legal/contact routes at common phone widths
  - keep durable database/contact-list storage for Tier 2 unless soft-launch volume proves it is needed sooner
  - keep auth/accounts deferred until responsive gate polish is clear

---

## Milestone-Specific Checks

Use this section to track the current migration flow specifically.

### Marketing Flow

- [x] Hero feels polished
- [x] Tools section migrated
- [x] How it works section migrated
- [x] Results preview migrated
- [x] Pricing section migrated
- [x] FAQ section migrated
- [x] Final CTA migrated
- [x] `/help` route is real, not placeholder

### App Flow

- [x] CTA leads into a real dataset creation experience
- [x] Upload flow accepts the right Instagram export
- [x] Upload step is clear
- [x] Dataset creation step is clear
- [x] Upload-to-create processing handoff feels intentional
- [x] Dataset workspace is real
- [x] Tool 1 works natively in Next
- [x] Workspace/tool routes gate below `1024px`
- [x] Desktop-link email handoff is implemented
- [x] Tablet gate polish is complete enough for soft-launch review

### Technical Foundation

- [x] Theme behavior is stable
- [x] Landing-page refresh behavior is stable
- [x] Basic route/layout structure is in place
- [ ] Parser logic is extracted into reusable modules
- [x] Storage/data boundaries are intentionally designed
- [x] Placeholder routes are being retired in order
- [x] Microsoft Graph mail helper supports reusable transactional mail
- [x] Desktop-link requests are captured through internal support notification email
- [ ] Durable desktop-link lead/opt-in storage exists outside the inbox

---

## Rolling Fix List

### Fix Next

- [ ] Do a focused mobile gate QA/polish pass
- Why now: tablet polish is effectively wrapped and the short-height desktop pass is now much stronger, so phone-width polish is still the next broad responsive lane after the height matrix is checked.

- [ ] Continue the short-height desktop audit at the remaining target heights
- Why now: today fixed the real `1432 x 712` laptop pain points, but the next session should verify the full height matrix before leaving this pass.

- [ ] Decide the next parser-confidence pass or next native tool after gate QA settles
- Why now: Tool 1, support, and the workspace gate are all stronger now, so the next product decision should happen after the tablet/mobile handoff is visually solid

- [ ] Run a focused responsive pass on the current core flow before auth work begins
- Why now: homepage, trust pages, dataset creation, overview, workspace, and Tool 1 are real enough that responsive cleanup now will be much cheaper than waiting until auth adds more route and layout complexity

### Watch Soon

- [ ] Finish the dataset overview upgrade before leaving Phase 1
- Why soon: today established the layered `views / interactions / followers` direction, but the detail panels and support sections still need polish before access gating starts

- [ ] Do a deliberate interaction QA pass on overview + `not following back`
- Why soon: recent polish added stronger visited, move-state, footer jump, legal-route, and animation behaviors, so a focused app-side QA pass is still valuable

- [ ] Continue hardening parser coverage in reusable modules
- Why soon: the current route supports the launch flow, but real archive inspection still needs deeper coverage before advanced tools ship

### Leave For Later

- [ ] Use `docs/tier-2-hard-launch-plan.md` when paid launch planning becomes active
- Why later: the current soft launch should keep capture, support, and Tool 1 lean; Tier 2 is where billing, durable opt-in storage, account-owned datasets, and paid tool packaging belong

- [ ] Revisit whether `/app` remains a true hub or redirects into datasets
- Why later: `overview` now behaves much better, so the more urgent work is the live tool rather than app-home architecture debates

- [ ] Revisit `Terms` and `Privacy` when the first paid tier is introduced
- Why later: the current soft launch should use legal copy that matches a free product, then get a fuller billing/subscription/legal pass once hard launch and paid plans are actually live

---

## Session Log

Add one short entry per work session.

### Session Entry Template

- Date:
- Focus:
- What moved forward:
- What remains rough:
- Biggest risk:
- Next step:

### Session Entry - 2026-03-25

- Date: 2026-03-25
- Focus: finish the marketing/help migration and improve planning clarity for the next phase
- What moved forward:
  - homepage sales flow was completed with pricing, faq, and final cta
  - `/help` was replaced with the real export guide and polished toward the static reference
  - launch and milestone audit docs were created/refined
  - new docs were added for actual export data and realistic tool opportunities
- What remains rough:
  - app-side routes are still mostly placeholder territory after the marketing handoff
  - parser/domain extraction work still remains ahead
- Biggest risk:
  - the product story is much clearer than the actual dataset/workspace/tool implementation, so the next session needs to close that gap
- Next step:
  - build dataset creation, dataset overview, and native Tool 1 in `instalyzer-next`

### Session Entry - 2026-03-26

- Date: 2026-03-26
- Focus: build the first real dataset creation route in Next and shape it into a more polished SaaS-style upload experience
- What moved forward:
  - `/app/datasets/new` was replaced with a real route-native 3-step flow for upload, review, and setup
  - main homepage/help/workspace CTAs now lead into the real dataset flow instead of a placeholder
  - lightweight local dataset storage, a real datasets index, and a basic dataset workspace handoff were added
  - the upload step went through several design passes to improve focus, trust, and consistency with the rest of the product
- What remains rough:
  - the dataset creation route still needs more polish in hierarchy, spacing, copy, and overall premium feel
  - review/setup steps still need another pass so they match the quality of the upload step
  - parser extraction is still ahead, so archive inspection remains lighter than the static version
- Biggest risk:
  - the route is real now, but if we stop here the upload step could still feel more like a strong draft than a fully locked product experience
- Next step:
  - continue polishing the dataset creation page, especially the upload panel, review state, and setup state, before moving deeper into Tool 1 porting

### Session Entry - 2026-03-30

- Date: 2026-03-30
- Focus: pivot the Next app toward a soft-launch free product and polish the dataset creation flow around that direction
- What moved forward:
  - homepage messaging was reframed around a free launch with `Not Following Back` as the live tool and more tools marked as coming soon
  - pricing was hidden behind a temporary conditional instead of being removed
  - the app was simplified to dark-only for the soft launch
  - iconography across the marketing/app flow was cleaned up with `lucide-react`
  - `/app/datasets/new` was heavily refined from a 3-step upload/review/setup flow into a cleaner `upload -> create` experience
  - the create step was centered, simplified, and given a subtle processing handoff between upload and dataset creation
  - the upload/create flow now feels much closer to a polished launch surface than an internal migration screen
- What remains rough:
  - the dataset overview/workspace still needs another pass so it matches the quality of the new dataset flow
  - the native `Not Following Back` route is still the biggest missing launch piece
  - deeper parser extraction still remains ahead
- Biggest risk:
  - the soft-launch story is now much clearer than the actual live-tool depth, so the next session needs to complete the overview and Tool 1 path without losing this polish
- Next step:
  - finish the dataset overview/workspace and then implement the native `Not Following Back` tool for the soft launch

### Session Entry - 2026-04-05

- Date: 2026-04-05
- Focus: turn the dataset workspace into a polished soft-launch handoff and tighten the upload/create flow around real user behavior
- What moved forward:
  - ZIP parsing, richer dataset extraction, and overview metrics were wired into the Next dataset flow
  - local dataset storage was hardened with stable snapshots, same-tab update events, and active-dataset memory for better navigation behavior
  - the dataset workspace was redesigned around a lighter shell with current dataset context on the left, overview in the center, and workspace/tool context on the right
  - dataset and tools modals were upgraded with better backdrop behavior, scroll locking, actions, renaming, deleting, and more intentional placement
  - the upload flow now locks a prepared draft until the user explicitly resets it, preventing accidental overlapping uploads
  - default dataset naming, length limits, tool surfacing, and overview navigation were all refined to behave more like a real product
- What remains rough:
  - the native `Not Following Back` route is still placeholder content
  - the tools modal is now directionally right, but may still want one more compact design pass later
  - mobile behavior and smaller responsive details still need a more deliberate manual pass
- Biggest risk:
  - the workspace now looks much closer to launch-ready, which raises the importance of the live-tool gap even more
- Next step:
  - implement the native `Not Following Back` experience in Next using the new dataset/workspace foundation

### Session Entry - 2026-04-06

- Date: 2026-04-06
- Focus: polish the dataset-side workspace management flow until it feels controlled enough to stop and move forward
- What moved forward:
  - the `current dataset` panel was refined with stronger hierarchy, a recent-datasets preview, and cleaner action copy
  - the `manage exports` modal was heavily upgraded with better spacing, sorting, renaming, export-limit handling, and more stable floating actions
  - several modal regressions were fixed, including nav shift, overlay clipping, sort/action overlap, and a null-anchor floating-panel crash
  - export naming in the create flow is now user-defined instead of auto-generated as `export 1`, `export 2`, etc.
- What remains rough:
  - the tools side of the workspace still wants one more deliberate pass, mainly in the tools modal
  - the overview still needs a deliberate data pass before it should be considered finalized
  - `Not Following Back` is still placeholder content
- Biggest risk:
  - it would be easy to start Tool 1 before the workspace/tool/data handoff is truly locked, which could create another polish loop later
- Next step:
  - finish the tools-side workspace panel/modal, review the real data we want to surface, finalize the overview, then implement `Not Following Back`

### Session Entry - 2026-04-14

- Date: 2026-04-14
- Focus: polish the live workspace interactions and tighten the homepage behavior so the soft-launch flow feels more intentional
- What moved forward:
  - `not following back` got a stronger review loop with recently visited row highlighting, pinned pending accounts, cleaner lowercase tooltip labels, and immediate cleanup when rows move between lists
  - recent datasets now behave more like true recent history instead of static chips, and the active dataset remains easy to re-enter from the left panel
  - the workspace rail was refined with a clearer `available now` treatment and stronger active-state feedback across the tool/list surfaces
  - homepage viewport/scroll behavior was stabilized so route changes preserve the full-viewport hero feel and the `scroll to explore` cue now lands on the tools section cleanly
  - the `download csv` action was moved into the list controls row so it reads like a real data action instead of floating in header space
- What remains rough:
  - homepage copy still wants a deliberate messaging pass across the full landing flow
  - broader mobile/manual QA is still lighter than it should be after the recent interaction polish
  - deeper parser extraction from the static app still remains ahead
- Biggest risk:
  - the product is getting visually and behaviorally polished enough that unclear landing-page messaging could become the next biggest trust/conversion drag
- Next step:
  - do a dedicated homepage messaging pass first, then run a follow-up polish/QA sweep to catch any remaining friction across marketing and workspace surfaces

### Session Entry - 2026-04-17

- Date: 2026-04-17
- Focus: tighten legal/trust surfaces, polish homepage/footer behavior, and add cleaner motion to the live `not following back` workflow
- What moved forward:
  - `Terms of Service` was rebuilt into a fuller legal page and adjusted to match the current free soft-launch reality instead of implying live subscriptions
  - a new `Data Deletion Request` page was added and linked under the legal footer cluster with copy that matches the current browser-local storage model
  - the legal-page sticky sidebars were refined so they sit with healthier spacing instead of feeling clipped against the viewport
  - footer navigation gained a working FAQ jump, and homepage hash/logo behavior was cleaned up so FAQ and home-top actions no longer fight each other
  - the `not following back` tool got a restrained motion pass with row exits, card/count feedback, reusable recent-activity highlighting, and more intuitive pending/unfollowed color logic
- What remains rough:
  - the support/contact path is still not fully decided, so `contact support` is stronger as a concept than as a finalized implementation
  - broader manual QA is still lighter than it should be after the recent motion, legal-route, and hash-scroll changes
  - deeper parser extraction from the static build still remains ahead
- Biggest risk:
  - the product is getting more polished around trust and workflow details, which raises the importance of making the contact/support handoff feel equally intentional
- Next step:
  - investigate the best support implementation for soft launch (`mailto` only vs dedicated contact page/form vs both), then implement the chosen path cleanly

### Session Entry - 2026-04-22

- Date: 2026-04-22
- Focus: lock the contact/support surface by turning it into a real live form and verifying end-to-end delivery
- What moved forward:
  - `/contact` was rebuilt into a real support form with cleaner field structure, lighter copy, a polished sidebar, and multiple final layout refinements
  - the backend contact route was added and wired to Microsoft Graph so submissions now deliver to `support@instalyzer.app`
  - mailbox setup was verified with real test sends, email body formatting was cleaned up, and the forwarding issue was identified and disabled
  - setup docs/env scaffolding were added so the Microsoft integration is understandable and maintainable
- What remains rough:
  - the desktop-first mobile gate for app/workspace routes still needs to be built
  - parser/domain extraction still remains ahead
- Biggest risk:
  - mobile visitors can still hit a flow that is better treated as desktop-only until the gate is in place
- Next step:
  - implement the mobile gate next, then continue the broader responsive/desktop-first sweep before auth work

### Session Entry - 2026-04-23

- Date: 2026-04-23
- Focus: run the first deliberate responsive audit so the next session can implement the desktop-first gate and compact-width fixes from a clear plan
- What moved forward:
  - a new `docs/responsive-audit.md` was created and filled with real findings across `1440`, `1280`, `1180`, `1024`, and `900`
  - the audit confirmed that `1440` is still the safe baseline, `1180` is where compact-layout issues become real, `1024` actively breaks multiple workspace/tool components, and `900` is no longer honestly workable for the workspace
  - the `Terms` page support action was updated to route into `/contact`, keeping the real support flow consistent
- What remains rough:
  - none of the responsive fixes are implemented yet
  - the workspace/tool gate still needs to be built
  - several marketing sections still need a lighter tablet-range treatment
- Biggest risk:
  - if the next session drifts back into open-ended auditing instead of implementation, we lose the benefit of the now-clear breakpoint decisions
- Next step:
  - originally: implement the `900px` workspace/tool gate first, then do the compact desktop pass for the `901px` to `1180px` range using the new audit doc as the checklist
  - superseded on 2026-04-29: compact desktop is now polished through `1024px`, so the next gate should start below `1024px`

### Session Entry - 2026-04-29

- Date: 2026-04-29
- Focus: finish the compact desktop polish pass and reset the workspace gate decision around the real minimum usable width
- What moved forward:
  - workspace overview was polished across `1180`, `1080`, and `1024`, including reach/gender rings, activity chart labels, audience movement, manage exports, and misleading hover affordances
  - `not following back` was tightened at compact desktop widths with cleaner rows, better action behavior, username truncation, smoother tooltip handling, and less redundant row copy
  - manage exports gained cleaner icon-only actions, an `active` badge, a delete confirmation, and correct full export date display
  - the product decision changed from a `900px` gate to a `1024px` workspace/tool minimum
- What remains rough:
  - the actual tablet/mobile gate below `1024px` is still unbuilt
  - parser/domain extraction still remains ahead
- Biggest risk:
  - continuing to tweak below `1024px` instead of implementing the gate would waste the clarity gained from this pass
- Next step:
  - build the workspace/tool gate for `1023px` and below, with tablet layout for `768px - 1023px` and mobile layout below `768px`

### Session Entry - 2026-04-30

- Date: 2026-04-30
- Focus: implement the tablet/mobile workspace gate and turn mobile workspace traffic into a desktop-link handoff
- What moved forward:
  - `/app` and all workspace/tool routes now show a responsive gate below `1024px` instead of the full workspace
  - the gate sends the exact current desktop link through a new `/api/desktop-link` endpoint using the existing Microsoft Graph mail setup
  - copy-link fallback, optional updates consent, success/error states, trust copy, and the export-guide handoff were added and polished
  - `/help` was adjusted below `1024px` so quick tips/upload CTAs do not conflict with the gate, while quick-guide and visual-guide handoffs route into the gate
  - the desktop-link email copy was upgraded and Reply-To is set to `Instalyzer <support@instalyzer.app>`
- What remains rough:
  - desktop-link requests and marketing opt-ins are not persisted yet
  - the gate and help-route tablet/mobile polish should get one more focused QA pass
  - parser/domain extraction still remains ahead
- Biggest risk:
  - collecting email for a useful desktop-link action without storing the request means opt-ins can be lost until capture/storage is implemented
- Next step:
  - run final gate QA, then implement lightweight desktop-link capture/storage before auth or parser work

### Session Entry - 2026-05-01

- Date: 2026-05-01
- Focus: add soft-launch desktop-link capture, document Tier 2 scope, and finish the tablet gate polish pass
- What moved forward:
  - desktop-link requests now send an internal support notification with email, intended URL, device range, source/referrer/UTM, marketing opt-in, timestamp, and consent context
  - `docs/tier-2-hard-launch-plan.md` was added so paid-tier, billing, auth, durable capture, persistent datasets, and legal/support work stay out of the current soft-launch lane
  - tablet gate and marketing surfaces were polished across the desktop workspace page, home page, legal/support pages, contact page, and guide
  - the guide mode switcher moved under the guide heading divider, two-column guide dividers were cleaned up, and the visual guide carousel was reduced for tablet
  - home tablet reveal behavior was adjusted so the lower viewport does not look blank while waiting for scroll
- What remains rough:
  - phone-width mobile gate polish still needs a dedicated pass
  - durable lead/contact storage is still intentionally deferred
  - parser/domain extraction remains ahead
- Biggest risk:
  - starting parser/auth/billing work before mobile receives the same focused polish tablet just received
- Next step:
  - polish the mobile gate below `768px`, then decide whether parser extraction or the next native tool should move next

### Session Entry - 2026-05-04

- Date: 2026-05-04
- Focus: complete the first short-height desktop responsive polish pass around the real `1432 x 712` laptop viewport
- What moved forward:
  - homepage hero, scroll cue, tools, how-it-works, results preview, FAQ, final CTA, nav, and footer were tightened for short desktop heights
  - guide quick tips, visual guide media, contact form, and dataset upload flow gained earlier height-specific compact behavior
  - workspace overview, not-following-back, and manage exports/tools modals were tightened for laptop-height screens
  - manage exports/tools modals now portal to `document.body` with scroll locking, preventing background/nav overlap while modals are open
  - Terms and Data Deletion legal surfaces were cleaned up for the compact laptop viewport
- What remains rough:
  - the remaining short-height matrix still needs a deliberate follow-up pass across `1432`, `1440`, `1366`, `1280`, and `1024` widths
  - phone-width gate polish below `768px` is still waiting behind this height pass
  - parser/domain extraction remains ahead
- Biggest risk:
  - tying component-specific layout breakpoints to global title sizing could make the page feel inconsistent; title rhythm should stay shared unless a real component demands otherwise
- Next step:
  - continue the short-height desktop audit with the target matrix captured in `docs/day-wraps/2026-05-04/end-of-day.md`, then return to mobile gate polish

### Session Entry - 2026-05-19

- Date: 2026-05-19
- Focus: polish signed-in/account access, inspect real Instagram overview data, and start the dataset overview upgrade
- What moved forward:
  - signed-in account/access UI was tightened with better stat hierarchy, smaller welcome sizing, and quieter auth preference controls
  - keep-signed-in and marketing-updates controls were added, with Firestore follow-up notes for durable opt-in storage
  - local Instagram overview research was organized and excluded from git
  - the real export was compared against Instagram's in-app Insights screenshots so the overview direction can stay honest
  - dataset uploads now become the active dataset and the exports modal storage action has a clearer blue-outline treatment
  - the dataset overview shifted from six flat KPI cards into a layered `views`, `interactions`, and `followers` model
  - Views detail now shows export-backed total views, audience split, reach, profile visits, link taps, and profile activity
  - the unsupported content-type placeholder was removed because that data appears to be in-app only, not export-backed
- What remains rough:
  - the overview upgrade still needs visual polish before Phase 1 can close
  - interactions and followers need unique detail stories instead of duplicated metrics
  - old support sections should be merged or removed where they repeat the new drill-in panels
- Biggest risk:
  - copying Instagram's visible in-app insights too literally could make Instalyzer expose unsupported empty states instead of a clean export-backed overview
- Next step:
  - continue polishing the overview upgrade, then run the desktop/laptop responsive matrix and move into access gating once Phase 1 is accepted
