# Future Next.js App Structure

## Goal

Define the recommended Next.js structure for the future Instagram dataset SaaS.

This document is not a final implementation plan. It is the target app shape the current prototype should grow into once migration starts.

## Why Next.js

Next.js is a good fit once the product becomes a real application with:

- multiple pages and routes
- shared layouts
- auth
- persistent datasets
- tool-specific pages
- server-side processing needs

The current static app is good for validation. The Next.js app should be the production architecture.

## Recommended App Model

The app should have three main layers:

1. Marketing layer
2. Authenticated application layer
3. Tool execution layer

Core concept:

`users own datasets, datasets expose tools, tools produce outputs`

## Recommended Route Structure

### Marketing routes

- `/`
- `/tools`
- `/pricing`
- `/login`
- `/signup`

### Soft-launch marketing trust routes

These are the lean public routes that make the current footer feel complete without pretending the full SaaS surface already exists.

Routes to keep live during soft launch:

- `/contact`
- `/privacy`
- `/terms`

Footer items to defer until the product surface is real:

- `/pricing` once plan packaging is finalized
- `/changelog` once release notes are public-facing
- `/about` once company/about copy is ready
- `/status` once there is a real status page behind it
- `/refund-policy` once paid plans are live
- `/cookie-policy` once tracking/cookie scope needs its own page

### App routes

- `/app`
- `/app/datasets`
- `/app/datasets/new`
- `/app/datasets/[datasetId]`
- `/app/datasets/[datasetId]/tools/[toolSlug]`
- `/app/reports`
- `/app/settings`

### Optional future routes

- `/app/billing`
- `/app/account`
- `/app/outputs/[outputId]`

## Recommended Page Responsibilities

### `/`

Marketing homepage.

Responsibilities:

- product positioning
- hero and CTA
- how dataset workflow works
- tool previews
- tutorial/help entry points

### `/tools`

Tool library / product marketing page.

Responsibilities:

- explain current and future tools
- show what each tool does
- connect tools back to the dataset model

### `/app`

Application home.

Responsibilities:

- quick entry into datasets
- recent datasets
- recent outputs later
- onboarding prompts for new users

### `/app/datasets`

Datasets index.

Responsibilities:

- list datasets
- create new dataset
- search/filter later
- status/meta preview

### `/app/datasets/new`

Dataset creation flow.

Responsibilities:

- upload export
- validate files
- process/stage dataset
- name dataset
- add notes
- create dataset

### `/app/datasets/[datasetId]`

Dataset workspace.

Responsibilities:

- dataset header
- factual overview metrics
- notes
- available tools
- recent outputs later

This should be the center of the product.

### `/app/datasets/[datasetId]/tools/[toolSlug]`

Tool page.

Responsibilities:

- load selected dataset context
- run a specific tool
- display outputs
- support export/copy/save actions

## Recommended Layout Structure

### Marketing layout

Use for:

- homepage
- pricing
- public tools page
- auth pages if desired

Core layout sections:

- top nav
- hero/content area
- footer

### App layout

Use for authenticated app routes.

Core layout sections:

- app sidebar or top navigation
- workspace header
- page content
- utility actions area

## Recommended Data Model Boundaries

### User

Fields later:

- id
- email
- plan
- createdAt

### Dataset

Minimum conceptual fields:

- id
- userId
- name
- notes
- createdAt
- importSource
- importStatus
- summary metrics

### Dataset records

Examples:

- followers
- following
- derived relationship records

### Tool output

Conceptual fields:

- id
- datasetId
- toolSlug
- createdAt
- result metadata
- saved output payload

## Component Direction

The future app should separate shared components from tool-specific components.

### Shared app components

- page shell
- nav
- dataset cards
- dataset header
- metric cards
- upload components
- tool cards
- empty states

### Tool-specific components

- not-following-back result list
- relationship charts later
- report views later

## State Direction

The current prototype stores most state locally. The future app should split state by responsibility:

- route state
- server data
- form state
- transient UI state
- tool execution state

Avoid keeping the whole application as one large front-end script once migration starts.

## Migration Strategy

Recommended migration order:

1. build the marketing homepage in Next.js
2. build datasets index page
3. build dataset creation page
4. build dataset workspace page
5. port Tool 1 into `/app/datasets/[datasetId]/tools/not-following-back`
6. then add auth/backend persistence

This keeps the migration aligned with the real product model.

## What To Preserve From The Current Prototype

Keep conceptually:

- dataset-first onboarding
- upload validation logic
- follower/following parsing logic
- Tool 1 behavior that already works

Do not preserve blindly:

- current file-by-file architecture
- localStorage-first persistence model
- prototype naming that centers the entire product on `f&f`

## Practical Recommendation

When migration starts, the first Next.js build should aim to prove this route flow:

`/ -> /app/datasets -> /app/datasets/new -> /app/datasets/[datasetId] -> /app/datasets/[datasetId]/tools/not-following-back`

If that flow is solid, the rest of the SaaS architecture can expand cleanly.
