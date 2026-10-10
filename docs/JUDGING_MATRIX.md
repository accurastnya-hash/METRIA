# METRIA — Judging Matrix & Criteria Alignment

> **Target Hackathon Track**: Best Use of Meteora's Dynamic Bonding Curve (DBC)  
> **Independent Builder Disclosure**: METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.

---

## 1. Judging Dimensions Mapping

| Judging Dimension | Implemented Feature & Innovation | Source Code Reference | Automated Test Evidence | Live Demo Step | Gap / Future Work |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Depth of Meteora Integration** | Official DBC IDL transaction decoding, customized fee-config handling, official SDK PDA derivation, DAMM v2 account/config decode, and transaction balance reconciliation. Legacy DAMM v1 is routed separately. | `src/lib/meteora/constants.ts`, `src/lib/verification/migration-proof.ts`, `src/lib/verification/engine.ts` | `tests/live-mainnet.test.ts`, `tests/migration-proof.test.ts`, `tests/verification-engine.test.ts` | Live read-only Mainnet proof plus clearly labeled simulated fixtures. | More live migration cases, archival RPC, broader Token-2022 extension coverage. |
| **Technical Execution** | Strict TypeScript, Next.js 16 App Router, Zod validation, canonical SHA-256 evidence receipts, bounded sequential RPC history search and explicit failure states. | `src/lib/receipts/generator.ts`, `src/lib/verification/migration-proof.ts`, `src/app/api/v1/` | `tests/receipt-generator.test.ts`, `tests/solana-client.test.ts`, `tests/migration-proof.test.ts` | Step 6 & 7: Export proof receipt and query read-only REST API. | Archival provider for old histories; current implementation uses public RPC. |
| **Originality & Product Taste** | Distinct verification infrastructure layer rather than another generic DEX swap terminal or copycat meme launchpad. 6-stage state machine that prevents false confidence. Dark-first technical UI. | `src/components/verification/LifecycleTimeline.tsx`, `src/components/verification/ClaimsTable.tsx`, `src/app/verify/page.tsx` | `tests/state-machine.test.ts` (Axiom tests) | Step 2 through 5: Interactive inspection of all 4 verification scenarios. | Community-submitted adapter plugins for 3rd-party LP lock contracts. |
| **Potential Impact** | Solves verification opacity for 4 major user groups: Launchpad operators, token communities, researchers, and developers. Provides standardized machine-readable API. | `src/app/api/v1/verification/[address]/route.ts`, `src/app/api/v1/pools/[address]/route.ts`, `docs/API.md` | `tests/api-schemas.test.ts` | Step 7: Executing curl requests to demonstrate third-party integration. | Integration SDK published to npm (`@metria/client`). |
| **Verifiable Traction & Usage** | Reproducible receipts hash historical migration proof and current observation slot; fabricated examples remain fixture-labeled. Zero financial custody risk. | `src/lib/receipts/generator.ts`, `src/components/verification/ReceiptModal.tsx`, `src/app/explorer/page.tsx` | `tests/receipt-generator.test.ts` | Step 6: One-click export and download of canonical audit receipts. | On-chain IPFS / Arweave receipt pinning. |

---

## 2. Invariant Compliance Checklist

- [x] DBC pool accounts and configurations inspected on-chain.
- [x] Graduation threshold reached strictly separated from migration confirmed.
- [x] Destination AMM pool independently verified (DAMM v2 vs DAMM v1 vs Custom).
- [x] Post-migration liquidity and LP custody checked.
- [x] Discrepancies and uncertainties explicitly surfaced.
- [x] Reproducible receipts with canonical SHA-256 hashes generated.
- [x] Versioned REST API implemented and validated with Zod.
- [x] 100% read-only with zero wallet signing or private key handling.
- [x] Independent builder disclosure displayed prominently in UI, docs, and receipts.
