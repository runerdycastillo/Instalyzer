# Next.js Migration Day 1

## Purpose

This document defines the first focused work session for the Next.js migration.

The goal of Day 1 is not to migrate the whole app.

The goal is to create a clean foundation so every later migration step becomes easier.

## Day 1 Outcome

By the end of Day 1, we want:

- a new Next.js app created in a separate folder
- the initial route skeleton in place
- global styling/theme foundations started
- assets available to the new app
- a clear place for extracted Instagram parsing logic

If those pieces are done, Day 1 is a success.

## Day 1 Rule

Do not try to port the full homepage, workspace, and tool logic on Day 1.

Day 1 is for foundation only.

## Scope

### In scope

- scaffold the new Next.js app
- choose the app folder location
- set up the base route structure
- copy or expose static assets for reuse
- create the first shared layout files
- establish global CSS/theme tokens
- create folders for components and reusable logic

### Out of scope

- full homepage port
- full help page port
- upload parser migration
- dataset creation flow migration
- workspace migration
- `Not Following Back` migration
- auth
- backend
- billing

## Recommended Folder

Recommended new app folder:

`next-app/`

Reason:

- keeps the static prototype intact
- makes side-by-side migration easier
- reduces the risk of mixing old and new architecture too early

## Day 1 Task List

### 1. Create the Next.js app

Target:

- create a fresh Next.js app inside `next-app/`

Suggested setup direction:

- App Router
- TypeScript
- ESLint
- `src/` optional, but not required

Success check:

- the new app exists and can run locally

### 2. Create the first route skeleton

Create placeholder routes for:

- `/`
- `/help`
- `/app`
- `/app/datasets`
- `/app/datasets/new`
- `/app/datasets/[datasetId]`
- `/app/datasets/[datasetId]/tools/not-following-back`

Success check:

- every route renders a simple placeholder page without errors

### 3. Set up base layouts

Create:

- root layout
- marketing layout
- workspace/app layout

Success check:

- marketing routes and app routes can evolve independently

### 4. Bring over static assets

Make the current images and logos available to the Next.js app.

Priority assets:

- logo files
- hero image
- export guide image-flow assets

Success check:

- the new app can reference existing visual assets cleanly

### 5. Establish global style foundations

Set up:

- global CSS file
- theme tokens
- base typography
- background tokens
- shared surface/button primitives later if time allows

Important note:

Do not try to fully port `styles.css` on Day 1.

Only establish the base design language.

Success check:

- the new app already feels like the same product family

### 6. Create the reusable code folders

Create the first folders for:

- shared components
- layout components
- dataset components
- tool components
- Instagram parsing logic
- utility helpers

Suggested direction:

```text
next-app/
  app/
  components/
  lib/
    instagram/
    utils/
```

Success check:

- the new app has an intentional structure before real migration begins

### 7. Add simple placeholder pages with route labels

Each placeholder page should clearly show:

- what route it is
- whether it belongs to marketing or workspace

This keeps navigation sanity high during early migration.

Success check:

- it is easy to verify that the route structure is correct

## Nice To Have If Time Allows

These are optional for Day 1:

- shared nav component shell
- shared app shell component
- imported font setup
- copied color tokens from the current stylesheet
- first draft of a button component

These are nice wins, but not required for Day 1 success.

## What Not To Do On Day 1

Avoid these traps:

- do not start rewriting the full homepage
- do not start migrating the upload parser unless the app shell is already done
- do not start rebuilding the tool UI
- do not get pulled into auth or backend setup
- do not spend the whole session polishing styles

The point of Day 1 is to leave behind a clean construction site.

## Definition Of Done

Day 1 is done when:

- `next-app/` exists
- the app runs
- the route skeleton exists
- layouts exist
- assets are available
- base theme/global styles exist
- folders for extracted logic are in place

That is enough.

## Best Next Step After Day 1

Once Day 1 is complete, the best Day 2 target is:

`port the marketing homepage into the new Next.js app`

Why:

- it gives immediate visible progress
- it uses the polished static page as a reference
- it helps lock the shared visual system before the deeper app pages

## Working Reminder

The migration should feel like:

- one clean layer at a time

Not:

- one giant rewrite

If Day 1 only gives us the foundation, that is still strong progress.
