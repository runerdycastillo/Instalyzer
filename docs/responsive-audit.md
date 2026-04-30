# Responsive Audit

Use this doc to capture real layout and usability issues while stepping down through viewport widths.

## Current Decision - April 30, 2026

- Full workspace/tool routes should be supported at `1024px+`.
- Workspace/tool routes now show a polished gate at `1023px` and below.
- Gate layout ranges:
  - tablet: `768px - 1023px`
  - mobile: below `768px`
- The compact desktop pass for `1180`, `1080`, and `1024` is now substantially complete.
- Do not keep chasing workspace fixes below `1024px`; preserve the gate instead.
- The gate sends the exact desktop link by email, includes a quieter copy-link fallback, and keeps marketing updates optional and unchecked by default.
- `/help` remains responsive below `1024px`, but upload/workspace CTAs now route into the gate instead of implying the workspace is usable on tablet/mobile.

Focus routes:

- home
- help
- dataset creation
- dataset workspace
- not following back
- contact
- terms

## 1440

- Home: looks good.
- Help: looks good.
- Workspace: looks good.
- Not Following Back: looks good.

## 1280

- Nav: tighter left/right spacing around the top-right buttons, but still acceptable and clean.
- Help: left guide-mode rail feels too far left and slightly detached from the main content.
- Workspace rail: buttons feel slightly tight, but still acceptable.
- Not Following Back: `back to overview` wraps to two lines.

## 1180

- Status: compact desktop pass completed.
- Help: guide-mode buttons and quick tips were tightened.
- Workspace rail: relationship signals and workspace pill behavior were tightened.
- Workspace overview: reach mix and gender split now have compact ring/tooltip behavior.
- Workspace overview: audience movement and activity chart were tightened.
- Not Following Back: header/list row pressure was reduced and row actions now hold better.

## 1024

- Status: accepted as the minimum full workspace width.
- Help: checked and polished enough for this pass.
- Workspace overview: checked and polished enough for this pass.
- Not Following Back: checked and polished enough for this pass.
- Current rule: anything below this gates instead of continuing to squeeze the full workspace.

## 900

- Superseded by the `1024px` gate decision.
- Marketing/home/help pages can continue responsive treatment below `1024px`.
- Workspace/tool routes now show the desktop-link gate here.
- Help page side rail is hidden here; quick-guide and visual-guide handoffs route to the gate.

## 768

- Tablet gate implemented.
- Gate uses the concise desktop-workspace handoff, email send, copy fallback, export-guide panel, and trust/legal footer.
- Help page uses the tablet-friendly one-column guide layout with a bottom `get started` handoff in quick guide.

## Phone

- Mobile gate implemented.
- Needs one final phone-width QA pass after the latest copy/layout polish.
- Keep the gate shorter, single-column, and clear; do not build the full mobile workspace yet.
