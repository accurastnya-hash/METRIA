import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('release documentation claims', () => {
  it('does not use the unconfigured metria.dev host in the API docs UI or published docs', () => {
    const files = ['README.md', 'docs/API.md', 'src/app/api-docs/page.tsx'];
    for (const file of files) expect(readFileSync(file, 'utf8')).not.toContain('metria.dev');
  });

  it('documents receipt lookup as fixture-only and discloses absent live persistence', () => {
    const docs = readFileSync('docs/API.md', 'utf8');
    expect(docs).toContain('simulated fixture catalog only');
    expect(docs).toContain('live receipts are not persisted');
  });
});
