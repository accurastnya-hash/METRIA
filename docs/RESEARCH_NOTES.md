# METRIA — Research Notes: Meteora DBC Lifecycle & Verification Architecture

> **Independent Builder Disclosure**: METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.

---

## 1. Executive Protocol Overview

Meteora's Dynamic Bonding Curve (DBC) is a launch pool protocol on the Solana blockchain. It provides virtual bonding curves for token launches with customizable parameters (base token, quote token such as SOL or USDC, fee configurations, virtual reserves, and graduation thresholds). When a curve reaches its designated graduation or migration threshold, the pool liquidity transitions out of the bonding curve and into a permanent decentralized exchange liquidity pool—primarily Meteora DAMM v2 (Constant Product AMM v2), or historically DAMM v1 (Dynamic AMM), or a configured custom destination.

However, in decentralized ecosystems, third-party launchpads, traders, analytics dashboards, and token communities frequently suffer from **verification opacity**:
- Did the pool actually hit its graduation threshold?
- Was a migration transaction actually broadcast and confirmed?
- What was the configured migration destination versus the actual destination pool created on-chain?
- Does the resulting AMM pool actually hold the migrated liquidity and token reserves?
- Who owns the LP positions / fee claims, or are they locked/burned?

METRIA provides the independent verification and developer infrastructure to answer these questions using reproducible, deterministic on-chain evidence.

---

## 2. Protocol Programs & Canonical Addresses

### 2.1 Dynamic Bonding Curve (DBC)
- **Program ID**: `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
- **Official Repository**: [github.com/MeteoraAg/dynamic-bonding-curve](https://github.com/MeteoraAg/dynamic-bonding-curve)
- **Official TypeScript SDK**: `@meteora-ag/dynamic-bonding-curve-sdk` (current version 1.5.x on npm)
- **Core Accounts**:
  - `Pool`: The primary curve account storing base mint, quote mint, reserve balances, virtual reserves, curve parameters, migration parameters, fee limiter, and pool state flags.
  - `Config`: Global or pool configuration determining fee distributions, migration targets, and curve limits.
  - Base / Quote Token Vaults: PDAs holding the token deposits during the curve phase.

### 2.2 Meteora DAMM v2 (CP-AMM)
- **Program ID**: `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`
- **Pool Authority PDA**: `HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC`
- **Official Repository**: [github.com/MeteoraAg/cp-amm](https://github.com/MeteoraAg/cp-amm)
- **Official TypeScript SDK**: `@meteora-ag/cp-amm-sdk` (Note: in earlier draft documentation this was sometimes referred to as damm-v2-sdk; the canonical npm package is `@meteora-ag/cp-amm-sdk`).
- **Core Features**: Constant Product AMM supporting Token-2022, customizable fee tiers, position NFTs, and locked liquidity allocations.

### 2.3 Legacy DAMM v1 Program Mapping
- The installed official DBC SDK 1.5.13 exports `DAMM_V1_PROGRAM_ID` as `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`. This is legacy DAMM v1, not DBC. Migration option 0 remains outside METRIA's DAMM v2 proof path.
- **Raydium CPMM** is a separate program: `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`.

### 2.4 Meteora DLMM (Dynamic Liquidity Market Maker)
- **Program ID**: `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`
- **Official TypeScript SDK**: `@meteora-ag/dlmm`
- **METRIA scope**: DLMM is a separate protocol and is not implemented or verified in this repository. It is not treated as a direct DBC migration destination.

---

## 3. DBC Pool & Configuration Structure

A DBC pool is parameterized by:
1. **Base Token Mint**: The newly launched token.
2. **Quote Token Mint**: The payment asset (typically Native SOL `So11111111111111111111111111111111111111112` or USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
3. **Reserves**:
   - `real_base_reserves`: Actual base tokens held in the vault.
   - `real_quote_reserves`: Actual quote tokens accumulated from buyers.
   - `virtual_base_reserves`: Virtual offset defining the initial price point.
   - `virtual_quote_reserves`: Virtual offset defining initial liquidity depth.
4. **Graduation & Migration Parameters**:
   - `migration_threshold`: The quote token accumulation target (e.g., in lamports or micro-quote units).
   - `migration_option`: Identifies target AMM (e.g., DAMM v2 CP-AMM vs Legacy DAMM v1 vs external).
   - `migration_target_address`: Optional or derived destination address.
   - `is_migrated`: Boolean or state bitmask indicating migration status.

---

## 4. Critical Protocol Distinction: State Machine Truth

METRIA enforces a strict architectural boundary: **Never conflate distinct lifecycle milestones.**

```
+------------------------------------+
| 1. ACTIVE TRADING (Threshold Unmet)|
+-----------------+------------------+
                  | Quote reserves >= Threshold
                  v
