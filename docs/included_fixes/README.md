# Included Fixes Folder Guide

This folder stores fix documentation and patch notes for this fork.
The complete fix inventory lives in [`FIX_LIST.md`](FIX_LIST.md).

## What Lives Here

- One folder per fix, for example `PR-772-infinite-retry-fix/` or `SEC-002-urllib3-cve-2026-21441/`
- A local `README.md` in each fix folder with:
  - background/context
  - implementation summary
  - verification notes
  - upstream status (if applicable)
- The consolidated index in `FIX_LIST.md`

## Naming Conventions

- Upstream PRs: `PR-<number>-<short-slug>/`
- Internal fixes: `<AREA>-<number>-<short-slug>/` (examples: `DEP-002-*`, `DOCKER-001-*`)
- Keep slugs short and stable; avoid renaming directories after links are shared.

## How To Add Or Update A Fix

1. Create or update the fix directory under `docs/included_fixes/`.
2. Edit that folder's `README.md` with what changed and how to validate it.
3. Add or update the entry in [`FIX_LIST.md`](FIX_LIST.md).
4. If this is a major multi-commit stream, include a compact summary row in the workstream section of `FIX_LIST.md`.

## Maintenance Checklist

- Links in `FIX_LIST.md` resolve correctly.
- IDs match commit or PR references.
- Status wording stays consistent (`Applied`, `Merged`, `Superseded`).
