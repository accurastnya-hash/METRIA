/**
 * METRIA — API Schemas & Validation Models
 */

import { z } from 'zod';
import {
  PoolLifecycleStage,
  VerificationStatus,
} from '../meteora/constants';

export const VerificationQuerySchema = z.object({
  cluster: z.enum(['mainnet-beta', 'devnet', 'simulated-fixture']).default('mainnet-beta'),
}).strict();

export function parseVerificationQuery(searchParams: URLSearchParams) {
  const entries = [...searchParams.entries()];
  if (entries.some(([key]) => key !== 'cluster') || searchParams.getAll('cluster').length > 1) {
    return VerificationQuerySchema.safeParse({ unsupportedQuery: true });
  }
  return VerificationQuerySchema.safeParse({
    ...(searchParams.has('cluster') ? { cluster: searchParams.get('cluster') } : {}),
  });
}

export const VerificationStatusSchema = z.nativeEnum(VerificationStatus);
export const LifecycleStageSchema = z.nativeEnum(PoolLifecycleStage);

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  service: z.literal('METRIA'),
  cluster: z.string(),
  timestamp: z.string(),
  disclosure: z.string(),
});
