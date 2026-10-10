import { describe, it, expect } from 'vitest';
import { VerificationQuerySchema, parseVerificationQuery } from '../src/lib/api/schemas';

describe('API Route Query Schemas', () => {
  it('parses valid cluster and defaults safely', () => {
    const parsed = VerificationQuerySchema.safeParse({
      cluster: 'mainnet-beta',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cluster).toBe('mainnet-beta');
    }
  });

  it('rejects unsupported clusters', () => {
    const parsed = VerificationQuerySchema.safeParse({
      cluster: 'unsupported-cluster',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects malformed clusters and unsupported or duplicate query parameters without falling back', () => {
    expect(parseVerificationQuery(new URLSearchParams('cluster=production')).success).toBe(false);
    expect(parseVerificationQuery(new URLSearchParams('cluster=mainnet-beta&allowFixtures=false')).success).toBe(false);
    expect(parseVerificationQuery(new URLSearchParams('cluster=devnet&cluster=mainnet-beta')).success).toBe(false);
  });
});
