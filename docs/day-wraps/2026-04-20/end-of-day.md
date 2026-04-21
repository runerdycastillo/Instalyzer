# End Of Day - April 20, 2026

Today is April 20, 2026.

## What We Finished

- locked the soft-launch support direction into something more realistic and trustworthy:
  - documented staged support/launch planning in `docs/support-launch-phases.md`
  - clarified that invite-only soft launch should use a real inbox first, not an overbuilt support system
  - added the responsive-pass ordering into the planning docs so it sits before auth/accounts
- turned the contact/support path into a more intentional product surface:
  - kept `support@instalyzer.app` as the foundation
  - removed the fragile `mailto` dependency from the footer
  - reworked the contact page so the support email now copies on click instead of forcing an OS mail-app handoff
  - added hover/focus copy affordance on the support inbox email
  - removed the separate copy button and removed the last `mailto` action from the contact page
  - kept the contact page centered around direct email, guide support, and calm trust-focused copy
- improved the dataset overview language around time scope:
  - kept `overview window` as the main insights-range label near the profile summary
  - added a second timeline/coverage field in the lower dataset details area instead of mixing it into the hero summary
  - confirmed from the sample archive that signup and broader archive timestamps can support a more honest second range field
- tightened several homepage and trust-copy details:
  - removed `free launch` from the final CTA trust row
  - trimmed the FAQ from 7/8 items down to the stronger 6-question set
  - refined footer support behavior so it feels more deliberate
- cleaned up branch health in a bigger way than expected:
  - fixed the `not following back` lint blocker
  - cleared several production-only type/build issues across parser, terms, dataset workspace, suspense boundaries, and support-related files
  - got both `npm run lint` and `npm run build` passing cleanly again

## What We Learned

- a real support inbox matters more than a fancy support surface at this stage:
  - `mailto` works technically, but the UX can still feel unreliable because it depends on the user's OS/mail-app setup
  - copy-first email UX is cleaner for invite-only soft launch than forcing Outlook/Mail app behavior
- support should feel official in proportion to the launch stage:
  - invite-only soft launch wants real, direct, human support
  - public and paid launch can add more formal support structure later
- `overview window` and broader archive/account coverage should stay separate:
  - the overview card should stay focused on what the visible metrics actually represent
  - the broader coverage/timeline context belongs lower in supporting metadata
- responsive work should not be deferred until after auth:
  - once the current trust/support/core workspace surfaces are settled, responsive cleanup should happen before Firebase/account complexity is added

## What Feels Stable Now

- the support/contact direction is much clearer than it was at the start of the day
- the contact page now feels more controlled and less dependent on external mail-app quirks
- the footer support treatment feels calmer and more consistent with the copy-first support decision
- the branch is back to a clean `lint + build` baseline
- the docs now capture both support/launch staging and the responsive-before-auth recommendation

## What Still Needs Work

- the contact page still wants one more polish pass tomorrow:
  - small wording/layout refinement
  - final confidence check on the copy-first support interaction
- broader manual QA is still needed across:
  - contact
  - homepage
  - dataset overview
  - `not following back`
- the deliberate responsive pass is still ahead
- auth/accounts are still intentionally deferred until after responsive cleanup
- deeper parser/domain extraction from the static build still remains ahead

## Priority For Next Session

1. do the next contact-page polish pass and lock the support surface
2. run a focused manual QA sweep on contact + overview + homepage trust areas
3. decide when to begin the dedicated responsive pass now that support direction is mostly settled

## Working Notes

- this became a stronger trust-and-foundation session than a simple contact-page polish pass
- the most important non-UI outcome is that support is no longer vague:
  - real inbox
  - copy-first contact path
  - no dependence on `mailto` as the main UX
- the clearest handoff into tomorrow is:
  - finish the contact-page polish
  - sanity-check the support flow in browser
  - then start preparing for the responsive sweep instead of jumping straight into auth
