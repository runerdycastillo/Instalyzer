# Migration Session Handoff

## Current Status

We began the Next.js migration setup and completed the first successful scaffold step.

A new Next.js app was created successfully at:

`C:\Users\SYK\OneDrive\Desktop\Projects\instalyzer-next`

The current static prototype still lives at:

`C:\Users\SYK\OneDrive\Desktop\Projects\f&f`

## Important Setup Lesson

The original static repo folder name `f&f` caused problems for `create-next-app` on Windows because the `&` character interfered with tooling and install scripts.

Because of that, the migration setup was changed to use cleaner folder names and a shared parent folder.

## Agreed Folder Plan

The intended final local folder structure is:

```text
instalyzer-workspace/
  instalyzer-static/
  instalyzer-next/
```

Where:

- `instalyzer-static` = renamed version of the current `f&f` static prototype
- `instalyzer-next` = the new Next.js app

## Agreed Next Manual Steps

Before reopening VS Code:

1. close terminal tabs
2. close both VS Code windows
3. create a new parent folder named `instalyzer-workspace`
4. move `f&f` into that folder
5. rename `f&f` to `instalyzer-static`
6. move `instalyzer-next` into that same parent folder
7. open `instalyzer-workspace` in VS Code

## What To Do First After Reopening

Once `instalyzer-workspace` is open in VS Code, the next steps are:

1. confirm both folders are visible:
   - `instalyzer-static`
   - `instalyzer-next`
2. open a terminal in `instalyzer-next`
3. run:

```powershell
npm run dev
```

4. confirm the default Next.js app starts successfully

If that works, Day 1 setup continues with:

- route skeleton
- base layouts
- theme/global style foundation

## Day 1 Documents To Use

Use these docs to resume:

- `docs/nextjs-migration-playbook.md`
- `docs/nextjs-migration-day-1.md`
- `docs/migration-session-handoff.md`

## Resume Prompt

When resuming, use this summary:

`We already created the Next.js app successfully in instalyzer-next. We are renaming f&f to instalyzer-static and placing both instalyzer-static and instalyzer-next inside instalyzer-workspace. Next step after reopening is to run npm run dev in instalyzer-next and continue Day 1 setup.`
