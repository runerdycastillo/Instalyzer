# Current Milestone Audit

Use this document for the current build phase, not full launch readiness.

Current milestone focus:

- Finish the Next.js migration for the soft-launch core user flow
- Replace placeholder routes with real product surfaces
- Preserve the static product quality while simplifying toward a free launch
- Keep momentum without losing track of polish, bugs, and gaps

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
- [ ] Parser/domain logic extracted from static scripts

## Session Audit Template

### 1. What Changed Today

- [ ] New feature or route was added
- [ ] Existing flow was refined
- [ ] Bug or regression was fixed
- [ ] Docs were updated

Notes:

- Summary:
- Files/routes touched:
- Anything user-visible:

### 2. What Is Stable Right Now

- [ ] The updated flow works locally
- [ ] No obvious regressions were introduced
- [ ] The new UI matches the product direction
- [ ] Navigation into and out of the changed area still works

Notes:

- Stable areas:
- Confidence level:

### 3. What Still Feels Incomplete

- [ ] Placeholder content still remains
- [ ] UX still needs polish
- [ ] Error handling is still thin
- [ ] Mobile behavior still needs review
- [ ] Copy still needs cleanup

Notes:

- Main gaps:
- Anything intentionally deferred:

### 4. Quick Risk Check

- [ ] No major blocker discovered
- [ ] No hidden dependency surfaced
- [ ] No serious product-direction mismatch discovered
- [ ] No major trust/privacy concern introduced

Notes:

- Biggest current risk:
- What could slow the next session down:

### 5. Quick Manual Checks

- [ ] Tested the changed route manually
- [ ] Tested related buttons/links
- [ ] Tested refresh behavior if relevant
- [ ] Tested theme behavior if relevant
- [ ] Tested mobile layout if relevant

Notes:

- What was tested:
- What was not tested:

### 6. Next Best Move

- [ ] Next task is clearly defined
- [ ] Needed docs/context are captured
- [ ] No important handoff detail is missing

Notes:

- Next recommended task:
- Prerequisites for next session:

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

### Technical Foundation

- [x] Theme behavior is stable
- [x] Landing-page refresh behavior is stable
- [x] Basic route/layout structure is in place
- [ ] Parser logic is extracted into reusable modules
- [x] Storage/data boundaries are intentionally designed
- [x] Placeholder routes are being retired in order

---

## Rolling Fix List

### Fix Next

- [ ] Decide the soft-launch contact support approach
- Why now: the footer, legal pages, and trust surfaces are now strong enough that support/contact behavior is the next obvious product-trust gap

- [ ] Implement the chosen contact support path
- Why now: whether the answer is `mailto`, a dedicated contact page, or both, the product should stop feeling half-wired in its support handoff

- [ ] Do a deliberate interaction QA pass on overview + `not following back`
- Why now: recent polish added stronger visited, move-state, footer jump, legal-route, and animation behaviors, so the next highest-value app-side work is confirming they feel stable in real use

- [ ] Decide the next parser-confidence pass or next native tool after support/contact settles
- Why now: Tool 1 and the legal/trust surfaces are both much stronger now, so the next product decision should come after we close the support handoff cleanly

### Watch Soon

- [ ] Port deeper parser logic from the static flow into reusable modules
- Why soon: the current route supports the launch flow, but real archive inspection is still lighter than the static prototype

### Leave For Later

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
