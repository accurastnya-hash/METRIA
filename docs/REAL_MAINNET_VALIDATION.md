# METRIA — Fresh Mainnet Read-Only Validation

> Fresh direct RPC observations: 2026-10-10 02:34 Asia/Jakarta, `confirmed`, `https://api.mainnet-beta.solana.com`. No transaction was submitted. Account state can change after each observation.

## Release recheck: `FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC`

Fresh direct read-only RPC + installed SDK check at `2026-10-10 03:42:29 Asia/Jakarta` (`2026-10-09T20:42:29.656Z`), `confirmed`, public Mainnet endpoint `https://api.mainnet-beta.solana.com`. Pool account returned at slot `454995254`: exists, owner `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`, non-executable, 424 bytes, discriminator `d5e005d16245775c`. `DynamicBondingCurveClient.state.getPool` decoded its supported `VirtualPool` layout. SDK state: base mint `6o4vdqyvStu7EfgnMJ8ZycnUV3Kfxdz9sQWsnDDtjups`, config `437qMje8uMQzWRw6enTCBgnnLvL4cTRM8dfkq8MQNhSM`, base vault `7Y1qxX9ED313sWjS8cMyM6ka24rDtfSTAbtgqDUtHa7U`, quote vault `SAr6dTfRj1F62dK8wJs5j1uoDh9oJYLJHvj2c8hjWEh`, `isMigrated=0`, `quoteReserve=1` atomic unit.

Config RPC read at slot `454995255`: exists, owner is the canonical DBC program, non-executable, 1,048 bytes, discriminator `1a6c0e7b74e6812b`. The installed DBC SDK `getPoolConfig` decoded successfully: `migrationOption=1`, `migrationFeeOption=6`, quote mint USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, threshold `15390982211` atomic units. Both SDK-decoded mint addresses exist and decode as initialized SPL Token mint accounts at slots `454995256` and `454995257`, respectively; each is non-executable, Token Program-owned, 82 bytes, and has 6 decimals. Direct RPC ownership therefore agrees with the claimed DBC `VirtualPool` type; the installed SDK says this pool is active/unmigrated, not a migration proof.

## Origin pool sample: `FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC`

`getAccountInfoAndContext` returned slot `454977218`, an existing non-executable 424-byte account owned by Meteora DBC `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`. The first eight bytes were `[213,224,5,209,98,69,119,92]`, the supported `VirtualPool` discriminator. The installed official DBC SDK 1.5.13 decoded the pool.

| Field | Current Mainnet observation |
| --- | --- |
| Base mint | `6o4vdqyvStu7EfgnMJ8ZycnUV3Kfxdz9sQWsnDDtjups` |
| Quote mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC) |
| DBC config | `437qMje8uMQzWRw6enTCBgnnLvL4cTRM8dfkq8MQNhSM` |
| Config RPC slot / owner | `454977219` / canonical DBC program |
| Config decoding | SDK `getPoolConfig` succeeded; `migrationOption=1`, `migrationFeeOption=6`, threshold `15390982211` atomic quote units |
| Pool state | `isMigrated=0`, `quoteReserve=1` atomic unit |

Both mint accounts were present, initialized token mints; the SDK-configured quote mint matches the account state. The origin's base and quote vault accounts are checked against their token-program owner and embedded mint in the live verifier. This pool is a real DBC virtual pool but has no executed migration, so it is not used as migration proof.

## Positive live migration case: `11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr`

Direct RPC at slot `454977219` returned an existing, non-executable 424-byte account owned by canonical DBC. Its discriminator was `[213,224,5,209,98,69,119,92]`; DBC SDK 1.5.13 `getPool` and `getPoolConfig` decoded it. Its config `EiP739P1dZRyqHMuqbKatyhiBr7cC1ge4iT82MCF1zcn` was DBC-owned and decoded with migration option 1 (DAMM v2), fee option 6 (customizable), quote mint WSOL `So11111111111111111111111111111111111111112`, and quote threshold `88000000000`.

The bounded history scan read two signatures. One is a failed attempt and is explicitly excluded:

