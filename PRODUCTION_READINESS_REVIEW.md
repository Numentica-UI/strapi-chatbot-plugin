# Production Readiness Review - strapi-plugin-faq-ai-bot

Date: 2026-04-02
Reviewer mode: Senior Strapi plugin production-readiness audit

## Package Details (Resolved)
- Package name: strapi-plugin-faq-ai-bot
- Source repo URL: https://github.com/sruthialex12345/strapi-plugin-faq-ai-bot (developer repo, not client deployment)
- Strapi target version: v5 only
- Runtime target: Node >=18 (README), but not enforced in package engines
- Intended use case: AI FAQ chatbot plugin with Strapi admin configuration and public content API chat endpoint

## Scope and Assumptions
- Full code pass on admin, server, routes, services, plugin bootstrap/register, packaging metadata, build scripts, and basic release signals.
- Dynamic validation performed for build/typecheck scripts where possible.
- No live Strapi app or external infrastructure attached in this review.

## Priority Mapping
- P0: Must fix before any production release or external delivery. Security exposure, broken builds, or version-contract problems that make the package unsafe or non-releasable.
- P1: Important next fixes after P0. Reliability, maintainability, and secondary exposure issues that should not be left open for long.

## Priority Summary

### P0
1. Unauthenticated admin config endpoints expose and allow overwrite of secrets.
2. SSRF risk in base-domain validation.
3. Public unauthenticated AI endpoints allow token and billing abuse.
4. Build is not reproducible from package metadata.
5. README compatibility claim is wrong; plugin supports Strapi v5 only.

### P1
6. Usage telemetry endpoint is publicly exposed.
7. Typecheck scripts are broken.
8. Unsafe broad settings persistence and weak input validation.
9. Global admin style injection affects entire Strapi admin UI.
10. Sensitive config logging in server console.
11. Dead or unused controller likely indicates routing drift.
12. Excessive `any` use lowers type safety in critical paths.

## Findings by Severity

### Critical

#### 1) Unauthenticated admin config endpoints expose and allow overwrite of secrets
- Priority: P0
- Why it matters:
  - Anyone with network access to the endpoint can read and modify plugin settings, including `openaiKey`.
  - This is direct secret exposure and full plugin takeover.
- Exact location:
  - `server/src/routes/admin/index.ts:9`
  - `server/src/routes/admin/index.ts:17`
  - `server/src/controllers/config.ts:50`
  - `server/src/controllers/config.ts:63`
  - `server/src/controllers/config.ts:68`
  - `server/src/controllers/config.ts:96`
- Repro steps / failure scenario:
  1. Send `GET /api/faq-ai-bot/collections` without auth.
  2. Response includes `settings` object containing current configuration values.
  3. Send `POST /api/faq-ai-bot/collections` with a new `openaiKey`.
  4. Plugin starts using attacker-provided key/settings.
- Suggested fix:
  - Set `auth: true` for admin routes.
  - Add admin permission action checks (RBAC) in route config or policy.
  - Never return raw `openaiKey`; return masked indicator only.
- Optional patch snippet:
```ts
// server/src/routes/admin/index.ts
config: {
  auth: true,
  policies: ['admin::isAuthenticatedAdmin'],
}
```

#### 2) SSRF risk in base-domain validation (attacker-controlled server-side fetch)
- Priority: P0
- Why it matters:
  - User-supplied URL is fetched from server-side code (`axios.get(parsed.origin)`), enabling internal network probing or metadata endpoint access if not tightly constrained.
  - Combined with unauthenticated config update, impact is severe.
- Exact location:
  - `server/src/controllers/config.ts:34`
  - `server/src/controllers/config.ts:73`
- Repro steps / failure scenario:
  1. POST to `/api/faq-ai-bot/collections` with `baseDomain` set to internal/private host.
  2. Server attempts outbound request to supplied origin.
  3. Can be abused for network discovery/SSRF behavior.
- Suggested fix:
  - Remove live reachability checks, or enforce strict allowlist of hostnames.
  - Block private IP ranges, localhost, link-local, and metadata IPs.
  - Keep validation purely syntactic where possible.

### High

#### 3) Public unauthenticated AI endpoints allow token/billing abuse
- Priority: P0
- Why it matters:
  - `/ask` and `/validate-key` are publicly callable and trigger OpenAI requests.
  - No rate limiting, abuse controls, or payload size validation.
