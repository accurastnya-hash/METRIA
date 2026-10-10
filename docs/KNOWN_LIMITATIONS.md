# METRIA — Known Limitations

> METRIA is an independent project, not an official Meteora product.

## Readiness

Current status: **READY FOR SIMULATED DEMO ONLY.** Fresh Mainnet validation and local tests, type checking, lint, build, and docs-link checks passed during this audit. `npm audit --audit-level=high` still reports 12 high vulnerabilities, and GitHub Actions has not run on this revision.

The current release audit also finds 12 high and 7 moderate npm advisories in the dependency tree. Safe automatic remediation is unavailable for the current official SDK dependency chain; the high-severity audit gate therefore fails. Do not publish this release until the affected dependency chain is reviewed and the high findings are resolved or formally assessed.

## Protocol and data limits

- DBC option 0 is legacy DAMM v1 (`Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`, per the official DBC SDK export). METRIA names this route but does not yet decode or verify the DAMM v1 destination; unsupported/custom routes are also outside the DAMM v2 proof path.
- DAMM v2 `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG` and Raydium CPMM `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` remain separate.
- Transaction search is bounded at 200 signatures, 50 per page, sequentially, with a 15-second scan budget and 5-second RPC call timeout. Public RPC retention is not archival completeness; 429s, null transactions and old-history gaps yield insufficient evidence.
- Each live account read is point-in-time and may be observed at a different slot. Destination vault balances can move after migration; historical transfer evidence and current account balances are shown separately.
- Token-2022 base layouts are checked, but every extension and transfer-hook behavior is not fully interpreted. More protocol-specific accounting may be required for unsupported asset types.
- LP custody, position ownership and external vesting mechanisms are not a complete audit of every downstream program.

## Product scope

- Lifecycle verification does not assess token investment safety, token legitimacy, or off-chain claims.
- Live validation defaults to public Solana RPC endpoints. METRIA has no application-level rate limiter, distributed quota, retry/backoff layer, or RPC health probe; availability and provider rate limits are outside METRIA's control.
- Verification GET responses are marked `Cache-Control: no-store`; no METRIA application cache is implemented. Hosting infrastructure may have its own behavior and should be configured to respect these headers.
- `GET /api/v1/receipts/:receiptId` searches the in-memory fixture catalog only. Live receipts are returned inline by verification and are not persisted for subsequent retrieval.
- Receipts represent the evidence returned at observation time. Their canonical SHA-256 detects payload changes but does not independently certify RPC data truth.
- Simulated fixtures remain fabricated examples and are labeled as simulation; they are not Mainnet evidence.
