# Responsive Audit

Use this doc to capture real layout and usability issues while stepping down through viewport widths.

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

- Help: guide-mode buttons on the left are getting cut off / clipped at the viewport edge.
- Workspace rail: `relationship signals` rows are cramped; labels and values compete for horizontal space.
- Workspace overview: `reach mix` legend is too cramped on the right, and follower/non-follower labels wrap awkwardly.
- Not Following Back: `back to overview` wraps to two lines.
- Not Following Back: header/subtitle area feels compressed in this range.
- Not Following Back: comparison summary line is too wide and starts pressing past the comfortable content width.
- Not Following Back: top stat cards are getting tight.

## 1024

- Help: guide-mode buttons on the left are clipped/cut off at the viewport edge.
- Workspace rail: `relationship signals` rows are too cramped; labels and values collide and some text spills outside the card.
- Workspace overview: `reach mix` legend spills outside the card and follower/non-follower labels are too cramped.
- Workspace overview: `gender split` labels/values fall outside the card edge.
- Workspace overview: day labels in the follower activity chart (`mon` through `sun`) are too cramped together.
- Workspace overview: `audience movement` stat columns feel cramped and underspaced.
- Workspace overview: `overview window` wraps to two lines; keep as a one-line presentation if possible.
- Workspace overview: profile-card `overview window` subtitle should stay on one line if possible.
- Workspace overview: metric-card icon spacing feels inconsistent because longer headings push icons farther right than shorter headings.
- Not Following Back: header/subtitle area is compressed; subtitle should ideally stay one line if the layout allows, but a cleaner two-line treatment is acceptable.
- Not Following Back: top stat-card copy falls outside the cards and the card row is no longer fitting cleanly.
- Not Following Back: list-row action icons collapse into a messy stacked cluster in tighter widths.

## 900

- Home: nav/header loses cohesion and starts feeling broken in this range.
- Home: `scroll to explore` should likely be hidden in narrower tablet widths.
- Home: dataset-tools section likely needs a more compact presentation in this range instead of showing the full nine-card layout unchanged.
- Home: `how it works` steps are stacking vertically; consider a more condensed horizontal presentation in this range.
- Home: results-preview `tools unlocked` block likely adds too much vertical weight in this range; consider hiding it.
- Home: footer layout breaks down badly in this range; columns feel disconnected, spacing is awkward, and the logo/support content no longer compose well together.
- Dataset creation: quick-tips content likely adds too much weight in this range; consider hiding or heavily reducing it so the upload action stays primary.
- Workspace/tool routes: no longer honestly workable in this range; layout becomes too extended and difficult to review or use comfortably.

## 768

- Pending audit.

## Phone

- Pending audit.
