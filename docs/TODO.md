# TODO — Paperless AI Enhanced

**Created:** December 3, 2025
**Last reviewed:** February 18, 2026
**Status:** In Progress

---

## 🚨 Security

### NPM Vulnerabilities

Most dependencies were updated via `npm audit fix`. One remaining issue:

- [ ] **brace-expansion** is still at `1.1.12` — needs `>= 1.1.13` to resolve [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw). Run `npm update brace-expansion` and verify in `package-lock.json`.
- [ ] **@eslint/plugin-kit** `< 0.3.4` — RegExp DoS via ConfigCommentParser ([GHSA-xffm-g5w8-qvg7](https://github.com/advisories/GHSA-xffm-g5w8-qvg7)). Dev dependency only. Fix with `npm update eslint`.

### API Security

- [ ] Implement rate limiting on API endpoints
- [ ] Review CORS configuration in `server.js`
- [ ] Document the API key rotation process

### Docker Security

- [x] PUID/PGID environment variables are now applied at runtime via Docker entrypoint (`docker/entrypoint-node.sh`) with `usermod`/`groupmod` before dropping privileges.

---

## 📦 Dependency Maintenance

These are ongoing — no single fix resolves them permanently:

- Keep `openai`, `express`, `better-sqlite3`, `nodemon`, `eslint`, `prettier` up to date (`npm outdated`)
- Keep Python packages current (`pip list --outdated`), particularly `fastapi`, `chromadb`, `sentence-transformers`, and `torch`

---

## 🔧 GitHub Workflow

- [ ] Verify the GHCR workflow (`docker-ghcr.yml`) has been successfully run end-to-end — trigger manually via GitHub Actions UI with a test tag before relying on it for releases.

---

## 🐛 Code Quality

- [ ] Run a Markdown lint/cleanup pass across remaining docs (`README.md`, `docs/website/*.md`, `AGENTS.md`) to keep formatting consistent. Low priority / cosmetic.

---

## 🚀 Performance & Optimisation

### Docker

- [ ] Create or audit `.dockerignore` to ensure build context is clean
- [x] Review COPY layer ordering in Dockerfile for optimal cache reuse
- [x] Run RAG service in dedicated container with env-configurable port (`RAG_SERVICE_PORT`), and configure Node app to connect via `RAG_SERVICE_URL`.

### Database

- [ ] Review SQLite indexes in `models/document.js`
- [ ] Add a cron job for SQLite `VACUUM` / optimisation
- [ ] Document ChromaDB performance tuning

### Caching

- [ ] Implement response caching for frequent API calls
- [ ] Review thumbnail cache management (partially implemented)

---

## 📚 Documentation

### API Docs

- [ ] Audit Swagger docs for completeness — add example requests for all endpoints

### Deployment

- [ ] Docker Compose production example
- [ ] Kubernetes deployment YAML
- [ ] Update / migration guide
- [ ] Backup & restore procedure

### Developer Docs

- [ ] Testing guide (unit / integration)
- [ ] Expand contributing guidelines

---

## 🧪 Testing

### Automated Tests

- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical workflows
- [ ] RAG service tests (Python)

### CI/CD

- [ ] GitHub Actions workflow that runs the test suite
- [ ] Automated security scanning (Snyk / Dependabot)
- [ ] Code coverage tracking

---

## 🎯 Features & Improvements

### Monitoring & Logging

- [ ] Structured logging (winston or pino)
- [ ] Prometheus metrics endpoint
- [ ] Error tracking (e.g. Sentry)

### RAG Service

- [ ] Expose vector search performance metrics
- [ ] Improve multi-language support
- [ ] Make embedding model configurable at runtime

### UI/UX

- [ ] Dark mode support
- [ ] Multi-language UI
- [ ] Audit mobile-responsive design

---

## ✅ Completed

- [x] PR #772: Infinite retry loop fix
- [x] PR #747: History cleanup tool
- [x] NPM security vulnerabilities resolved (form-data, axios, validator, tar-fs, glob, js-yaml)
- [x] Multi-stage Docker build implemented (python-builder → node-builder → runtime)
- [x] Build-layer caching with `--mount=type=cache`
- [x] `cap_drop: ALL` in `docker-compose.yml`
- [x] `no-new-privileges: true` in `docker-compose.yml`
- [x] Dynamic health-check port in Dockerfile (`${PAPERLESS_AI_PORT:-3000}`)
- [x] Swagger / OpenAPI documentation implemented
- [x] Contributor documentation consolidated in `AGENTS.md` and `docs/`
- [x] GitHub workflow migrated from Docker Hub to GHCR (uses `GITHUB_TOKEN` — no external secret needed)
- [x] pydantic pinned to `>= 2.12.5` in `rag_service/pyproject.toml`
- [x] test-pr772-fix.js test added

---

**Next review:** After integration test suite is in place
**Owner:** Repository owner
