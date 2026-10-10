# Contributing to METRIA

Thank you for your interest in contributing to METRIA!

> **Independent Builder Disclosure**: METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.

---

## 1. Principles

1. **Evidence-First Verification**: Every state transition must be supported by direct on-chain evidence or explicit uncertainty.
2. **Read-Only Security**: METRIA never executes state-altering transactions, swaps, or custody operations.
3. **Deterministic Math**: Curve calculations and canonical receipt hashes must be 100% reproducible.

---

## 2. Development Workflow

1. Fork or clone the repository:
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/metria-meteora.git
   cd metria-meteora
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env.local
   ```
4. Run tests:
   ```bash
   npm run test
   ```
5. Run build check:
   ```bash
   npm run build
   ```

---

## 3. Pull Request Guidelines

- Ensure all 19 automated tests pass.
- Maintain documentation integrity and update relevant markdown specs in `docs/` when adding protocol rules.
- Do not commit private keys, secrets, or paid RPC credentials.
