# Instagram Workspace Internal Spec

## Vision

Build a dataset-based Instagram SaaS where users upload their Instagram export once, create reusable datasets, and run multiple tools against those datasets.

The product is not a single unfollow checker. The product is an Instagram dataset workspace with tools.

Core model:

`Instagram export -> processed dataset -> dataset workspace -> multiple tools -> results`

## Product Positioning

Working positioning:

`Upload your Instagram export once, create a reusable dataset, and run AI-powered tools to analyze and improve your account.`

Preferred category language:

- Instagram dataset workspace
- Instagram intelligence workspace

Guidance:

- Use `workspace` or `platform` for the product identity.
- Use `analyzer` as a capability or tool type inside the platform.
- `Not Following Back` is Tool 1, not the whole brand.

## Core Product Model

Primary object:

`Dataset`

Definition:

A dataset is a processed Instagram export that stores normalized account data, metadata, and tool-ready records for repeated use across multiple tools.

Each dataset should eventually contain:

- import source context
- normalized follower/following records
- metadata
- dataset name
- notes
- creation timestamps
- tool-compatible derived records
- saved outputs/history later

## Core Workflow

1. User lands on homepage
2. User uploads Instagram export
3. System validates and processes files
4. User reviews upload summary
5. User names dataset and adds optional notes
6. System creates dataset
7. User enters dataset workspace
8. User selects a tool
9. Tool runs against dataset
10. User reviews results

Key principle:

`Upload once. Use many times.`

## Export Requirements

Current rule:

- `JSON` export format is required for the current product

Current recommendation:

- use `medium` media quality by default
- choose the date range based on what you want to analyze
- for relationship tools such as `Not Following Back`, prefer `all time` export range

Future compatibility direction:

- `HTML` export support may be added later if it meaningfully reduces user friction
- do not broaden format support until the JSON-first dataset model is stable

Important note:

- shorter export ranges may still be useful for insight-style tools
- they are weaker for relationship tools because the app needs the broadest possible follower/following account list
- an incomplete relationship export can make `Not Following Back` inaccurate enough to risk wrong unfollow decisions

## Main Pages

### Homepage

Purpose:

Explain the platform, drive dataset creation, and preview tool value.

Recommended section order:

- hero
- tool preview section
- short "how it works" section
- example insights / outputs section
- pricing / CTA section

Homepage rules:

- the hero should act like a true landing-page hero, not a boxed dashboard card
- the hero background can span the full viewport width under the nav
- hero copy should stay concise and conversion-focused
- the dataset sidebar should not appear on the landing hero; keep that for overview/workspace context
- the homepage should move from:
  - problem
  - to tools
  - to explanation
  - to conversion

How `how it works` should be scoped:

- do not split `how it works` and `tutorial` into two separate major homepage sections if they repeat the same job
- keep one stronger explanatory section that covers:
  - export your Instagram data
  - upload it
  - create a dataset
  - unlock tools
- treat tutorial/help as supporting content inside or attached to `how it works`, not as a separate primary landing-page block

Why tools should appear immediately after the hero:

- tools are the real hook
- users are more likely to think:
  - `I want to see who is not following me back`
- not:
  - `I want an Instagram dataset workspace`
- the landing page should quickly communicate:
  - `upload your export -> unlock these tools`

Tools section presentation direction:

- do not present tools as plain text-only cards
- make the tools feel like mini dashboards or believable product previews
- show fake-but-plausible preview UI for each tool state so the section feels concrete
- connect each tool preview back to:
  - what the tool does
  - what data it uses
  - what output the user gets

Pricing / CTA note:

- pricing can be introduced as a mock or placeholder conversion section for now
- even before final pricing is decided, the section should still function as a strong bottom-of-page CTA

### Datasets List

Purpose:

Show all user datasets and allow entry into a specific dataset workspace.

Core elements:

- dataset cards/list
- create dataset button
- dataset status/meta
- search/filter later

### Dataset Workspace

Purpose:

Central operating page for one dataset.

Core elements:

- dataset name
- created date
- notes
- dataset overview metrics
- available tools
- recent outputs/history later

