# METRIA — Technical Audit and DBC Migration Proof

> Audit date: 2026-10-10 (Asia/Jakarta). METRIA is an independent project, not an official Meteora product. All network calls described here are read-only.

## Readiness

**READY FOR SIMULATED DEMO ONLY.** Fresh Mainnet validation, the full test suite, type checking, lint, build, and docs-link validation passed locally in this audit. The dependency audit reports 12 high findings and GitHub Actions has not run on this revision. This is not a security audit or guarantee of continued pool liquidity.

**Release gate:** the current `npm audit --audit-level=high` exits non-zero with 19 findings (12 high, 7 moderate), including findings in the SDK's transitive Anchor/Solana dependency graph. `npm audit fix --dry-run` does not provide a safe non-breaking repair; npm recommends breaking upgrades for some paths and reports no fix for `toml`. The configured CI audit step will fail on this state. A Gitleaks executable is not installed in this environment; targeted credential-pattern searches across tracked Git history returned no matches, but this is not equivalent to a full secret scanner. No remote publication should proceed until the high findings are addressed and CI validation runs.

## Canonical program roles

| Role | Program ID | Authority |
| --- | --- | --- |
| Meteora DBC | `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN` | Installed `@meteora-ag/dynamic-bonding-curve-sdk` 1.5.13, its IDL/source, and Mainnet owner checks |
| Meteora DAMM v1 | `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB` | `DAMM_V1_PROGRAM_ID` export from the installed official DBC SDK 1.5.13; not DBC |
| Meteora DAMM v2 (`cp-amm`) | `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG` | Meteora [DAMM v2 guide](https://docs.meteora.ag/developer-guides/damm-v2), SDK 1.5.1, IDL/source, and Mainnet owner checks |
| Raydium CPMM | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | Raydium program; explicitly not Meteora DAMM v2 |

Official source references: [Meteora DBC guide](https://docs.meteora.ag/developer-guides/dbc), [DBC program](https://github.com/MeteoraAg/dynamic-bonding-curve), [DBC SDK](https://github.com/MeteoraAg/dynamic-bonding-curve-sdk), [Meteora DAMM v2 guide](https://docs.meteora.ag/developer-guides/damm-v2), and [DAMM v2 repository](https://github.com/MeteoraAg/damm-v2). The installed DBC SDK 1.5.13 source exports `DYNAMIC_BONDING_CURVE_PROGRAM_ID`, `DAMM_V1_PROGRAM_ID`, and `DAMM_V2_PROGRAM_ID`; the cp-amm SDK 1.5.1 declares its own program address matching the official DAMM v2 guide.

The installed official DBC SDK source exports `DAMM_V1_PROGRAM_ID = Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`; it is legacy DAMM v1, not DBC or DAMM v2. Migration option 0 stays separate from this DAMM v2 proof path.

## Migration proof implementation

- Origin pool and config: direct RPC verifies existence, expected DBC owner, non-executable data-account status and confirmed context slot; `DynamicBondingCurveClient.state.getPool` and `getPoolConfig` decode the supported layouts. Base and quote mint accounts and token vaults are checked for existence, token-program ownership and mint relationship.
- Route: `migrationOption` and `migrationFeeOption` come from decoded DBC config. Only migration option 1 enters this DAMM v2 pipeline.
- Destination PDA: for fixed fee options the config is selected from the installed DBC SDK `DAMM_V2_MIGRATION_FEE_ADDRESS` mapping. For customizable fee option 6, the DAMM config is the first remaining account after the actual `migration_damm_v2` IDL accounts. The SDK `deriveDammV2PoolAddress(config, baseMint, quoteMint)` then independently derives the expected pool; its implementation sorts mint keys before PDA derivation.
- History: reads at most 200 signatures in pages of 50, sequentially (bounded concurrency 1), with a 15-second scan budget and 5-second RPC-call timeout. It decodes top-level and inner DBC instructions with the installed DBC IDL coder and resolves static plus address-lookup-table keys. Failed transactions are recorded but never count as proof. RPC `null`, timeout, rate limit and scan-limit outcomes remain insufficient or explicitly limited evidence; the result does not claim archival completeness.
- Destination: the observed instruction destination must equal the SDK-derived PDA. Direct RPC verifies the DAMM v2 owner and non-executable state; `CpAmm.fetchConfigState` and `CpAmm.fetchPoolState` decode config and pool. Mints, vault references, token-account owners and vault mint fields are checked.
- Asset flow: transaction token-balance metadata must show positive source-vault outflow and destination-vault inflow for both expected mints. Raw base-unit deltas are retained. Current destination vault balances are separately fetched and displayed because they can change after migration.
- Claims: the response independently reports DBC pool, graduation threshold, migrated state, migration route, destination candidate, destination address, migration transaction, and asset-flow statuses. A matching mint pair or derived PDA alone cannot verify a migration.

The deterministic receipt hash now includes migration proof, eight claim records, destination pool/vault/current-balance snapshot (formatted and raw amounts plus decimals) and observation slot when present. It protects payload integrity; it does not make the underlying RPC claims true by itself.

## Current evidence and remaining limits

See [REAL_MAINNET_VALIDATION.md](REAL_MAINNET_VALIDATION.md) for both tested pools, the exact successful signature and balance changes. The proof confirms a historical transfer at the reported slot. A later read found the destination vaults at low balances (some dust), so this does not assert that the destination remains liquid today. Public RPC retention, rate limiting and non-archival history remain limitations. The proof engine is read-only; no transaction, wallet, remote, publish or deploy action was used.
