# Startup Workflow

Use this when you want both local app surfaces running together.

## Command

From the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\startup.ps1
```

## What It Starts

- `instalyzer-next` on `http://localhost:3000`
- `instalyzer-static` on `http://localhost:5500`

## Team Shortcut

If you tell Codex `startup`, that means:

- launch the Next dev server
- launch the static local server
- treat overview and workspace polish as the current focus unless you redirect