- Exact location:
  - `server/src/routes/content-api/index.ts:17`
  - `server/src/routes/content-api/index.ts:41`
  - `server/src/controllers/ask.ts:892`
  - `server/src/controllers/ask.ts:853`
- Repro steps / failure scenario:
  1. Send high-frequency POST requests to `/api/faq-ai-bot/ask` with long prompts/history.
  2. Observe rising OpenAI usage/cost.
- Suggested fix:
  - Add rate limiting (IP + token bucket) and request size bounds.
  - Validate request shape with schema validator (e.g., Zod/Yup).
  - Consider auth/API key for non-public deployments.

#### 4) Build is not reproducible from package metadata (missing runtime dependency)
- Priority: P0
- Why it matters:
  - `npm run build` fails due unresolved `@fontsource-variable/inter` import.
  - This blocks release reliability and may ship stale or broken artifacts.
- Exact location:
  - `admin/src/index.ts:4`
  - `package.json:34`
- Repro steps / failure scenario:
  1. Run `npm run build`.
  2. Build fails: Rollup cannot resolve `@fontsource-variable/inter`.
- Suggested fix:
  - Add `@fontsource-variable/inter` to dependencies (or remove import).
  - Add CI gate to fail release on build error.

#### 5) Strapi compatibility documentation is incorrect (plugin supports v5 only)
- Priority: P0
- Why it matters:
  - The plugin is v5-only, but the README states Strapi `>=4.x`.
  - This creates a false installation contract and will mislead consumers into unsupported v4 setups.
- Exact location:
  - `README.md:12`
  - `package.json:39`
  - `package.json:51`
  - `admin/src/pages/App.tsx:1`
- Repro steps / failure scenario:
  1. Install plugin into Strapi v4 project based on README.
  2. Encounter incompatible imports/build expectations.
- Suggested fix:
  - Update docs to explicit Strapi v5-only support.
  - Keep peer range and release notes aligned with that support matrix.

#### 6) Usage telemetry endpoint is publicly exposed
- Priority: P1
- Why it matters:
  - `/usage` leaks token consumption and cost estimates.
  - Reveals operational/business telemetry to anonymous callers.
- Exact location:
  - `server/src/routes/content-api/index.ts:30`
  - `server/src/routes/content-api/index.ts:33`
  - `admin/src/components/BasicSettings.tsx:454`
- Repro steps / failure scenario:
  1. GET `/api/faq-ai-bot/usage` anonymously.
  2. Read internal usage and cost data.
- Suggested fix:
  - Move usage endpoint to admin route and require admin auth + RBAC.

### Medium

#### 7) Typecheck scripts are broken (`run` command not found)
- Priority: P1
- Why it matters:
  - Declared QA scripts cannot run in standard environments.
  - CI confidence is reduced and regressions slip through.
- Exact location:
  - `package.json:31`
  - `package.json:32`
- Repro steps / failure scenario:
  1. Run `npm run test:ts:front`.
  2. Fails with `sh: run: command not found`.
- Suggested fix:
  - Replace with direct `tsc` invocations or add proper script runner dependency.

#### 8) Unsafe broad settings persistence and weak input validation
- Priority: P1
- Why it matters:
  - `setConfig(newSettings: any)` merges arbitrary fields into persisted settings.
  - Unbounded payload can store unintended keys or very large objects.
- Exact location:
  - `server/src/services/config.ts:16`
  - `server/src/services/config.ts:47`
  - `server/src/controllers/config.ts:69`
- Repro steps / failure scenario:
  1. POST `collections` with extra nested keys (e.g., huge objects).
  2. Values are merged and persisted without whitelist/schema enforcement.
- Suggested fix:
  - Define strict DTO schema and whitelist allowed keys.
  - Enforce max lengths/counts for arrays and strings.

#### 9) Global admin style injection affects entire Strapi admin UI
- Priority: P1
- Why it matters:
  - Plugin injects `body *` font overrides globally.
  - Can break visual consistency and other plugins.
- Exact location:
  - `admin/src/index.ts:29`
  - `admin/src/index.ts:36`
- Repro steps / failure scenario:
  1. Enable plugin in admin.
  2. Observe fonts overridden across unrelated admin pages.
- Suggested fix:
  - Scope styles to plugin root only.
  - Avoid global `body *` selectors.

