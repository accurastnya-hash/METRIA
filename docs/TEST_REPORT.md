# METRIA Release Readiness Test Report

Updated 2026-10-10 (Asia/Jakarta). Commands were run locally in `C:\METRIA\metria-meteora`. The live tests are read-only Mainnet RPC requests. No wallet, transaction, deploy, push, or remote repository change was performed for this audit.

## Results

| Command | Result |
| --- | --- |
| Initial `npm ci` | Failed: the lockfile omitted required `fastestsmallesttextencoderdecoder@1.0.22`. Regenerating the lockfile then exposed Vitest 5's optional Node types peer range (`^22.0.0 || >=24.0.0`) conflicting with the project's `@types/node@20`. The project now targets `@types/node` 22 and the lockfile includes the missing package. |
| Final `npm ci` | Exit 0; installed 479 packages. Lockfile updated with verified package overrides for `toml`, `bigint-buffer` (`npm:@exodus/bigint-buffer@1.1.5-exodus.1`), and `jayson` (`5.0.0`). Production audit reports 0 vulnerabilities (`npm audit --omit=dev` exits 0). |
| `npx vitest run --reporter=verbose` | Exit 0; **10 files and 61 tests passed** (including 11 audit-gate adversarial tests, 48 unit tests, and 2 live Mainnet tests). Vitest emitted a Vite config-loader compatibility warning. |
| `npm run test:live` | Exit 0; **2 live Mainnet tests passed**. They verified the live `Frvc...` DBC pool and a separate DBC-to-DAMM-v2 migration proof. |
| `npm run typecheck` | Sequential rerun exit 0; no diagnostics. |
| `npm run lint` | Exit 0; no diagnostics. |
| `npm run build` | Exit 0; Next.js 16.4.0 compiled, type-checked, generated 11/11 pages, and listed all app/API routes. |
| `npm run docs:check` | Exit 0; checked relative Markdown links in 17 Markdown files. |
| `npm run audit:gate` | **Exit 0**; full audit gate verified: 0 production vulnerabilities, and all 5 dev vulnerability records match the approved temporary exception for `braces@3.0.3` (`GHSA-vfj7-8cjw-p6xm`). Saves unmodified `audit-report.json` and `audit-report-prod.json`. |
| `npm audit --omit=dev` | **Exit 0**; 0 vulnerabilities reported in production dependency tree. |

The first live run also failed receipt integrity for `Frvc...`: the live `dbcPool.programId` used in canonical hash inputs had accidentally become `N/A` while removing false DBC defaults. That field is restored to the canonical DBC ID for a decoded pool; failures now use `N/A` and `null` for unknown protocol, threshold, progress, and migration state. The subsequent standalone live run and full suite both passed.

## Live account evidence

A fresh direct RPC and official DBC SDK observation is recorded in [REAL_MAINNET_VALIDATION.md](REAL_MAINNET_VALIDATION.md). At 2026-10-10 03:42:29 Asia/Jakarta, Mainnet RPC returned `FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC` at slot `454995254` as an existing, non-executable, 424-byte account owned by canonical DBC. Its `d5e005d16245775c` discriminator and `DynamicBondingCurveClient.state.getPool` decode identify the supported `VirtualPool` layout. The DBC-owned config decoded at slot `454995255`; both mint accounts existed, were initialized, and decoded as SPL Token mints. SDK state reports `isMigrated=0`, so this is an active/unmigrated DBC pool, not a live migration proof.

The second live test independently confirmed the successful DBC `migrationDammV2` proof for origin `11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr`, destination `35HVrd1oRCn9sKrG2szU5HoZoEanDAfuyDeTGGoav52x`, canonical DAMM v2 ownership, SDK config/pool decode, and transaction token-flow reconciliation. Its historical signature and source/destination account observations are documented in the linked report.

## API docs and live local smoke check

The production build was started locally on port 3107. `/api-docs` returned HTTP 200, contained the verification endpoint and configured/example host, and did not contain `metria.dev`. The fixture receipt endpoint returned HTTP 200, `isSimulatedFixture=true`, and a 64-character canonical hash. Invalid cluster returned HTTP 400. An unknown simulated address at the DBC pools route returned HTTP 422.

## Secret and release gates

Only `.env.example` is tracked among `.env*` files; `.env.local` was left unread and is ignored. Gitleaks, TruffleHog, and detect-secrets were not installed. A targeted credential-pattern scan across tracked Git history produced no matches; this is not equivalent to a dedicated history secret scan.

GitHub Actions has not run remotely for the new workflows. The fail-closed audit gate passes locally with the maintainer-approved temporary exception through 2026-11-10. Readiness remains strictly **READY FOR SIMULATED DEMO ONLY**. Do not publish this release until the maintainer completes the final review and separately authorizes publication.
