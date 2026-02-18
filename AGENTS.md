# Repository Guidelines

## Project Structure & Module Organization
`server.js` is the main Express entry point. API routes are in `routes/`, business logic and provider integrations are in `services/`, and SQLite access lives in `models/document.js`. UI templates are in `views/` with static assets in `public/css` and `public/js`.  
The optional RAG backend runs from `main.py` (FastAPI). Runtime configuration is centralized in `config/config.js` and environment values come from `data/.env` (see `.env.example`).  
Use `tests/` for executable regression scripts and `Included_Fixes/` for documenting integrated fixes in this fork.

## Build, Test, and Development Commands
- `npm install`: install Node dependencies.
- `npm run test`: start local dev server with `nodemon` (this is the current dev script).
- `node tests/test-model-token-limits.js`: run a single regression test script.
- `for f in tests/test-*.js; do node "$f"; done`: run all Node test scripts sequentially.
- `python main.py --host 127.0.0.1 --port 8000 --initialize`: run the Python RAG service locally.
- `docker compose up -d`: run the containerized app from `docker-compose.yml`.

## Coding Style & Naming Conventions
JavaScript uses CommonJS (`require`/`module.exports`) and 2-space indentation. Prettier rules are defined in `prettierrc.json` (`singleQuote: true`, `semi: true`, trailing commas `es5`).  
Lint with ESLint 9 config in `eslint.config.mjs` (recommended + Prettier compatibility).  
Follow existing naming patterns: `services/*Service.js`, route modules in `routes/*.js`, and test files as `tests/test-*.js`. Add Swagger JSDoc blocks for new/changed API endpoints.

## Testing Guidelines
Tests in `tests/` are standalone Node scripts (no Jest/Mocha harness) and fail via non-zero exit codes. Keep tests focused and reproducible, and add/extend tests when changing `services/`, `routes/`, or config parsing logic.  
No enforced coverage threshold exists; contributors should include at least one regression test per bug fix.

## Commit & Pull Request Guidelines
Prefer Conventional Commit prefixes used in project history: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`. Keep subjects concise and imperative.  
Open PRs with: clear summary, linked issue(s), test evidence (commands + results), and screenshots for UI changes. For fork-specific integrations, also document the change under `Included_Fixes/<TYPE>-<NNN>-<slug>/README.md` and update `Included_Fixes/README.md`.

## Security & Configuration Tips
Do not commit secrets, `.env` files, or `data/` contents. Keep API keys in environment variables only.  
When enabling RAG features, verify `RAG_SERVICE_ENABLED=true` and that the Python service is reachable via `RAG_SERVICE_URL`.
