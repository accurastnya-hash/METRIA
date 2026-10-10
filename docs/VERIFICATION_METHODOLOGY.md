# METRIA — Verification Methodology v2.0.0

METRIA is an independent builder project and not an official Meteora product. Mainnet validation is read-only and uses explicit cluster selection, direct Solana RPC and installed official SDKs (`@meteora-ag/dynamic-bonding-curve-sdk` 1.5.13, `@meteora-ag/cp-amm-sdk` 1.5.1).

## Origin DBC account

The requested account must exist, be non-executable and be owned by canonical Meteora DBC `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`. The installed DBC SDK `DynamicBondingCurveClient.state.getPool` decodes the supported `VirtualPool` account layout; the config must independently exist, have DBC ownership and decode with `getPoolConfig`. The base and configured quote mint must be initialized SPL Token or Token-2022 mints. The DBC base and quote vaults must be token accounts with matching embedded mints. A `PublicKey`-valid string alone never establishes account type.

The current pool and config reads are point-in-time observations. The origin pool's confirmed RPC context slot is included in the response/receipt when available; config and mint reads can occur at nearby, but not necessarily identical, slots.

## Configured migration route and the expected PDA

`migrationOption` and `migrationFeeOption` are decoded from the config. Only option 1 enters the DAMM v2 branch. Legacy DAMM v1 and other/unsupported routes remain explicit and are not searched as DAMM v2.

The installed SDK helper is `deriveDammV2PoolAddress(config, tokenAMint, tokenBMint)`. Its implementation sorts mint keys, then derives the pool under the installed SDK's DAMM v2 program ID. For fixed migration fee options, config comes from `DAMM_V2_MIGRATION_FEE_ADDRESS[feeOption]`. Fee option 6 is customizable; the official DBC `migration_damm_v2` instruction includes the custom DAMM v2 config as the first remaining account after the IDL-declared accounts. The observed instruction pool account must equal the derived PDA. A derived PDA alone is never a migration proof.

## Transaction search and decoding

Search uses `getSignaturesForAddress(originPool)` in pages of 50 with a default maximum of 200 signatures, sequential transaction fetches (concurrency 1), a 15-second scan budget and 5-second timeout for each RPC call. `getTransaction` requests confirmed transaction details and supports version 0. Static message keys are concatenated with loaded writable and then loaded readonly keys; top-level and inner instructions are examined.

The installed DBC IDL and Anchor coder identify the exact `migration_damm_v2` discriminator and account names. A transaction counts only when `meta.err` is null, the decoded `virtual_pool` equals the claimed origin, the configured route/program and mint accounts agree, and the instruction's destination matches the derived DAMM v2 PDA. Failed attempts are preserved as failed evidence and skipped while searching for a later success.

RPC results do not establish archival completeness. Null transaction data, provider errors, 429 rate limits, timeout, bounded history and retention gaps are reported as unavailable/limited evidence. Exhausting signatures available from one RPC is not a universal proof that a transaction never existed.

## Destination and asset-flow reconciliation

The DAMM config and destination pool must exist as non-executable accounts owned by `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`. `CpAmm.fetchConfigState` and `CpAmm.fetchPoolState` must decode successfully. Decoded mints and vault references must match the migration instruction, and each destination token account's owner program and embedded mint are verified.

Historical asset flow is a separate claim. Transaction pre/post token balance metadata must show positive base and quote outflow from the DBC source vaults and positive inflow to the instruction-linked DAMM destination vaults. Amounts remain raw integer base units in the proof and are not inferred from current balances. Current vault balances are separately displayed; trades and other later activity can change them. Missing historical balance metadata prevents `ASSET_FLOW_RECONCILED` even if a successful migration instruction is known.

## Independent claim statuses

The verification response includes the following individual claims, each with status, evidence, cluster, relevant account addresses, transaction signature/slot/time when applicable, method, missing evidence and limitations:

1. `DBC_POOL_CONFIRMED`
2. `GRADUATION_THRESHOLD_CONFIRMED`
3. `MIGRATED_STATE_CONFIRMED`
4. `MIGRATION_ROUTE_CONFIRMED`
5. `DESTINATION_CANDIDATE_FOUND`
6. `DESTINATION_ADDRESS_CONFIRMED`
7. `MIGRATION_TRANSACTION_CONFIRMED`
8. `ASSET_FLOW_RECONCILED`

`VERIFIED` applies only to the individual claim with sufficient evidence. `DISCREPANCY` indicates a trusted-source conflict/material invariant failure. `UNVERIFIED` means a supported claim is not yet true (for example, threshold not reached). `INSUFFICIENT_DATA` means required information could not be established. The overall lifecycle reaches `RECONCILED/VERIFIED` only after the successful origin-linked transaction, matching destination owner/layout/mints/vaults and historical asset flow pass. Missing history does not produce a false negative or promote a destination candidate.

## Receipt/API integrity

The API returns the full proof and claim records, including explicit uncertainty. Receipts include origin/config/mints, route, derived/observed destination, transaction evidence, owner/decode state, vault observations and limitations. SHA-256 canonicalization includes migration proof, migration claims and observation slot when present. Tampering is detectable; the hash does not independently attest the truth of its inputs.
