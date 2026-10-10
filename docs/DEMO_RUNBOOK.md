# METRIA — Hackathon Demonstration Runbook

> **Independent Builder Disclosure**: METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.

---

## Three-minute judging path

1. **0:00–0:20 — Frame the problem.** METRIA checks whether a DBC pool actually migrated, which destination it reached, and whether transaction metadata supports asset movement. The app is read-only and independent from Meteora.
2. **0:20–1:20 — Show live Mainnet proof.** On `/verify`, click **Verified DBC → DAMM v2 Migration (Live Mainnet)**. After the RPC result loads, point out the DBC origin, successful migration transaction, derived destination `35HVrd1oRCn9sKrG2szU5HoZoEanDAfuyDeTGGoav52x`, and canonical DAMM v2 owner. The transaction shows `250000003101446` base units and `88000000000` WSOL units out/in; the interface also shows decimal-adjusted amounts.
3. **1:20–2:00 — Explain historical vs current.** The positive historical movement is distinct from the destination's later current snapshot. Current balances are low (`4579617449` base raw units; `41455` WSOL raw units) and LP custody is `UNVERIFIED`; do not describe these as ongoing deep liquidity or locked LP.
4. **2:00–2:35 — Show the API.** Run the live `curl` request below and point to `migrationProof`, `migrationClaims`, raw/decimal current balances, `timestamp`, and `observationSlot`. HTTP 200 alone is not a proof verdict.
5. **2:35–3:00 — Contrast the cases.** Enter `FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC` to show a valid but unmigrated DBC pool; use the `Graduated DBC → DAMM v2 (NOVA)` button only to demonstrate fixture mechanics and keep the visible `SIMULATED DEMONSTRATION FIXTURE` disclosure in frame.

**Short submission narrative:** METRIA turns Meteora DBC migration claims into inspectable evidence. It decodes the DBC origin and configuration, verifies the successful migration instruction, derives and decodes the DAMM v2 destination, then reconciles historical token flows. It separates those past transfers from current vault snapshots and exposes uncertainty instead of filling gaps with assumptions.

## 1. Quick Start & Prerequisites

Ensure Node.js (>= 20) and npm are available:
```bash
cd metria-meteora

# 1. Verify dependencies are installed
npm install

# 2. Run automated tests (see docs/TEST_REPORT.md for current count and live RPC status)
npm run test

# 3. Verify clean production build
npm run build

# 4. Start local development server
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 2. Interactive Demonstration Walkthrough

> Steps using NOVA, SOLAR, ORBIT, and GHOST are simulated fixtures. Their balances, destination accounts, and LP custody are demonstration data, not Mainnet evidence. For current Mainnet evidence, see `docs/REAL_MAINNET_VALIDATION.md`.

The positive live migration proof is the real pool `11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr`, destination `35HVrd1oRCn9sKrG2szU5HoZoEanDAfuyDeTGGoav52x`, and transaction `4nQZsKMzhTjF2yk5Y4LVJkPQtGYJUhFooXqCauzCnSNHpHNWb6Pctt9soi65XFhRjWW4GQH2mG41ybsAcsr8oxh2`. This is historical Mainnet evidence; the current destination vault balances may differ from the amounts transferred.

### Step 1: Overview & Hero Exploration
1. Navigate to `http://localhost:3000`.
2. Notice the dark-first technical aesthetic, Meteora-inspired obsidian/cyan palette, and real-time Solana cluster indicator.
3. Review the problem statement: Opacity between bonding curve graduation and AMM migration.

### Step 2: Verification Workspace & Scenario 1 (Graduated DBC -> DAMM v2)
1. Click **"Verify Pool"** or navigate to `/verify`.
2. Click the quick button **"Graduated DBC -> DAMM v2 (NOVA)"** or enter `NovA111111111111111111111111111111111111111`.
3. Click **"Verify"**.
4. Observe the results:
   - Overall Verdict: `VERIFIED` with green badge and clear explanation.
   - Observable Lifecycle Timeline: all 6 stages illuminated, current at `6. Reconciled`.
   - DBC Configuration Card: shows 85 SOL graduation threshold, 100% progress, drained curve vault.
   - Destination AMM Evidence: this is simulated fixture content, not live account evidence. Its sample balances and LP custody label are fabricated and must remain visibly disclosed as a fixture.
   - Evaluated Claims Table: all claims verified with confidence level `DIRECT_FACT`.

### Step 3: Scenario 2 (Threshold Reached, Unmigrated)
1. Click **"Threshold Reached, Unmigrated (SOLAR)"** or enter `SoLaR11111111111111111111111111111111111111`.
2. Click **"Verify"**.
3. Observe:
   - Overall Verdict: `UNVERIFIED` (amber badge).
   - Lifecycle Timeline halts at `Stage 2: Threshold Reached`.
   - Clear explanation: Curve reached 85 SOL, but migration has not yet executed.
   - Differentiates threshold completion from migration execution.

### Step 4: Scenario 3 (Active Curve in Progress)
1. Click **"Active Curve In Progress (ORBIT)"** or enter `Urbt111111111111111111111111111111111111111`.
2. Click **"Verify"**.
3. Observe:
   - Lifecycle Timeline highlights `Stage 1: Active Trading`.
   - Progress bar indicates 46.20% toward 85 SOL graduation threshold.

### Step 5: Scenario 4 (Critical Discrepancy Detection)
1. Click **"Discrepancy / Faulty Migration (GHOST)"** or enter `GhST111111111111111111111111111111111111111`.
2. Click **"Verify"**.
3. Observe:
   - Overall Verdict: `DISCREPANCY` (rose red badge).
   - Discrepancy Alert: Drained DBC vault, but destination AMM vaults contain 0 tokens.
   - State machine prevents false confidence.

### Step 6: Exporting Cryptographic Receipts
1. On any verification result, click **"Export Receipt"**.
2. Inspect the modal displaying:
   - Deterministic Receipt ID
   - Canonical SHA-256 Digest
   - Full structured JSON representation
   - Plaintext human-readable audit report
3. Click **"Copy"** or **"Download"** to test receipt portability.

### Step 7: Testing the Developer REST API
1. Navigate to `/api-docs` or test directly in your terminal:
```bash
# Query health check
curl http://localhost:3000/api/v1/health

# Query verification for NOVA
curl "http://localhost:3000/api/v1/verification/NovA111111111111111111111111111111111111111?cluster=simulated-fixture"

# Query DBC pool configuration
curl "http://localhost:3000/api/v1/pools/8xWj21K9QvLpM9Z3sF7XgY8nR1WvK2mD5qP9tL3bE4uA?cluster=simulated-fixture"

# Read-only live DBC-to-DAMM v2 migration proof (requires public Mainnet RPC)
curl "http://localhost:3000/api/v1/verification/11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr?cluster=mainnet-beta"
```

The live verification page separates origin pool state, destination address/account checks, migration-transaction proof, and asset-flow proof. A missing transaction or incomplete RPC history remains an explicit non-verified claim. Current release readiness is `READY FOR SIMULATED DEMO ONLY` because the dependency audit still has high-severity findings and GitHub Actions has not run on this revision.
