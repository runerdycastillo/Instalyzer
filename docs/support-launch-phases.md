# Support And Launch Phases

## Purpose

Use this document to keep the support/contact plan aligned with the actual launch stage of Instalyzer.

This is not a QA checklist.

This is the product-direction note for:

- invite-only soft launch
- public launch readiness
- paid launch readiness
- when to keep support simple
- when to make support feel more official

## Current Product Direction

- Product: `Instalyzer`
- Current stage: invite-only soft launch
- Public launch target: after the first paid tier is real
- Paid direction under discussion: `Pro` first, then `Premium`
- Current support surface: contact page + visible `mailto:support@instalyzer.app`

Core rule:

- do not overbuild support before the product and paid structure are real
- do not fake a polished support system without a real support inbox behind it

## Phase 1: Invite-Only Soft Launch

Goal:

Keep support trustworthy, direct, and low-friction while the product is still being tested with a smaller user set.

What support should look like:

- a real inbox at `support@instalyzer.app`
- visible support email on the contact page
- `mailto:` fallback stays live
- help/contact copy stays calm, honest, and simple
- support expectations stay light and human

Good additions in this phase:

- a clean contact page
- response-time guidance
- privacy reminder not to send passwords or sensitive credentials
- optional lightweight contact form only if it clearly improves UX

Avoid in this phase:

- heavy ticketing
- complex backend support workflows
- pretending support is more mature than it is
- form-only support without a real mailbox foundation

Definition of done for this phase:

- support email is real and monitored
- contact path feels legitimate
- users know what they can ask for help with
- support surfaces match the trust level of the rest of the product

## Phase 2: Public Launch Readiness

Goal:

Make support feel more official before the product is opened more broadly.

What support should look like:

- real inbox remains the foundation
- contact page remains clear and trustworthy
- optional form becomes more deliberate and reliable
- support categories become more explicit

Recommended upgrades in this phase:

- move any form handling toward a backend route or server action
- define support categories such as:
  - export issues
  - parsing/import help
  - workspace/tool help
  - general support
- tighten privacy guidance and submission expectations
- clarify response-time expectations
- make legal, privacy, deletion, and support pages feel like one system

Avoid in this phase:

- overcomplicated support tooling
- billing-grade support promises before billing is actually live
- adding systems that create more maintenance than value

Definition of done for this phase:

- support path works reliably
- support feels intentional, not improvised
- public users can tell how to get help and what to expect

## Phase 3: Paid Launch Readiness

Goal:

Support the first paid tier with enough structure that the product feels credible as a paid service.

What support should look like:

- real support inbox is fully established
- support intake is more structured
- billing/account help is explicitly covered
- support process is stable enough for paying users

Recommended upgrades in this phase:

- add billing/account support guidance
- add more formal contact categories if needed
- consider confirmation states or follow-up workflow improvements
- consider a lightweight internal triage process

Only add later if volume actually requires it:

- ticket references
- helpdesk tooling
- canned replies
- deeper automation

Definition of done for this phase:

- paid users have a credible support path
- support expectations match the product promise
- the support system still feels lean, but no longer feels provisional

## Working Recommendation

Right now, Instalyzer should optimize for:

1. real inbox first
2. visible direct email second
3. lightweight form only if it improves UX without replacing the inbox
4. backend-backed form handling later, closer to public or paid launch

Launch-order note:

- before auth/accounts become the next major build phase, the current marketing, support, dataset, workspace, and Tool 1 surfaces should go through a deliberate responsive pass
- responsive cleanup should not wait until the whole product is "finished"
- the right timing is after the current trust/support flow feels settled, but before account/auth complexity adds more layout states

Current responsive recommendation:

1. polish the current product surfaces
2. lock the support/contact path
3. run a focused responsive pass across core routes
4. then begin auth/account foundation

Core responsive sweep targets:

- homepage
- help/contact/legal pages
- dataset creation flow
- dataset overview/workspace
- `not following back`
- modal and popover behavior on smaller screens

Short version:

- invite-only soft launch = simple, real, human support
- public launch = cleaner and more official support flow
- paid launch = structured support, but still not overbuilt

## Open Decisions

- choose the real mailbox provider for `support@instalyzer.app`
- decide whether a contact form belongs in invite-only soft launch or waits for public launch
- define what `Pro` support expectations should be before the first paid tier goes live

## Next Review Point

Revisit this document when one of these becomes true:

- the support inbox is fully set up
- a contact form is about to be implemented
- the responsive pass is about to be scheduled
- the first paid tier scope is locked
- public launch timing becomes real
