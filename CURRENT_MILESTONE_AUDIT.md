# Current Milestone Audit

Use this document for the current build phase, not full launch readiness.

Current milestone focus:

- Finish the Next.js migration for the core user flow
- Replace placeholder routes with real product surfaces
- Preserve the static product quality while improving architecture
- Keep momentum without losing track of polish, bugs, and gaps

## How To Use

- Update this at the end of a work session in 3-5 minutes
- Only record the highest-signal changes, risks, and next checks
- Keep launch-level concerns in `PRE_LAUNCH_SAAS_AUDIT.md`
- Treat this as the practical checkpoint doc for active development

## Current Milestone Scope

- [x] Homepage marketing flow migrated
- [x] `/help` export guide implemented
- [ ] Dataset creation flow implemented
- [ ] Datasets index implemented
- [ ] Dataset workspace implemented
- [ ] Native `Not Following Back` route implemented
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

- [ ] CTA leads into a real dataset creation experience
- [ ] Upload flow accepts the right Instagram export
- [ ] Upload review step is clear
- [ ] Dataset setup step is clear
- [ ] Dataset workspace is real
- [ ] Tool 1 works natively in Next

### Technical Foundation

- [x] Theme behavior is stable
- [x] Landing-page refresh behavior is stable
- [x] Basic route/layout structure is in place
- [ ] Parser logic is extracted into reusable modules
- [ ] Storage/data boundaries are intentionally designed
- [ ] Placeholder routes are being retired in order

---

## Rolling Fix List

### Fix Next

- [ ] Item:
- Why now:

### Watch Soon

- [ ] Item:
- Why soon:

### Leave For Later

- [ ] Item:
- Why later:

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
