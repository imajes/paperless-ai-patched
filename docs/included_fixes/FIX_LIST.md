# Fix List Index

This is the repository-level index of integrated fixes, patches, and major post-fork improvements.

## Directory-Backed Fixes

| ID | Category | Summary | Path |
|----|----------|---------|------|
| PR-772 | Upstream PR | Infinite retry loop and backoff fix | [`PR-772-infinite-retry-fix/`](PR-772-infinite-retry-fix/) |
| PR-747 | Upstream PR | History validation cleanup tooling | [`PR-747-history-cleanup/`](PR-747-history-cleanup/) |
| PERF-001 | Performance | SQL pagination and tag cache optimization | [`PERF-001-history-pagination/`](PERF-001-history-pagination/) |
| SEC-001 | Security | SSRF and code injection protections | [`SEC-001-ssrf-code-injection/`](SEC-001-ssrf-code-injection/) |
| SEC-002 | Security | urllib3 decompression-bomb fix (CVE-2026-21441) | [`SEC-002-urllib3-cve-2026-21441/`](SEC-002-urllib3-cve-2026-21441/) |
| DOCKER-001 | Docker | Optimized image builds and runtime footprint | [`DOCKER-001-optimize-images/`](DOCKER-001-optimize-images/) |
| DOCKER-002 | Docker | Node.js 24 LTS upgrade | [`DOCKER-002-upgrade-nodejs-24-lts/`](DOCKER-002-upgrade-nodejs-24-lts/) |
| DEP-001 | Dependency | Removed unused sqlite3 dependency | [`DEP-001-remove-sqlite3/`](DEP-001-remove-sqlite3/) |
| DEP-002 | Dependency | OpenAI SDK v6 and GPT-5 migration stream | [`DEP-002-openai-v6-upgrade/`](DEP-002-openai-v6-upgrade/) |
| UI-001 | UI/UX | Hide RAG menu in Lite image | [`UI-001-hide-rag-menu-lite/`](UI-001-hide-rag-menu-lite/) |
| UI-002 | UI/UX | System prompt extracted to markdown | [`UI-002-system-prompt-extraction/`](UI-002-system-prompt-extraction/) |
| CI-001 | CI/CD | Automatic version tagging | [`CI-001-auto-version-tagging/`](CI-001-auto-version-tagging/) |

## Major Workstream Summary (`075671c`..`HEAD`)

| Commit(s) | Type | Summary |
|-----------|------|---------|
| `d19f7e8` | `feat` | Migrated OpenAI integration to Responses API with schema validation |
| `a961230`, `b1c996f` | `refactor`/`fix` | Removed deprecated GPT model references and old provider paths |
| `c290028`, `986ed78`, `fd15c7c` | `feat`/`fix`/`test` | Added model token/context limits, GPT-5 temperature logic, and integration tests |
| `824c76a`, `ba7d720` | `feat` | Reorganized docs and reduced stale/noisy TODO content |
| `bf26c8e` | `chore(openapi)` | Moved OpenAPI spec/files to `docs/openapi` and updated code references |
| `23062aa`, `7544ba4` | `refactor`/`chore` | Moved Python RAG service to `rag_service`, migrated to `uv` + `Justfile`, and applied formatter/linter fixes |
| `554d40d` | `refactor(docker,rag)` | Split Node/RAG containers, added UID/GID mapping, optimized Docker layers, and switched RAG to env-configured port |

## Maintenance Note

When adding a new fix:
1. Add or update the relevant folder in `docs/included_fixes/`.
2. Keep `docs/included_fixes/README.md` focused on folder usage guidance.
3. Update this file with new entries so the catalog remains canonical.
