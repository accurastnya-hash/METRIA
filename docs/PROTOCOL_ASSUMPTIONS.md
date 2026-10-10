# METRIA — Protocol Assumptions & Verification Invariants

> **Independent Builder Disclosure**: METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.

---

## 1. Scope & Objective

This document formalizes the mathematical, cryptographic, and architectural assumptions METRIA relies upon when performing independent on-chain verification of Meteora Dynamic Bonding Curve (DBC) launches.

Every verification status (`VERIFIED`, `DISCREPANCY`, `UNVERIFIED`, `INSUFFICIENT_DATA`) is grounded in deterministic invariants defined here.

---

## 2. On-Chain Program Identifiers

| Protocol Component | Program ID | Notes |
| :--- | :--- | :--- |
| **Meteora DBC** | `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN` | Launch curve program |
| **Meteora DAMM v2 (CP-AMM)** | `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG` | Primary modern graduation destination |
| **Raydium CPMM** | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | Separate protocol; not Meteora DAMM v2 |
| **Meteora DLMM** | `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` | Separate protocol; not implemented or verified by METRIA |
| **Solana System Program** | `11111111111111111111111111111111` | Account allocation & native transfers |
| **SPL Token Program** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Standard token program |
| **SPL Token-2022** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Extensions (transfer hooks, fees) |

The installed official `@meteora-ag/dynamic-bonding-curve-sdk` 1.5.13 exports `DAMM_V1_PROGRAM_ID` as `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`. This identifies the program as legacy DAMM v1, not DBC. METRIA keeps option 0 distinct and does not pass it through the DAMM v2 proof path.

---

## 3. Account Structure & Deserialization Invariants

### 3.1 DBC Pool Account
1. **Discriminator**: Decode the supported DBC `VirtualPool` layout through the official SDK; do not substitute the generic DAMM `Pool` account layout.
2. **Authority / Creator**: Public key with administrative or launch rights.
3. **Mints**:
   - `base_mint`: Address of the launched asset.
   - `quote_mint`: Address of the quotation asset (SOL or SPL USDC).
4. **Vaults**:
   - `base_vault`: SPL Token account owned by the DBC PDA storing real base tokens.
   - `quote_vault`: SPL Token account or native lamport vault storing accumulated quote tokens.
5. **Reserve Counters**:
   - `virtual_base_reserves`, `virtual_quote_reserves` (used for pricing slope).
   - `real_base_reserves`, `real_quote_reserves` (physical assets in vault).
6. **Migration State**:
   - `migration_threshold`: Threshold in atomic quote units required for graduation.
   - `migration_option`: Enum value specifying destination AMM (0 = Legacy DAMM v1, 1 = DAMM v2 CP-AMM, 2 = Custom/External).
   - `is_migrated`: Boolean flag set to true upon successful execution of the migration instruction.
   - `migration_target`: Recorded destination pool address or null if derived via deterministic seeds.

### 3.2 DAMM v2 (CP-AMM) Account Invariants
1. **Discriminator**: Anchor account discriminator for `Pool`.
2. **Token Mint Verification**:
   - `token_0_mint` and `token_1_mint` must bijectively map to `{base_mint, quote_mint}`.
3. **Reserves**:
   - `token_0_vault` and `token_1_vault` must hold non-zero token balances post-migration.
4. **Authority**:
   - Pool authority must match canonical DAMM v2 PDA (`HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC`).

---

## 4. Verification Invariants & Axioms

### Axiom 1: Non-Equivalence of Graduation & Migration
- **Invariant**: `quote_reserves >= migration_threshold` $\centernot\implies$ `is_migrated == true`.
- **Reason**: Market buys may push the quote reserves past threshold, but if the migration crank/service has not yet executed or failed, the liquidity remains in the DBC vault. METRIA classifies this as `THRESHOLD_REACHED`, not `MIGRATED`.

### Axiom 2: Cryptographic Linking of Pools
- **Invariant**: An AMM pool is only verified as the migration destination if:
  1. Its token pair matches the DBC base and quote mints.
  2. The pool creation signature or DBC migration signature explicitly routed liquidity from the DBC vaults into the AMM vaults.
  3. Or the AMM pool address equals the immutable `migration_target` stored in the DBC pool state.

### Axiom 3: Complete Evidence Reconciliation
- If `is_migrated == true`:
  - DBC vaults must show zero or negligible residual balances.
  - The destination pool must exist on-chain and have active liquidity.
  - If the destination pool cannot be found or is empty, METRIA issues a `DISCREPANCY` verdict.

---

## 5. Network Isolation & RPC Fallback Assumptions

1. **Strict Cluster Partitioning**:
   - Requests targeting `mainnet-beta` are never evaluated against `devnet` or fixture data.
   - Fixture demonstration data is explicitly flagged with `cluster: "simulated-fixture"`.
2. **Deterministic Timeouts**:
   - RPC queries have an explicit 10,000ms timeout per call to prevent hanging worker loops.
   - RPC failures, including HTTP 429 responses, can leave required evidence unavailable. METRIA does not implement a retry/backoff or application-level rate-limiting service.
