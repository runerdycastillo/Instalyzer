# End Of Day - April 17, 2026

Today is April 17, 2026.

## What We Finished

- tightened the legal and trust surfaces so they feel like part of the real product instead of placeholder compliance pages:
  - rebuilt `Terms of Service` into a fuller page that matches the current free soft launch
  - softened billing/refund language so the page no longer reads like subscriptions are already live
  - added a dedicated `Data Deletion Request` page using the same legal-page visual system as `Privacy` and `Terms`
  - linked the new deletion page into the footer legal cluster
- refined legal-page behavior and footer navigation:
  - added healthier sticky spacing to the legal side panels so they no longer feel clipped against the viewport
  - added a footer `faq` link that jumps into the homepage FAQ section
  - fixed the hash-scroll behavior so the FAQ jump lands in a centered, intentional way
  - fixed the home-logo behavior so clicking the logo always means `go to the top of home`, not `toggle back into faq`
- polished the live `not following back` tool with more controlled feedback:
  - cleaned sort labels and tightened the sort control spacing / arrow treatment
  - added row move feedback that now reuses the same temporary highlight logic as recently visited profiles
  - added restrained motion for row exits and summary-card/count feedback, then trimmed back the choppier list-refresh layer
  - removed the temporary horizontal scrollbar flash when rows move back into `pending`
  - swapped the status color logic so `pending` reads green and `unfollowed` reads red/orange

## What We Learned

- legal/trust pages feel much better when they are honest about the current product state:
  - soft-launch copy should describe what exists now
  - billing/subscription language should stay conditional until a paid tier is actually live
- footer jump behavior needed more care than a plain hash link:
  - `faq` needed its own centered landing treatment
  - the home logo needed explicit `go home / clear hash / scroll to top` behavior
- the first animation pass for `not following back` was too ambitious:
  - the useful motion is row exit, count feedback, and moved-row acknowledgement
  - the list-refresh fade was adding churn without enough value

## What Feels Stable Now

- `Privacy`, `Terms`, and `Data Deletion Request` now feel like one consistent legal/trust system
- the legal footer cluster feels more complete
- the homepage footer `faq` jump now behaves intentionally
- the `not following back` workflow feels cleaner and more responsive without getting flashy

## What Still Needs Work

- the support/contact path is still undecided:
  - `mailto` only
  - dedicated contact page
  - dedicated page plus `mailto`
- broader manual QA is still needed after the recent legal-route, footer, scroll, and motion changes
- deeper parser/domain extraction from the static build still remains ahead

## Priority For Next Session

1. investigate the best support/contact implementation for soft launch
2. decide whether the product should use `mailto`, a dedicated contact page/form, or both
3. implement the chosen contact support path cleanly and update the trust/legal surfaces around it if needed

## Working Notes

- this was a strong trust-and-polish session more than a major feature-build session
- a lot of the work was about making the product feel deliberate around legal pages, footer behavior, and tool feedback
- the clearest next handoff is:
  - contact support discovery first
  - implementation second
  - then a follow-up QA pass once the support flow is real
