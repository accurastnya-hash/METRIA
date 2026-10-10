# METRIA API (v1)

METRIA is an independent project, not an official Meteora product. The API is read-only and returns JSON. Configure the API-docs UI with `NEXT_PUBLIC_APP_URL`; its browser examples otherwise use the current origin. Local default: `http://localhost:3000`.

No authentication or application-level rate limiter is currently implemented. Requests are not cached by METRIA; verification responses use `Cache-Control: no-store`. RPC provider availability and any provider-side limits still apply. Health is process liveness only and does not probe Solana RPC.

## Endpoints

### `GET /api/v1/verification/:address`

Accepts a Solana address. A DBC pool address is verified directly; a token mint is resolved to a DBC pool where possible. HTTP 200 means the request completed; inspect `data.status`, `data.migrationProof`, and `data.migrationClaims` for evidence. `INSUFFICIENT_DATA`, `UNVERIFIED`, and `DISCREPANCY` are not success claims.

Query parameters:

| Name | Allowed values | Default |
| --- | --- | --- |
| `cluster` | `mainnet-beta`, `devnet`, `simulated-fixture` | `mainnet-beta` |

Unknown query parameters, duplicate `cluster`, and unsupported cluster values return HTTP 400. Simulated fixtures are returned only on `cluster=simulated-fixture`. Unknown addresses on that cluster do not fall through to a live RPC. Mainnet and devnet always query the requested cluster and never return fixture data.

```bash
curl "http://localhost:3000/api/v1/verification/FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC?cluster=mainnet-beta" \
  -H "Accept: application/json"
```

The address above is a recorded Mainnet DBC pool example; live state and RPC response can change. For deterministic UI examples use a fixture address from `src/lib/fixtures/pools.ts` and `cluster=simulated-fixture`.

### `GET /api/v1/pools/:address`

Returns decoded DBC state only when the verifier resolved a pool account owned by the canonical DBC program. Otherwise it returns HTTP 422 `DBC_POOL_NOT_VERIFIED`; it does not convert an unknown result into an empty successful pool. It accepts the same `cluster` parameter and rejects malformed/unknown query parameters with HTTP 400.

```bash
curl "http://localhost:3000/api/v1/pools/FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC?cluster=mainnet-beta"
```

### `GET /api/v1/receipts/:receiptId`

This endpoint searches the built-in simulated fixture catalog only. It is not a database or retrieval service for receipts from previous live verification calls; live receipts are not persisted. A fixture ID returns its deterministic fixture receipt; unknown IDs, including live receipt IDs, return HTTP 404.

```bash
curl "http://localhost:3000/api/v1/receipts/rcpt_graduated_novadamm_8xwj21"
```

### `GET /api/v1/health`

Returns process liveness, methodology version, the `per-request` cluster label, timestamp, and disclosure. It does not make an RPC request and does not indicate RPC availability.

## Evidence semantics

DBC accounts must be existing, non-executable, owned by canonical DBC, and decoded using the installed SDK's supported `VirtualPool` layout. The associated config must also exist, be DBC-owned, and decode. DAMM v2 destination config and pool must be owned by the canonical DAMM v2 program and decode with its SDK. A successful migration instruction must link the destination to the origin; matching mints alone are insufficient. See [verification methodology](VERIFICATION_METHODOLOGY.md) and [fresh Mainnet evidence](REAL_MAINNET_VALIDATION.md).

Migration history scanning is bounded and dependent reads can occur at adjacent slots. RPC nulls, errors, rate limiting, history limits, and retention gaps mean evidence is unavailable; they do not prove that an event never happened. Current vault balances are reported separately from historical transfer flow.
