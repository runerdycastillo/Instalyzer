# Startup Workflow

Use this when you want the local Instalyzer app running.

## Command

From the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\startup.ps1
```

## What It Starts

- `instalyzer-next` on `http://localhost:3000`

## Team Shortcut

If you tell Codex `startup`, that means:

- launch the Next dev server
- treat the current app polish or feature work as the focus unless you redirect
