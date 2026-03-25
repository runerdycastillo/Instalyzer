# Next.js Migration Playbook

## Purpose

This document defines the recommended migration sequence from the current static prototype to a Next.js application.

It is meant to answer:

- what the first migration step should be
- what to preserve from the current repo
- what should be rewritten instead of ported directly
- what order the new app should be built in
- what risks to avoid during migration

This is the working migration playbook for the repo, not just a high-level idea note.

## Current Repo Assessment

The current repo is a static prototype with a stronger product model than its technical structure.

What is already strong:

- the product direction is clear
- the dataset-first workflow is clear
- the route model for the future app is already mostly defined
- the upload and parsing logic already proves the core product
- the current static pages are polished enough to use as a visual reference

What is temporary:

- static HTML page structure
- DOM-heavy JavaScript architecture
- iframe-based tool embedding
- localStorage-first persistence
- single large shared stylesheet
- no real application runtime or package setup yet

Bottom line:

The repo is ready for a framework migration, but it should be treated as a product-and-logic extraction project, not as a literal page conversion.

## Migration Principle

Use this rule throughout the migration:

`preserve product logic and visual direction, replace prototype architecture`

That means:

- preserve the dataset model
- preserve the parser behavior
- preserve the route flow
- preserve the polished UI direction
- do not preserve the current DOM wiring blindly
- do not preserve the iframe tool architecture
- do not preserve the localStorage-centered app model as the long-term structure

## Recommended Next Step

The best immediate next step is:

`create a new Next.js app in a separate folder inside this repo and migrate into it incrementally`

Do not begin by editing the current static files into React in place.

Why:

- the current app has no package/build setup
- the new app needs a clean route structure
- the static build should remain available as the visual reference during migration
- separating the new app reduces accidental breakage and makes it easier to compare old vs new

## Source Of Truth During Migration

Treat the current files as the source of truth for these areas:

### Visual reference

- `home.html`
- `export-guide.html`
- `styles/styles.css`

### Product model and architecture direction

- `docs/instagram-workspace-internal-spec.md`
- `docs/dataset-schema-and-overview.md`
- `docs/future-tool-opportunities-from-export.md`
- `docs/future-nextjs-structure.md`
- `docs/build-roadmap.md`

### Proven parsing and tool logic

- `script/home-datasets.js`
- `script/script.js`

## What To Reuse

These parts should be reused conceptually or directly extracted into modules.

### Reuse directly or with light refactor

- ZIP extraction logic
- JSON file detection logic
- follower/following classification logic
- profile extraction logic
- insight extraction logic
- relationship metric calculation
- export range detection logic
- dataset payload assembly logic
- `Not Following Back` comparison logic

### Reuse conceptually

- homepage section order
- export guide content and visual guide flow
- dataset-first onboarding flow
- workspace overview information hierarchy
- tool naming and product language
- current theme tokens, spacing rhythm, and surface styling

### Reuse as data/model contracts

- dataset schema from `docs/dataset-schema-and-overview.md`
- route model from `docs/future-nextjs-structure.md`
- tool roadmap from `docs/future-tool-opportunities-from-export.md`

## What To Rewrite

These parts should be rebuilt for the new app rather than ported directly.

### Rewrite completely

- document-wide DOM query and event wiring
- modal state handling through direct element toggling
- `localStorage` as the app-wide source of truth
- iframe-based embedding of the `Not Following Back` tool
- page/view switching based on HTML boot scripts
- giant shared page script structure

### Rewrite into React/Next primitives

- page layouts
- navigation
- create-dataset flow
- dataset list rendering
- workspace rendering
- tool rendering
- theme provider behavior
- empty states
- detail panels and drawers

### Rewrite into better styling structure

- split the single stylesheet into:
  - app-level global tokens/base styles
  - route-level styles
  - component-level styles

## Proposed App Shape

Recommended root route flow:

- `/`
- `/help`
- `/app`
- `/app/datasets`
- `/app/datasets/new`
- `/app/datasets/[datasetId]`
- `/app/datasets/[datasetId]/tools/not-following-back`

Optional route note:

- if preserving the exact current export-guide path is valuable, `/export-guide` can redirect to or mirror `/help`

## Recommended Folder Direction

One clean starting direction:

```text
next-app/
  app/
    (marketing)/
      page.tsx
      help/page.tsx
    (workspace)/
      app/page.tsx
      app/datasets/page.tsx
      app/datasets/new/page.tsx
      app/datasets/[datasetId]/page.tsx
      app/datasets/[datasetId]/tools/not-following-back/page.tsx
    layout.tsx
    globals.css
  components/
    marketing/
    datasets/
    tools/
    layout/
    ui/
  lib/
    instagram/
      zip.ts
      classify.ts
      profile.ts
      insights.ts
      relationships.ts
      dataset.ts
    storage/
    utils/
  public/
    assets/
```

This does not need to be final forever. It is a clean migration target.

## Migration Sequence

Build in this order.

### Phase 1: Create the New App Shell

Goal:

Get the Next.js app running with the right route skeleton before porting product logic.

Tasks:

- scaffold the new Next.js app in a separate folder
- add TypeScript if desired from the start
- copy static assets into the new app public folder
- establish global theme tokens and base styles
- add the main marketing layout and app layout shells
- create placeholder routes for the target flow

Success criteria:

- the new app runs locally
- routes exist even if content is temporary
- the visual direction starts from the existing design language

### Phase 2: Extract Pure Domain Logic

Goal:

Separate the reusable Instagram data logic from DOM-specific code.

Tasks:

- extract ZIP reading helpers
- extract JSON classification helpers
- extract follower/following normalization helpers
- extract profile parsing helpers
- extract insight parsing helpers
- extract relationship metric helpers
- extract dataset-building helpers
- extract `Not Following Back` computation helpers

