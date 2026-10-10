# METRIA Architecture

METRIA is a Next.js App Router application that serves a client UI and server-side JSON route handlers. The server-side verification engine uses Solana RPC and the installed official Meteora DBC and DAMM v2 SDKs. Verification is read-only.

## Request flow

```text
Browser UI / API client
        │
        ▼
Next.js pages and API route handlers
        │
        ├── query validation (Zod)
        ├── simulated-fixture catalog (simulation cluster only)
        └── verification engine
                 ├── Solana RPC client (confirmed commitment, timeout)
                 ├── Meteora DBC SDK (VirtualPool and config)
                 ├── bounded transaction-history migration proof
                 ├── Meteora DAMM v2 SDK (config and destination pool)
                 └── claim/state evaluation and receipt hashing
```

Next.js GET route handlers are request-time RPC reads and METRIA sets verification responses to `Cache-Control: no-store`. There is no application cache, distributed rate limiter, exponential retry policy, or RPC health probe. Public RPC providers may rate-limit or retain incomplete history.

## Source boundaries

- `src/app/`: pages and API route handlers, including verification, pool, fixture receipt, and liveness endpoints.
- `src/components/`: user interface and evidence presentation.
- `src/lib/api/`: Zod query and response schemas.
- `src/lib/fixtures/`: deterministic simulated scenarios. These are only served for the `simulated-fixture` cluster.
- `src/lib/meteora/`: protocol IDs and shared constants.
- `src/lib/solana/`: cluster-specific RPC endpoint selection, connection setup, timeout, and address helpers.
- `src/lib/verification/`: DBC ownership/decode checks, lifecycle evaluation, and bounded migration proof.
- `src/lib/receipts/`: receipt construction, canonical SHA-256, integrity check, and text export.
- `tests/`: deterministic engine/schema/route tests and separate live Mainnet validation.

## Trust boundaries

1. **Owner before decode:** a DBC virtual pool and DBC config must be non-executable accounts owned by canonical DBC before the DBC SDK decode is accepted. DAMM v2 destination config and pool require DAMM v2 ownership and SDK decoding. A valid base58 key is not evidence of account type.
2. **Origin separate from destination:** a DAMM destination is not a DBC origin. A successful DBC migration instruction must identify the origin, route, mints, and destination; the destination must match the SDK-derived PDA.
3. **Historical flow separate from current balances:** migration transaction balances establish historical flow. Current vault reads are a later snapshot and do not promise ongoing liquidity.
4. **Simulation isolated:** unknown simulated fixture addresses fail without RPC fallback. `mainnet-beta` and `devnet` verification do not return simulated fixtures.
5. **Receipt scope:** SHA-256 detects changes to the canonical receipt payload. It does not independently prove the truth of RPC data. The receipt lookup API only indexes fixture examples; live receipts are returned inline and are not persisted.
6. **Operational limits:** no application-level rate limiting or cache is deployed. Health reports process liveness and does not contact RPC.

## Protocol program IDs

- Meteora DBC: `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
- Meteora DAMM v1 (legacy): `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`
- Meteora DAMM v2: `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`
- Raydium CPMM: `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`

DLMM is not implemented. For account layouts, bounded history and supported routes see [verification methodology](VERIFICATION_METHODOLOGY.md) and [known limitations](KNOWN_LIMITATIONS.md).
