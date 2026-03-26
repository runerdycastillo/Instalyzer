# Pre-Launch SaaS Audit Checklist

Use this document as a working audit before launch. Update it as the app grows, and treat it like a living readiness checklist rather than a one-time exercise.

Current product context:

- Product: `Instalyzer`
- Product type: Instagram dataset workspace
- Core promise: `Upload once. Use many times.`
- Current migration stage: Next.js marketing flow is largely in place, while help, dataset creation, workspace routes, and parser extraction are still being built

## How To Use

- Review each section in a real browser, not just from code.
- Mark items as complete only after manual verification.
- Add short notes, evidence, and follow-up actions while testing.
- Revisit this checklist at major milestones, not just right before launch.

## Status Key

- `[ ]` Not reviewed yet
- `[x]` Reviewed and acceptable
- `[-]` Known issue or intentionally deferred

---

## 1. Core User Flow Audit

Check the full main user journey from start to finish.

- [ ] Can a new user understand what the product does within 5 seconds?
- [ ] Is the CTA clear on the landing page?
- [ ] Can the user understand that this is a dataset workspace, not just a single unfollow checker?
- [ ] Can the user access the app without confusion?
- [ ] Can the user upload their Instagram export zip successfully?
- [ ] Does the upload process clearly explain that the official Instagram export zip is required?
- [ ] Does the upload process clearly explain that JSON export data is currently required?
- [ ] Does the upload flow explain why `all time` export range matters for relationship tools?
- [ ] Does the app correctly process and parse the file?
- [ ] Does the user understand what happens during upload, review, setup, and dataset creation?
- [ ] Does the dashboard load the expected results?
- [ ] Are there any dead ends, confusing moments, or broken steps?
- [ ] Is there a clear success state after upload and processing?

### Notes

- Status:
- Findings:
- Action items:

---

## 2. Error Handling Audit

Check how the app behaves when things go wrong.

- [ ] What happens if the user uploads the wrong file type?
- [ ] What happens if the zip is corrupted?
- [ ] What happens if required data is missing?
- [ ] What happens if the export is valid, but not usable for relationship analysis?
- [ ] What happens if the export is not `all time` and the results may be incomplete?
- [ ] What happens if parsing fails?
- [ ] What happens if the upload takes too long?
- [ ] Are error messages clear and human-friendly?
- [ ] Does the UI fail gracefully instead of crashing?
- [ ] Are empty states handled properly?

### Notes

- Status:
- Findings:
- Action items:

---

## 3. UI / UX Polish Audit

Review the overall smoothness and clarity.

- [ ] Is spacing consistent across pages?
- [ ] Are buttons aligned and styled consistently?
- [ ] Are fonts, colors, and card styles consistent?
- [ ] Do scroll anchors and in-page transitions feel intentional?
- [ ] Is the dashboard easy to scan?
- [ ] Are loading states polished?
- [ ] Are skeleton loaders or spinners present where needed?
- [ ] Is the mobile layout usable?
- [ ] Are there any sections that feel cluttered or unfinished?
- [ ] Does the app feel trustworthy and clean?

### Notes

- Status:
- Findings:
- Action items:

---

## 4. Copy Audit

Review the wording across the app.

- [ ] Is the headline clear?
- [ ] Does the subheadline explain the value well?
- [ ] Are button labels clear?
- [ ] Are upload instructions simple and specific to Instagram exports?
- [ ] Are errors written in normal human language?
- [ ] Is there any vague or robotic copy?
- [ ] Is the pricing copy clear?
- [ ] Is the help page easy to understand?
- [ ] Does the copy explain privacy and data handling clearly enough for a cautious user?
- [ ] Does the copy avoid overpromising unsupported insights or AI claims?

### Notes

- Status:
- Findings:
- Action items:

---

## 5. Bugs / Functional Audit

Check for technical issues.