#### 10) Sensitive config logging in server console
- Priority: P1
- Why it matters:
  - Debug logging includes complete existing settings object.
  - Depending on log sink, this may expose secrets.
- Exact location:
  - `server/src/controllers/config.ts:87`
- Repro steps / failure scenario:
  1. POST config update.
  2. Inspect logs containing full settings payload.
- Suggested fix:
  - Remove debug log or redact sensitive fields before logging.

### Low

#### 11) Dead/unused controller likely indicates routing drift
- Priority: P1
- Why it matters:
  - `cardMapping` controller exists but no route uses it.
  - Increases maintenance burden and confusion.
- Exact location:
  - `server/src/controllers/cardMapping.ts:1`
  - `server/src/controllers/index.ts:12`
  - `server/src/routes/content-api/index.ts:1`
- Repro steps / failure scenario:
  1. Search routes for `cardMapping` handler.
  2. No route references found.
- Suggested fix:
  - Remove dead controller or add intended route with auth/policies.

#### 12) Excessive `any` use lowers type safety in critical paths
- Priority: P1
- Why it matters:
  - Core request/response and planner logic is weakly typed.
  - Raises risk of runtime defects and unsafe assumptions.
- Exact location:
  - `server/src/controllers/ask.ts:3`
  - `server/src/controllers/ask.ts:892`
  - `server/src/controllers/config.ts:49`
  - `server/src/services/config.ts:16`
- Repro steps / failure scenario:
  1. Pass malformed payloads (non-string question/history).
  2. Runtime behavior becomes unpredictable.
- Suggested fix:
  - Introduce typed DTOs + runtime validation.

## Strapi Best-Practice Checks
- Plugin registration/bootstrapping: no issue found for basic wiring (`server/src/index.ts`, `admin/src/pages/App.tsx`).
- Services/controllers/routes structure: partial issue found (auth/policies absent on sensitive routes).
- RBAC/permissions usage: issue found (missing admin permission enforcement on config endpoints).
- Content API/public API design: issue found (public token-usage/key-validation exposure).
- Admin i18n integration: no issue found (translation fallback exists).
- Lifecycle usage: no issue found for embedding trigger intent, but resilience could be improved with explicit timeout/retry policy.

## Package Quality Assessment
- `package.json` exports map: structurally reasonable.
- Build output viability: issue found (build fails due missing dependency).
- Typings/declarations: generated by Strapi plugin build, but release reliability is currently blocked by JS build failure.
- ESM/CJS compatibility: dual exports are configured.
- Dependency hygiene: issue found (missing direct dependency for imported font package).
- Install scripts risk: no postinstall/install script risk found.

## Testing and CI Confidence
- Unit/integration/e2e tests: none found.
- Script reliability: typecheck scripts broken (`run` not found).
- Build reliability: currently failing in clean reproducible run.

## Compatibility and Upgrade Risks (v4 vs v5)
1. Strong v5 coupling in dependencies and SDK (`@strapi/sdk-plugin` v5, `@strapi/strapi` v5 in peer/dev).
2. Admin API usage appears v5-oriented (`@strapi/admin/strapi-admin`, `Page.Error`).
3. Plugin support should be treated as Strapi v5-only. README currently advertises Strapi `>=4.x`, which is incorrect and likely to produce failed installations for v4 users.
4. Recommendation:
  - Publish and document this package as v5-only.

## Quick Wins (Top 5)
1. Lock down sensitive routes now:
   - Set `auth: true` and add RBAC policies for admin config and usage/key-validation endpoints.
2. Remove server-side URL fetch for base-domain validation or enforce strict allowlist/private-IP blocking.
3. Add missing dependency `@fontsource-variable/inter` or remove import, then make CI fail on build errors.
4. Fix typecheck scripts (`run -T` -> `tsc ...`) and add a CI pipeline for `build + typecheck + lint`.
5. Correct README compatibility matrix to Strapi v5 only.

## Final Verdict
- Verdict: Not ready
- Confidence: 93%
- Blocking issues count: 6

## Blocking Issues Summary
1. Unauthenticated admin config read/write + secret exposure.
2. SSRF vector in server-side URL reachability check.
3. Public unauthenticated AI endpoints without abuse controls.
4. Build failure due missing direct dependency.
5. Incorrect Strapi compatibility claim; plugin is v5-only.
6. Public usage telemetry endpoint exposure.
