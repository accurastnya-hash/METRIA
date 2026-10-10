import { describe, expect, it } from 'vitest';
import { evaluateAudit, runAuditGate } from '../scripts/audit-gate.mjs';

interface AdvisorySource {
  source?: number;
  name?: string;
  dependency?: string;
  title?: string;
  url?: string;
  severity?: string;
  range?: string;
  cwe?: string[];
  cvss?: { score: number; vectorString: string };
}

interface VulnerabilityRecord {
  name: string;
  severity: string;
  isDirect?: boolean;
  via: Array<string | AdvisorySource>;
  effects?: string[];
  range?: string;
  nodes?: string[];
}

interface LockPackageRecord {
  version?: string;
  dev?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
}

function createValidFixtures() {
  const fullAuditJson: {
    auditReportVersion: number;
    vulnerabilities: Record<string, VulnerabilityRecord>;
    metadata: {
      vulnerabilities: Record<string, number>;
      dependencies: Record<string, number>;
    };
  } = {
    auditReportVersion: 2,
    vulnerabilities: {
      '@next/eslint-plugin-next': {
        name: '@next/eslint-plugin-next',
        severity: 'high',
        isDirect: false,
        via: ['fast-glob'],
        effects: ['eslint-config-next'],
        range: '>=14.3.0-canary.0',
        nodes: ['node_modules/@next/eslint-plugin-next'],
      },
      braces: {
        name: 'braces',
        severity: 'high',
        isDirect: false,
        via: [
          {
            source: 1240992,
            name: 'braces',
            dependency: 'braces',
            title: 'braces vulnerable to stack-exhaustion denial of service through deeply nested patterns',
            url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
            severity: 'high',
            cwe: ['CWE-674'],
            cvss: { score: 7.5, vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
            range: '<=3.0.3',
          },
        ],
        effects: ['micromatch'],
        range: '*',
        nodes: ['node_modules/braces'],
      },
      'eslint-config-next': {
        name: 'eslint-config-next',
        severity: 'high',
        isDirect: true,
        via: ['@next/eslint-plugin-next'],
        effects: [],
        range: '>=14.3.0-canary.0',
        nodes: ['node_modules/eslint-config-next'],
      },
      'fast-glob': {
        name: 'fast-glob',
        severity: 'high',
        isDirect: false,
        via: ['micromatch'],
        effects: ['@next/eslint-plugin-next'],
        range: '*',
        nodes: ['node_modules/fast-glob'],
      },
      micromatch: {
        name: 'micromatch',
        severity: 'high',
        isDirect: false,
        via: ['braces'],
        effects: ['fast-glob'],
        range: '>=0.2.0',
        nodes: ['node_modules/micromatch'],
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 5,
        critical: 0,
        total: 5,
      },
      dependencies: {
        prod: 117,
        dev: 432,
        optional: 124,
        peer: 1,
        peerOptional: 0,
        total: 590,
      },
    },
  };

  const prodAuditJson: {
    auditReportVersion: number;
    vulnerabilities: Record<string, VulnerabilityRecord>;
    metadata: {
      vulnerabilities: Record<string, number>;
      dependencies: Record<string, number>;
    };
  } = {
    auditReportVersion: 2,
    vulnerabilities: {},
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0,
      },
      dependencies: {
        prod: 117,
        dev: 0,
        optional: 124,
        peer: 1,
        peerOptional: 0,
        total: 117,
      },
    },
  };

  const lockfile: {
    packages: Record<string, LockPackageRecord>;
  } = {
    packages: {
      '': {
        name: 'metria-meteora',
        version: '0.1.0',
        dependencies: {},
        devDependencies: {
          'eslint-config-next': '16.4.0',
        },
      },
      'node_modules/eslint-config-next': {
        version: '16.4.0',
        dev: true,
        dependencies: {
          '@next/eslint-plugin-next': '16.4.0',
        },
      },
      'node_modules/@next/eslint-plugin-next': {
        version: '16.4.0',
        dev: true,
        dependencies: {
          'fast-glob': '3.3.1',
        },
      },
      'node_modules/fast-glob': {
        version: '3.3.1',
        dev: true,
        dependencies: {
          micromatch: '4.0.8',
        },
      },
      'node_modules/micromatch': {
        version: '4.0.8',
        dev: true,
        dependencies: {
          braces: '3.0.3',
        },
      },
      'node_modules/braces': {
        version: '3.0.3',
        dev: true,
      },
    },
  };

  return { fullAuditJson, prodAuditJson, lockfile };
}

