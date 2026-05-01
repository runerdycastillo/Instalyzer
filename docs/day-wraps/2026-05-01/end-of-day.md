# End Of Day - May 1, 2026

Today is May 1, 2026.

## What We Finished

- implemented soft-launch desktop-link capture through the existing support inbox:
  - desktop-link requests still send the user their desktop link
  - an internal capture notification is sent for follow-up
  - notification includes intended URL, device range, marketing opt-in, source/referrer/UTM details, timestamp, and consent context
  - durable database/contact-list storage is documented for Tier 2 instead of forced into the soft launch
- created `docs/tier-2-hard-launch-plan.md`:
  - captures the first paid tier, billing, auth, durable capture, persistent datasets, paid tools, legal/support, and hard-launch QA scope
  - keeps the current soft launch intentionally lean
- completed a focused tablet polish pass:
  - desktop workspace gate at tablet widths was tightened and verified by manual review
  - tablet nav was reworked into logo-left/actions-right
  - home hero scroll cue/reveal behavior was adjusted so tablet does not show an empty waiting state
  - tools grid, how-it-works, workspace preview, FAQ, and footer were cleaned up around the `768px-920px` range
  - Privacy, Terms, Data Deletion, and Contact pages got tablet spacing and clutter reduction
  - Contact hides low-value side panels on tablet and has a softer submit-button glow
  - Guide modes moved under the help title/subtitle divider
  - Guide quick/visual modes were refined for tablet, including cleaner two-column dividers and a smaller visual-guide carousel

## What We Learned

- the tablet experience works best when it is treated as a polished handoff, not a smaller workspace
- internal email capture is enough for soft launch as long as marketing opt-in is not treated as durable subscription storage yet
- sidebar/support panels are often useful on desktop but become clutter once tablet layouts stack
- reveal animation should not hide content that is already visually expected on tablet
- the Guide page needs simpler hierarchy at tablet widths because users are there to complete a task, not browse a complex help center

## What Feels Stable Now

- workspace/tool routes gate below `1024px`
- desktop-link email handoff and internal notification capture are wired
- Tier 2 scope is documented instead of floating in memory
- tablet marketing/legal/contact/help surfaces are much cleaner
- home tablet sections no longer depend on scroll reveal to avoid a blank lower viewport
- lint status after the latest patches

## What Still Needs Work

- phone-width/mobile gate polish still needs the same focused attention tablet just received
- parser/domain extraction from the static build still remains ahead
- durable lead/contact storage remains intentionally deferred to Tier 2 unless soft-launch volume proves it is needed sooner
- keyboard tab order for the tablet nav may deserve a later accessibility check because the visual order changes at tablet widths

## Priority For Next Session

1. start the mobile gate polish pass below `768px`
2. verify `/app`, dataset routes, `not-following-back`, `/help`, and legal/contact routes at common phone widths
3. keep the desktop workspace minimum at `1024px+`
4. leave durable lead storage, auth/accounts, billing, and paid tools in Tier 2 planning
5. after mobile is stable, decide whether parser extraction or the next native tool gets priority

## Working Notes

- Tablet gate polish is effectively wrapped.
- Do not reopen the desktop/tablet breakpoint decision unless a concrete bug appears.
- The soft-launch capture model is:
  - transactional desktop-link email to the user
  - internal notification email to support
  - no marketing automation or durable opt-in database yet
- Use `docs/tier-2-hard-launch-plan.md` when paid launch or durable storage planning comes back into scope.