Rule:

Every extracted module should work without touching the DOM.

Success criteria:

- data parsing works in isolated modules
- UI components no longer depend on legacy scripts directly

### Phase 3: Port Marketing Routes

Goal:

Rebuild the marketing-facing pages first so the new app gains visible momentum quickly.

Tasks:

- rebuild the homepage from `home.html`
- rebuild the export guide page from `export-guide.html`
- preserve the section order, copy direction, and visual feel
- simplify where useful, but do not drift from the current product story

Success criteria:

- `/` feels like the current polished homepage
- `/help` feels like the current guide page

### Phase 4: Rebuild Dataset Creation Flow

Goal:

Create the real route-based dataset onboarding flow.

Tasks:

- convert the current modal flow into a proper page or page-plus-dialog flow
- support ZIP upload
- validate files
- show review summary
- collect dataset name and optional notes
- create a dataset record in temporary local persistence first

Important note:

The modal can remain visually similar, but the state model should be rebuilt cleanly.

Success criteria:

- a user can create a dataset in the Next app without relying on the legacy pages

### Phase 5: Rebuild Dataset Workspace

Goal:

Move the overview experience into the real app structure.

Tasks:

- create datasets index page
- create single dataset workspace page
- render trusted overview metrics
- render profile header and dataset metadata
- render available tools list
- render empty states and locked states cleanly

Success criteria:

- the dataset workspace becomes the center of the new app

### Phase 6: Rebuild Tool 1 Natively

Goal:

Replace the iframe tool model with a route-native tool page.

Tasks:

- port `Not Following Back` logic into React components
- remove cross-window messaging
- remove iframe embedding
- preserve CSV export behavior
- preserve eligibility gating around all-time export range

Success criteria:

- `/app/datasets/[datasetId]/tools/not-following-back` works without the legacy tool page

### Phase 7: Replace Temporary Persistence

Goal:

Move from browser-only prototype persistence toward real app persistence.

Tasks later:

- add auth
- add dataset ownership
- add server storage / database model
- add upload processing strategy
- add saved outputs and result history

Rule:

Do not block the UI migration on backend completeness.

## Exact Keep / Rewrite Split By Current File

### `home.html`

Keep:

- section structure
- copy direction
- visual hierarchy
- workspace layout ideas

Rewrite:

- page structure as React route components
- modal into app state and components
- view toggling logic

### `export-guide.html`

Keep:

- guide content
- quick guide structure
- visual guide assets and sequence
- CTA intent

Rewrite:

- tab state
- modal invocation/state handling
- page implementation

### `index.html`

Keep:

- tool purpose only

Rewrite:

- entire implementation into a native route page

### `script/home-datasets.js`

Keep:

- parser logic
- dataset shaping logic
- range detection logic
- metric extraction logic

Rewrite:

- DOM wiring
- modal wiring
- page rendering
- iframe communication
- storage orchestration

### `script/script.js`

Keep:

- username parsing utilities
- relationship comparison logic
- CSV export logic concept
- eligibility gating concept

Rewrite:

- full page rendering
- message-based embedding behavior
- localStorage-driven tool UI state

### `styles/styles.css`

Keep:

- theme variables
- spacing/material direction
- component styling reference

Rewrite:

- organization and delivery structure

## Biggest Risks To Avoid

### Risk 1: Porting the prototype architecture instead of the product

Symptom:

- React components become wrappers around old assumptions

Avoid by:

- extracting pure logic first
- rebuilding UI state intentionally

### Risk 2: Doing styling invention during migration

Symptom:

- migration slows down because every route becomes a redesign exercise

Avoid by:

- using the current static app as the visual reference
- changing design only when there is a real product reason

### Risk 3: Keeping iframe-based tool boundaries

Symptom:

- the new app still behaves like multiple stitched mini apps

Avoid by:

- migrating Tool 1 into a first-class route component

### Risk 4: Letting `localStorage` become the long-term app model

Symptom:

- app state becomes hard to evolve into auth and persistence

Avoid by:

- isolating temporary client persistence behind a small storage layer

### Risk 5: Migrating too many future tools too early

Symptom:

- the migration gets diluted across unfinished feature work

Avoid by:

- migrating only the validated workflow first:
  - homepage
  - help
  - dataset creation
  - dataset workspace
  - Tool 1

## First Implementation Pass Recommendation

If starting immediately, the best first build sequence is:

1. scaffold the Next.js app
2. set up global styling tokens and layouts
3. create route placeholders
4. extract Instagram parsing modules
5. port the homepage
6. port the export guide page
7. rebuild dataset creation
8. rebuild dataset workspace
9. port `Not Following Back`

This order gives:

- visible progress quickly
- lower migration risk
- a clean foundation for later auth/backend work

## Definition Of A Successful Migration MVP

The migration MVP is successful when this flow works inside the Next.js app:

`landing page -> help page -> create dataset -> datasets list -> dataset workspace -> not following back tool`

And when these conditions are true:

- the app no longer depends on the legacy static pages for primary usage
- the dataset model is preserved
- Tool 1 works natively
- the UI still matches the current product direction closely
- the architecture is ready for auth and persistent storage next

## Recommended Working Rule For The Repo

Until the migration MVP is complete:

- keep the static prototype untouched except for urgent reference fixes
- do new migration work in the new Next.js app folder
- use the docs and static pages as the source of truth
- only bring over logic that is still valid in the product model

## Final Recommendation

The best migration path is not:

- `convert these HTML files into JSX`

The best migration path is:

- `build the real app structure in Next.js using the current prototype as the reference implementation`

That is the cleanest path to preserving what is already working while avoiding prototype architecture debt in the new app.