+------------------------------------+
| 2. THRESHOLD REACHED               |
| (Trading halted or graduation ripe)|
+-----------------+------------------+
                  | Migration TX broadcast
                  v
+------------------------------------+
| 3. MIGRATION INITIATED             |
| (Pending or in-flight)             |
+-----------------+------------------+
                  | Migration TX confirmed on-chain
                  v
+------------------------------------+
| 4. MIGRATION TX CONFIRMED          |
| (DBC vault drained)                |
+-----------------+------------------+
                  | Destination pool accounts resolved
                  v
+------------------------------------+
| 5. DESTINATION POOL VERIFIED       |
| (Pool state, mints & PDAs check)   |
+-----------------+------------------+
                  | Vaults, LP tokens & ownership checked
                  v
+------------------------------------+
| 6. POST-MIGRATION EVIDENCE RECONCILED|
| (Liquidity, locked LP, fees)       |
+------------------------------------+
```

### Why This Matters:
1. Reaching the graduation threshold does **not** equal a completed migration. If the migration bot fails or stalls, the pool remains in `THRESHOLD_REACHED`.
2. A drained DBC vault does **not** prove where the tokens went unless the destination pool address, mints, and vault balances are independently reconciled.
3. Matching token mints on a random DEX does **not** prove it was created by the DBC migration; transaction logs and PDA seeds must link the DBC pool to the destination pool.

---

## 5. Official SDK Functions & Usage Strategy

METRIA uses a hybrid approach:
1. **Direct RPC & Anchor Layout Decoders**: Provides zero-dependency, ultra-fast, offline-verifiable parsing of DBC Pool and CP-AMM Pool state accounts.
2. **Official SDK Validation**: Integrates `@meteora-ag/dynamic-bonding-curve-sdk` and `@meteora-ag/cp-amm-sdk` account readers; live data ownership and configuration are checked independently over RPC.
3. **Cryptographic Receipt Engine**: Canonical JSON serialization + SHA-256 digest creation for tamper-evident verification receipts.

---

## 6. Verification Status Hierarchy

- **`VERIFIED`**: All necessary on-chain assertions have positive, verifiable proof (DBC pool valid, lifecycle state consistent, destination pool verified with matching reserves/mints).
- **`DISCREPANCY`**: On-chain evidence contradicts expected state (e.g., pool marked migrated but destination vaults empty, or mint mismatch).
- **`UNVERIFIED`**: Intermediate or incomplete state (e.g., active trading curve not yet graduated, or migration pending).
- **`INSUFFICIENT_DATA`**: RPC query timeout, nonexistent account, or unrecognized custom curve layout.

---

## 7. Unresolved Protocol Questions & Assumptions

1. **Custom Migration Targets**: Meteora allows partner-specific migration adapters. Where custom contracts are used, METRIA marks the destination as `CUSTOM_UNVERIFIED` unless known adapter signatures are recognized.
2. **LP Locking & Vesting**: Liquidity locking mechanisms can vary by launchpad (e.g., Streamflow, Meteora vault lock, or burned LP tokens). METRIA inspects LP token mint total supply and holder balances to classify whether liquidity is locked, burned, or held by an external authority.