### Tool Page

Purpose:

Run a specific tool against a selected dataset and review outputs.

Core elements:

- tool name
- dataset context
- tool controls
- result panels
- export/copy actions where relevant

## Dataset Workspace Metrics

Base workspace metrics should stay factual and directly supported by the data.

Recommended base metrics:

- follower total from insights
- accounts reached
- profile visits
- external link taps
- content interactions
- accounts engaged
- impressions
- detected insight range when available
- dataset created date

Supporting overview metadata can still include:

- dataset name
- import source
- detected categories
- profile identity fields such as username, display name, and profile photo

Advanced inferred insights such as engagement rate, active hour, or account activity patterns should not be treated as base dataset metrics unless the export clearly supports them. Those belong in tools.

## Tool System

Architecture:

One dataset can power multiple tools.

### Tier Planning Direction

Do not force an even tool split such as:

- free = 3 tools
- basic = 3 tools
- premium = 3 tools

That structure is easy to mock visually, but it weakens the feeling of upgrade value.

The better current planning direction is:

- free = `1-2` core tools
- basic = `4-5` practical creator tools
- premium = `7-9` total tools, advanced summaries, or richer reporting layers

Reason:

- free should prove value without giving away too much
- basic should feel like the first real unlock
- premium should feel like a broader toolkit, not just a slightly different card row

Important rule:

- do not promise tool counts that the export data cannot realistically support
- use this as a pricing and packaging direction, not a hard feature guarantee
- only list tools in tiers once the data support and product definition are defensible

Practical interpretation for Instalyzer:

- free should likely center on relationship proof-of-value tools
- basic should unlock the first genuinely useful creator insight set
- premium should combine the broadest tool access with stronger summary/report outputs

### MVP Tool

`Not Following Back`

Current role:

Tool 1 and proof of concept for the platform. It now runs inside the dataset workspace main panel rather than standing alone as the whole product.

Core capabilities:

- compare following vs followers
- identify users who do not follow back
- review/manage results
- export results as CSV
- support workflow handling
- apply stricter relationship-tool guidance when a dataset is not verified as `all time`

### Near-Term Tools

- Mutuals / relationship analysis
- Ghost follower analysis
- Audience/activity insights

### Later Tools

- Posting-time recommendations
- AI growth recommendations
- exportable creator/account reports

Tool rule:

Every tool must define:

- input data used
- transformation/logic performed
- output shown to user
- trust basis for the output

## Naming Guidance

Preferred language:

- Dataset Workspace
- Tools
- Insights
- Reports

Less preferred as primary product language:

- Dashboard
- Analyzer as the whole product identity

Model:

- Product = workspace/platform
- Features = tools/analyzers/reports

## Navigation Model

Marketing/account navigation:

- Home
- Login / Signup
- App
- Datasets
- Tools
- Account / Billing later

In-app flow:

- Datasets list
- Dataset workspace
- Tool page
- Results/output view

The dataset workspace should be the center of navigation, not skipped.

## Current Codebase Fit

What already aligns:

- homepage direction
- dataset-first onboarding
- upload and parsing flow
- Tool 1 already exists
- local dataset handoff works

What is temporary:

- static front-end architecture
- prototype-first file structure
- limited persistence model
- no real SaaS backend/auth model yet

## Technical Direction

Current stack:

Static HTML, CSS, and JavaScript.

Assessment:

- good for prototype and workflow validation
- not ideal as the final architecture for a real SaaS

Long-term recommendation:

Move to a proper app architecture once the product structure is locked.

Likely fit:

- Next.js / React app
- backend for users, datasets, jobs, and tool outputs
- persistent storage and processing model

Do not rewrite immediately just for fashion. Rewrite when:

- page structure is stable
- dataset model is clearer
- second and third tools are defined
- auth/account architecture becomes necessary

## Immediate Next Steps

1. Inspect a real Instagram export sample.
2. Define actual available data fields.
3. Decide which future tools are truly supportable.
4. Finalize product naming and page structure.
5. Then decide whether to continue iterating in the current codebase or begin a framework migration.
