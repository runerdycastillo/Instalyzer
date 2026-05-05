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

## Next Pass - Short-Height Desktop Audit

This is the active focused responsive pass.

The issue is not phone or tablet width. It is `desktop-width` with `short laptop height`: the app shows the desktop hero/layout, but the available browser height is compact enough that the hero panel, nav, and scroll cue can overlap or feel squeezed.

Primary real target from laptop testing:

- `1432 x 712`

Audit targets:

- `1432 x 712` - actual laptop viewport
- `1440 x 700` - close stress test
- `1366 x 720` - common laptop size
- `1280 x 720` - tighter laptop size
- `1280 x 650` - short stress test
- `1024 x 700` - minimum desktop/gate boundary check

Testing setup:

- Use Chrome at `http://localhost:3000`.
- Keep DevTools undocked when measuring the real laptop viewport.
- Use bottom-docked DevTools only when intentionally squeezing height.
- Avoid right-docked DevTools for this pass because it shrinks width and can trigger tablet behavior below `1024px`.
- Check the viewport with:

```js
window.innerWidth + " x " + window.innerHeight
```

Focus areas:

- homepage hero
- scroll cue / scroll wheel
- hero panel or preview area
- nav spacing
- first section peeking under the hero
- `/help` top section if time allows
- workspace gate around `1024 x 700`

What to look for:

- overlapping scroll cue and hero content
- clipped CTAs or hero copy
- hero panel crowding the first viewport
- excessive fixed vertical spacing
- layouts relying too heavily on tall `100vh` behavior

Likely fix shape:

```css
@media (min-width: 1024px) and (max-height: 760px) {
  /* compact hero spacing, reposition or hide scroll cue, tighten first viewport */
}
```

## Short-Height Progress - May 4, 2026

Primary accepted viewport:

- `1432 x 712`

Completed/accepted directions:

- Home:
  - hero cue keeps the mouse cue down to `790px`, then switches to double chevrons
  - dataset tools compact at `880px`, but title sizing stays tied to the shared title breakpoint
  - how-it-works, results preview, FAQ, final CTA, nav, and footer all have short-height cleanup
  - fixed the nav height feedback loop by keeping the compact nav height fixed instead of deriving it from `--marketing-header-height`
- Guide:
  - composition is centered better around `1432px` desktop width
  - quick tips compact at `815px`
  - visual guide media compacts at `900px`
- Contact:
  - contact-specific compact state starts at `900px`
- Dataset creation:
  - upload screen compact state starts at `900px`
- Workspace/tool:
  - workspace overview and not-following-back have short-height tightening
  - manage exports/tools modals portal to `document.body` and lock background scroll
- Legal:
  - Terms support card removed
  - legal titles and Data Deletion sidebar behavior tightened for short-height desktop

Next height matrix:

- `1432 x 900`
- `1432 x 880`
- `1432 x 815`
- `1432 x 790`
- `1432 x 760`
- `1432 x 712`
- `1440 x 900`
- `1440 x 760`
- `1366 x 900`
- `1366 x 815`
- `1366 x 720`
- `1280 x 900`
- `1280 x 760`
- `1280 x 720`
- `1280 x 650`
- `1024 x 900`
- `1024 x 760`
- `1024 x 700`

Route order for the next session:

- home
- guide quick mode
- guide visual mode
- contact
- dataset creation upload step
- dataset creation create step
- workspace overview
- manage exports modal
- not following back
- footer/legal pages

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
