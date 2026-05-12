# Responsive QA Matrix

Use this as the working checklist for responsive polish. Test real browser
viewports, not only named device presets, because browser chrome and short
laptop heights are where Instalyzer has been showing the roughest edges.

## Routes To Check First

- `/sign-up`
- `/sign-in`
- `/account`
- `/`
- `/help`
- `/app`
- `/app/datasets`
- `/app/datasets/new`
- `/app/datasets/[datasetId]`
- `/app/datasets/[datasetId]/tools/not-following-back`
- `/contact`
- `/privacy`
- `/terms`
- `/data-deletion-request`

## Desktop And Laptop

| Viewport | Why it matters | Status |
| --- | --- | --- |
| `1920 x 1080` | Large desktop baseline | Not checked |
| `1920 x 940` | Common desktop browser after toolbar/taskbar space | Not checked |
| `1728 x 992` | MacBook Pro scaled desktop-ish browser | Not checked |
| `1536 x 864` | Common Windows laptop scaling | Not checked |
| `1440 x 900` | MacBook/Air style baseline | Not checked |
| `1432 x 712` | Known short laptop pain point from prior audits | Not checked |
| `1366 x 768` | Older/common Windows laptop | Not checked |
| `1280 x 720` | Short desktop stress test | Not checked |
| `1024 x 768` | Workspace minimum edge and small laptop/tablet landscape | Not checked |

## Tablet And Mid-Width

| Viewport | Why it matters | Status |
| --- | --- | --- |
| `1024 x 1366` | iPad Pro portrait, workspace edge behavior | Not checked |
| `1024 x 768` | iPad landscape / workspace boundary | Not checked |
| `912 x 1368` | Surface Pro portrait | Not checked |
| `820 x 1180` | iPad Air portrait | Not checked |
| `768 x 1024` | iPad portrait | Not checked |
| `700 x 900` | awkward mid-width browser | Not checked |

## Mobile

| Viewport | Why it matters | Status |
| --- | --- | --- |
| `430 x 932` | Large modern iPhone | Not checked |
| `414 x 896` | iPhone 11/12 Pro Max class | Not checked |
| `393 x 852` | Modern iPhone default-ish | Not checked |
| `390 x 844` | iPhone 12/13/14 class | Not checked |
| `375 x 812` | iPhone X/mini class | Not checked |
| `375 x 667` | iPhone SE/older small height | Not checked |
| `360 x 740` | Common Android width | Not checked |
| `320 x 568` | Small phone stress test | Not checked |

## Pass Criteria

- First viewport does not feel accidentally cropped.
- Primary action is visible without hunting.
- Text does not overlap, clip, or create awkward one-word lines.
- Cards/forms/buttons keep stable dimensions and do not shift on hover.
- Footer behavior is intentional for the viewport.
- Workspace routes below `1024px` show the desktop gate instead of broken app UI.
- `/sign-up` and `/sign-in` fit normal desktop browser heights without cutting off the trust cards.

## Current Focus

Auth entry pages:

- `/sign-up`
- `/sign-in`
- `/account`

Use the desktop short-height rows first, then sweep tablet and mobile.

For auth behavior and failure-state coverage, use
`docs/auth-state-qa.md` alongside this matrix.