describe('Audit Gate Policy & Evaluation', () => {
  it('1. accepts braces@3.0.3 when all approved conditions and chain match exactly', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary?.status).toBe('EXCEPTION_APPROVED');
    expect(result.summary?.advisoryId).toBe('GHSA-vfj7-8cjw-p6xm');
    expect(result.summary?.totalFindings).toBe(5);
    expect(result.summary?.productionFindings).toBe(0);
  });

  it('2. rejects when a different High severity advisory is encountered', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Tamper advisory URL
    const firstVia = fullAuditJson.vulnerabilities.braces.via[0];
    if (typeof firstVia === 'object') {
      firstVia.url = 'https://github.com/advisories/GHSA-unapproved-high-999';
    }

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('braces advisory mismatch'))).toBe(true);
  });

  it('3. rejects when a new Moderate advisory is introduced', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Add moderate advisory
    fullAuditJson.metadata.vulnerabilities.moderate = 1;
    fullAuditJson.metadata.vulnerabilities.total = 6;
    fullAuditJson.vulnerabilities['some-lib'] = {
      name: 'some-lib',
      severity: 'moderate',
      via: [{ name: 'some-lib', url: 'https://github.com/advisories/GHSA-mod-123' }],
    };

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('Moderate'))).toBe(true);
  });

  it('4. rejects when braces installed version differs from 3.0.3', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Tamper version in lockfile
    lockfile.packages['node_modules/braces'].version = '3.0.4';

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('version mismatch for braces'))).toBe(true);
  });

  it('5. rejects when advisory severity or metadata is altered', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Change braces severity to critical
    fullAuditJson.vulnerabilities.braces.severity = 'critical';
    fullAuditJson.metadata.vulnerabilities.critical = 1;
    fullAuditJson.metadata.vulnerabilities.high = 4;

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('Critical'))).toBe(true);
  });

  it('6. rejects when the dependency path changes or breaks', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Sever micromatch -> braces linkage
    lockfile.packages['node_modules/micromatch'].dependencies = {};

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('does not declare dependency on braces'))).toBe(true);
  });

  it('7. rejects immediately if any production vulnerability appears', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    // Add production vulnerability
    prodAuditJson.vulnerabilities = {
      'stream-json': {
        name: 'stream-json',
        severity: 'moderate',
        via: ['stream-json'],
      },
    };
    prodAuditJson.metadata.vulnerabilities.moderate = 1;
    prodAuditJson.metadata.vulnerabilities.total = 1;

    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('Production dependency audit failed'))).toBe(true);
  });

  it('8. rejects malformed or incomplete audit JSON', () => {
    const { lockfile } = createValidFixtures();

    const result = evaluateAudit({
      fullAuditJson: null,
      prodAuditJson: {},
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('Malformed or missing'))).toBe(true);
  });

  it('9. rejects if audit operational command fails or returns unparseable content', () => {
    // Test runAuditGate with non-existent directory
    const result = runAuditGate({ repoRoot: 'C:\\non-existent-directory-xyz' });
    expect(result.exitCode).toBe(1);
  });

  it('10. accepts clean audit with zero vulnerabilities', () => {
    const { prodAuditJson, lockfile } = createValidFixtures();
    const cleanFullAudit = {
      auditReportVersion: 2,
      vulnerabilities: {},
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 0,
          critical: 0,
          total: 0,
        },
      },
    };

    const result = evaluateAudit({
      fullAuditJson: cleanFullAudit,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-10-10'),
    });

    expect(result.passed).toBe(true);
    expect(result.summary?.status).toBe('CLEAN');
    expect(result.summary?.totalFindings).toBe(0);
  });

  it('11. fails closed if the review date has expired (post 2026-11-10)', () => {
    const { fullAuditJson, prodAuditJson, lockfile } = createValidFixtures();
    const result = evaluateAudit({
      fullAuditJson,
      prodAuditJson,
      lockfile,
      currentDate: new Date('2026-11-15T00:00:00Z'),
    });

    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('expired'))).toBe(true);
  });
});