- [ ] Test all buttons
- [ ] Test all links
- [ ] Test all modals
- [ ] Test all form inputs
- [ ] Test drag-and-drop upload
- [ ] Test file validation
- [ ] Test loading states
- [ ] Test refresh behavior
- [ ] Test navigation between pages
- [ ] Test edge cases with missing or partial data
- [ ] Test theme toggle behavior across refresh and route changes
- [ ] Test anchor/scroll behavior across the landing page
- [ ] Test tool gating behavior for unsupported or incomplete exports

### Notes

- Status:
- Findings:
- Action items:

---

## 6. Performance Audit

Check if the app feels fast enough.

- [ ] Does the landing page load quickly?
- [ ] Does the upload step feel responsive?
- [ ] Does the dashboard render efficiently?
- [ ] Are large files handled reasonably?
- [ ] Are there unnecessary rerenders?
- [ ] Are images optimized?
- [ ] Are there obvious slow interactions?
- [ ] Does parsing remain responsive for realistic Instagram export sizes?

### Notes

- Status:
- Findings:
- Action items:

---

## 7. Trust / Business Audit

Check whether the product looks ready for real users.

- [ ] Is pricing visible and understandable?
- [ ] Is there a Privacy Policy?
- [ ] Is there a Terms of Service page?
- [ ] Is there a refund policy if needed?
- [ ] Is there a support/contact option?
- [ ] Does the app clearly explain how user data is handled?
- [ ] Does the product feel safe enough to pay for?
- [ ] Is it clear that users do not log into Instagram through Instalyzer?
- [ ] Is it clear what is stored temporarily vs permanently?

### Notes

- Status:
- Findings:
- Action items:

---

## 8. Final Manual Test

Do one full test as if you are a brand new user.

- [ ] Land on homepage
- [ ] Understand product
- [ ] Click CTA
- [ ] Enter app
- [ ] Upload correct file
- [ ] Review upload summary
- [ ] Name dataset
- [ ] Wait for processing
- [ ] Enter dataset workspace
- [ ] View dashboard / workspace
- [ ] Review insights
- [ ] Check help/support
- [ ] Confirm nothing feels broken or confusing

### Notes

- Status:
- Findings:
- Action items:

---

## 9. Launch Decision

At the end of the audit, summarize:

- [ ] What is launch-ready
- [ ] What must be fixed before launch
- [ ] What can wait until after launch
- [ ] Biggest current risks
- [ ] Final launch confidence score out of 10

### Summary

- Launch-ready:
- Must fix before launch:
- Can wait until after launch:
- Biggest current risks:
- Launch confidence score:

---

## 10. Priority Fix List

### Must Fix Before Launch

- [ ] Item:
- Notes:
- Owner:
- Target date:

### Should Fix Soon

- [ ] Item:
- Notes:
- Owner:
- Target date:

### Nice to Have Later

- [ ] Item:
- Notes:
- Owner:
- Target date:

---

## Current Stage Notes

Use this section to keep the document realistic while the app is still being built.

- Current product stage: Next.js migration in progress
- Routes/features not built yet:
  - real `/help` export guide
  - real dataset creation flow
  - real datasets index and dataset workspace
  - native `Not Following Back` tool route
  - parser/domain extraction from the static prototype
- Known placeholders:
  - workspace/app routes
  - help route
  - support/contact flow
- Audit sections that are not applicable yet:
  - auth/signup review until auth exists
  - billing/refund audit until payment flow exists
  - deeper dashboard/tool audits until the real workspace is live
- Next milestone to re-run this audit: after `/help`, dataset creation, and first real workspace flow are implemented

## Instalyzer-Specific Risks To Watch

- Relationship-tool accuracy is weaker when exports are not `all time`
- Users may not understand the difference between JSON export support now and possible HTML support later
- The product must feel like a reusable dataset workspace, not just a one-off unfollow checker
- Privacy and data-handling clarity will matter early because users are uploading personal exports
- The handoff from marketing pages into the real app flow will feel unfinished until help and dataset creation are fully implemented