- Failed signature: `469282JixDxmD3QLWiFNbPPgQd7xYLLAgEBD3u7angbgHQXqdigvamSWRYKiK4ssMuWJiSN48HLJEVEEYdtL6kWG`, slot `391896336`, `meta.err = InstructionError [0, Custom: 6022]`.
- Successful signature: `4nQZsKMzhTjF2yk5Y4LVJkPQtGYJUhFooXqCauzCnSNHpHNWb6Pctt9soi65XFhRjWW4GQH2mG41ybsAcsr8oxh2`, slot `391896336`, block time `2026-01-07T10:35:17Z`, `meta.err = null`.

The installed DBC IDL coder decoded `migrationDammV2`. Its instruction account mapping identified source virtual pool `11A3…`, destination pool `35HVrd1oRCn9sKrG2szU5HoZoEanDAfuyDeTGGoav52x`, DAMM program `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`, base mint `4ZzCvtXX25hjGD6VjBj9ftX8tKiyYTSb1csp5fcbMgYs`, quote mint WSOL, and destination vaults `AM2soSXafB9GZYBZm81YX5uuLfwMSH55eoHcCFArxFZT` and `BC2pqTkEF4CvaJw8yiKiy32hUH5q3ymyjrQvdfDsS1C9`. For option 6, the instruction's first remaining account was DAMM config `A8gMrEPJkacWkcb3DGwtJwTe16HktSEfvwtuDh2MCtck`.

The installed DBC SDK derived `35HV…` from that DAMM config and the two decoded mints. Direct RPC reported both DAMM config and destination pool owned by canonical DAMM v2 and non-executable; installed DAMM v2 SDK 1.5.1 `fetchConfigState` and `fetchPoolState` decoded them. The pool's mints and vault references matched the instruction. Both vault token accounts were present, Token Program-owned, and stored the matching mint.

Transaction metadata independently reconciled positive raw-unit balances for both assets:

| Mint | DBC source vault outflow | DAMM destination vault inflow |
| --- | ---: | ---: |
| `4ZzCvtXX25hjGD6VjBj9ftX8tKiyYTSb1csp5fcbMgYs` | `250000003101446` | `250000003101446` |
| WSOL `So11111111111111111111111111111111111111112` | `88000000000` | `88000000000` |

The UI/API test ran `verifyAddress` for this real pool and observed `migrationProof.status=VERIFIED`, with the separate migration-transaction and asset-flow claims verified. At a separate direct vault observation, slot `454976915`, base vault held `4579617449` raw units (`4579.617449` at 6 decimals) and quote vault held `41455` raw units (`0.000041455` WSOL). The reported slot is lower than the independent pool observation slot because public RPC calls may be served from different nodes; these reads are not an atomic snapshot. These low current balances are recorded as point-in-time state; they do not negate the historical transaction movement and are not represented as continuing liquidity.

## Program account separation

The official DBC SDK exports DBC `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN` and DAMM v1 `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB` as distinct program IDs. DAMM v2 is `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`; Raydium CPMM `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` is another separate program.

## Fresh interactive and API recheck (2026-10-10 02:57 Asia/Jakarta)

The final app walkthrough's live verification screen independently completed the `11A3…` migration case at origin context slot `454982938`, observation timestamp `2026-10-09T19:57:37.667Z` (2026-10-10 02:57:37 Asia/Jakarta): status `VERIFIED`, transaction `4nQZ…`, destination `35HV…`, DAMM v2 owner `cpamdp…`, and decoded config `A8gM…`. Current destination vault snapshot: base `4579617449` raw (`4579.617449`, 6 decimals); WSOL `41455` raw (`0.000041455`, 9 decimals). LP custody was `UNVERIFIED`; the interface states that the snapshot is not a liquidity guarantee. The HTTP API returned the same verified origin, proof, transaction and destination. An invalid address returned `INSUFFICIENT_DATA` with the explicit invalid-base58 message and no pool address (`N/A`). The UI showed the separate live CHFY active pool `6D8TbMnPY3yJUra8p4JhqYCHfP6JcKeu6sxF1eciaTtU`; the final direct Mainnet test independently verified `Frvc…` as active DBC. The NOVA example remained visibly labeled simulated fixture.

## Repeat

Run `npm test -- --run tests/live-mainnet.test.ts` (or `npx vitest run tests/live-mainnet.test.ts`). The live test is read-only and validates both an unmigrated DBC account and one positive historical DBC-to-DAMM v2 case. Public RPC retention and throttling can affect repeatability; a failed RPC query must be reported as unavailable evidence, never as proof that no migration occurred.
