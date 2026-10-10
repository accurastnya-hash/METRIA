import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const APPROVED_EXCEPTION = {
  advisoryId: 'GHSA-vfj7-8cjw-p6xm',
  packageName: 'braces',
  installedVersion: '3.0.3',
  severity: 'high',
  approvedChain: [
    { name: 'eslint-config-next', version: '16.4.0', dev: true },
    { name: '@next/eslint-plugin-next', version: '16.4.0', dev: true },
    { name: 'fast-glob', version: '3.3.1', dev: true },
    { name: 'micromatch', version: '4.0.8', dev: true },
    { name: 'braces', version: '3.0.3', dev: true },
  ],
  owner: 'accurastnya-hash',
  reviewDate: '2026-11-10',
  description: 'Temporarily accepted development-tooling risk for braces stack exhaustion DoS',
};

/**
 * Pure evaluation function for audit results against policy.
 */
export function evaluateAudit({
  fullAuditJson,
  prodAuditJson,
  lockfile,
  currentDate = new Date(),
  overrideReviewDate = null,
}) {
  const errors = [];
  const warnings = [];

  // 1. Validate Review Date Window
  const reviewLimit = overrideReviewDate
    ? new Date(overrideReviewDate)
    : new Date(`${APPROVED_EXCEPTION.reviewDate}T23:59:59Z`);
  const now = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;

  if (Number.isNaN(now.getTime())) {
    errors.push('Invalid current date passed to evaluateAudit');
  } else if (now.getTime() > reviewLimit.getTime()) {
    errors.push(
      `Security exception review date (${APPROVED_EXCEPTION.reviewDate}) has expired as of ${now.toISOString()}. Maintainer re-approval required.`
    );
  }

  // 2. Validate Schema and Integrity of inputs
  if (!prodAuditJson || typeof prodAuditJson !== 'object') {
    errors.push('Malformed or missing production audit JSON (npm audit --omit=dev)');
  }
  if (!fullAuditJson || typeof fullAuditJson !== 'object') {
    errors.push('Malformed or missing full audit JSON (npm audit --json)');
  }
  if (!lockfile || typeof lockfile !== 'object' || !lockfile.packages) {
    errors.push('Malformed or missing package-lock.json data');
  }

  if (errors.length > 0) {
    return { passed: false, errors, warnings, summary: null };
  }

  // 3. Strict Production Audit Zero-Tolerance Check
  const prodVulns = prodAuditJson.vulnerabilities ? Object.keys(prodAuditJson.vulnerabilities) : [];
  const prodTotal = prodAuditJson.metadata?.vulnerabilities?.total ?? prodVulns.length;

  if (prodVulns.length > 0 || prodTotal > 0) {
    errors.push(
      `Production dependency audit failed: ${prodTotal} vulnerability/ies detected in production graph. ` +
        `Affected production packages: [${prodVulns.join(', ')}]. Production dependencies have ZERO allowable exceptions.`
    );
  }

  // 4. Validate Lockfile Topology for the Approved Chain
  const rootPkg = lockfile.packages[''] || {};
  const devDeps = rootPkg.devDependencies || {};
  const prodDeps = rootPkg.dependencies || {};

  if (!devDeps['eslint-config-next']) {
    errors.push('eslint-config-next is not declared in root package.json devDependencies');
  }
  if (prodDeps['eslint-config-next']) {
    errors.push('eslint-config-next is declared in root package.json dependencies (must be dev-only)');
  }

  // Verify each node in lockfile
  const expectedChain = APPROVED_EXCEPTION.approvedChain;
  for (let i = 0; i < expectedChain.length; i++) {
    const node = expectedChain[i];
    // Find node path in lockfile
    const lockKey = i === 0 ? `node_modules/${node.name}` : Object.keys(lockfile.packages).find(
      (k) => k.endsWith(`node_modules/${node.name}`)
    );

    if (!lockKey || !lockfile.packages[lockKey]) {
      errors.push(`Lockfile missing required package node: node_modules/${node.name}`);
      continue;
    }

    const pkgData = lockfile.packages[lockKey];
    if (pkgData.version !== node.version) {
      errors.push(
        `Lockfile version mismatch for ${node.name}: expected ${node.version}, found ${pkgData.version}`
      );
    }
    if (pkgData.dev !== true) {
      errors.push(`Lockfile node ${node.name} is not marked dev: true`);
    }

    // Verify linkage to next node in chain
    if (i < expectedChain.length - 1) {
      const nextNode = expectedChain[i + 1];
      const declaredNext = (pkgData.dependencies && pkgData.dependencies[nextNode.name]) || null;
      if (!declaredNext) {
        errors.push(`Package ${node.name} does not declare dependency on ${nextNode.name}`);
      }
    }
  }

  // 5. Full Audit Evaluation
  const fullVulnMap = fullAuditJson.vulnerabilities || {};
  const vulnKeys = Object.keys(fullVulnMap);
  const metadataVulns = fullAuditJson.metadata?.vulnerabilities || {};
  const totalFindings = metadataVulns.total ?? vulnKeys.length;

  // Case A: Clean Audit (0 findings)
  if (vulnKeys.length === 0 && totalFindings === 0) {
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalFindings: 0,
        productionFindings: 0,
        approvedExceptions: 0,
        unapprovedFindings: 0,
        status: 'CLEAN',
      },
    };
  }

  // Case B: Findings Present - verify they match EXACT approved exception
  const allowedChainNames = expectedChain.map((c) => c.name);

  // Check metadata severities
  if ((metadataVulns.critical ?? 0) > 0) {
    errors.push(`Unapproved Critical severity vulnerability/ies detected: ${metadataVulns.critical}`);
  }
  if ((metadataVulns.moderate ?? 0) > 0) {
    errors.push(`Unapproved Moderate severity vulnerability/ies detected: ${metadataVulns.moderate}`);
  }
  if ((metadataVulns.low ?? 0) > 0) {
    errors.push(`Unapproved Low severity vulnerability/ies detected: ${metadataVulns.low}`);
  }
  if ((metadataVulns.info ?? 0) > 0) {
    errors.push(`Unapproved Info severity vulnerability/ies detected: ${metadataVulns.info}`);
  }

  let bracesAdvisoryVerified = false;

  for (const pkgName of vulnKeys) {
    if (!allowedChainNames.includes(pkgName)) {
      errors.push(`Unapproved vulnerable package in audit report: "${pkgName}". Not in approved dev chain.`);
      continue;
    }

    const record = fullVulnMap[pkgName];
    if (record.severity !== APPROVED_EXCEPTION.severity) {
      errors.push(
        `Package "${pkgName}" has severity "${record.severity}", expected "${APPROVED_EXCEPTION.severity}".`
      );
    }

    if (pkgName === 'braces') {
      // Leaf package: inspect via array for advisory
      const viaItems = Array.isArray(record.via) ? record.via : [];
      if (viaItems.length === 0) {
        errors.push('braces record has empty or invalid "via" array in audit JSON');
      }

      for (const item of viaItems) {
        if (typeof item === 'object' && item !== null) {
          const advisoryUrl = item.url || '';
          if (!advisoryUrl.includes(APPROVED_EXCEPTION.advisoryId)) {
            errors.push(
              `braces advisory mismatch: expected ${APPROVED_EXCEPTION.advisoryId}, found URL: ${advisoryUrl}`
            );
          }
          if (item.name !== APPROVED_EXCEPTION.packageName) {
            errors.push(`braces advisory package name mismatch: found "${item.name}"`);
          }
          if (item.severity !== APPROVED_EXCEPTION.severity) {
            errors.push(`braces advisory severity mismatch: found "${item.severity}"`);
          }
          bracesAdvisoryVerified = true;
        } else {
          errors.push(`Unexpected string reference in braces via array: "${item}"`);
        }
      }
    } else {
      // Dependent packages in chain: via must point strictly down the chain
      const expectedVia = {
        micromatch: 'braces',
        'fast-glob': 'micromatch',
        '@next/eslint-plugin-next': 'fast-glob',
        'eslint-config-next': '@next/eslint-plugin-next',
      }[pkgName];

      const viaList = Array.isArray(record.via) ? record.via : [];
      if (viaList.length !== 1 || viaList[0] !== expectedVia) {
        errors.push(
          `Dependent package "${pkgName}" has unexpected via [${viaList.join(', ')}], expected strictly ["${expectedVia}"]`
        );
      }
    }
  }

  if (!bracesAdvisoryVerified) {
    errors.push(`Approved advisory ${APPROVED_EXCEPTION.advisoryId} was not identified in audit records`);
  }

  const passed = errors.length === 0;

  return {
    passed,
    errors,
    warnings,
    summary: {
      totalFindings,
      productionFindings: prodTotal,
      approvedExceptions: passed ? totalFindings : 0,
      unapprovedFindings: passed ? 0 : totalFindings,
      status: passed ? 'EXCEPTION_APPROVED' : 'FAILED',
      advisoryId: APPROVED_EXCEPTION.advisoryId,
      packageName: `${APPROVED_EXCEPTION.packageName}@${APPROVED_EXCEPTION.installedVersion}`,
      reviewDate: APPROVED_EXCEPTION.reviewDate,
      owner: APPROVED_EXCEPTION.owner,
    },
  };
}

/**
 * Execute audit commands via npm CLI, save audit-report.json, and enforce gate.
 */
export function runAuditGate({ repoRoot = REPO_ROOT, reportPath = null, prodReportPath = null } = {}) {
  const outputPath = reportPath || path.join(repoRoot, 'audit-report.json');
  const prodOutputPath = prodReportPath || path.join(repoRoot, 'audit-report-prod.json');

  process.stdout.write('=== METRIA Dependency Security Audit Gate ===\n');
  process.stdout.write(`Repository Root: ${repoRoot}\n`);
  process.stdout.write('Executing full and production npm audit checks...\n\n');

  let fullAuditJson;
  let prodAuditJson;
  let rawFullAuditOutput = '';
  let rawProdAuditOutput = '';

  // 1. Run npm audit --json (full audit)
  try {
    rawFullAuditOutput = execSync('npm audit --json', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    // npm audit exits with 1 when vulnerabilities are present
    rawFullAuditOutput = err.stdout ? err.stdout.toString() : '';
  }

  try {
    fullAuditJson = JSON.parse(rawFullAuditOutput);
  } catch (err) {
    process.stderr.write(`FATAL: Failed to parse npm audit --json output: ${err.message}\n`);
    process.stderr.write(`Raw output preview: ${rawFullAuditOutput.slice(0, 500)}\n`);
    return { exitCode: 1 };
  }

  // Always write unmodified full audit report artifact
  try {
    writeFileSync(outputPath, JSON.stringify(fullAuditJson, null, 2), 'utf8');
    process.stdout.write(`Saved raw full audit report artifact: ${outputPath}\n`);
  } catch (err) {
    process.stderr.write(`WARNING: Failed to write audit artifact: ${err.message}\n`);
  }

  // 2. Run npm audit --omit=dev --json (production audit)
  try {
    rawProdAuditOutput = execSync('npm audit --omit=dev --json', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    rawProdAuditOutput = err.stdout ? err.stdout.toString() : '';
  }

  try {
    prodAuditJson = JSON.parse(rawProdAuditOutput);
  } catch (err) {
    process.stderr.write(`FATAL: Failed to parse npm audit --omit=dev --json output: ${err.message}\n`);
    return { exitCode: 1 };
  }

  // Always write unmodified production audit report artifact
  try {
    writeFileSync(prodOutputPath, JSON.stringify(prodAuditJson, null, 2), 'utf8');
    process.stdout.write(`Saved raw production audit report artifact: ${prodOutputPath}\n`);
  } catch (err) {
    process.stderr.write(`WARNING: Failed to write production audit artifact: ${err.message}\n`);
  }

  // 3. Load package-lock.json
  let lockfile;
  try {
    const lockPath = path.join(repoRoot, 'package-lock.json');
    lockfile = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch (err) {
    process.stderr.write(`FATAL: Failed to read package-lock.json: ${err.message}\n`);
    return { exitCode: 1 };
  }

  // 4. Evaluate against security policy
  const evaluation = evaluateAudit({
    fullAuditJson,
    prodAuditJson,
    lockfile,
    currentDate: new Date(),
  });

  process.stdout.write('\n--- Audit Gate Evaluation Summary ---\n');
  if (evaluation.summary) {
    process.stdout.write(`Status:                ${evaluation.summary.status}\n`);
    process.stdout.write(`Total Audit Findings:  ${evaluation.summary.totalFindings}\n`);
    process.stdout.write(`Production Findings:   ${evaluation.summary.productionFindings} (must be 0)\n`);
    process.stdout.write(`Approved Exceptions:   ${evaluation.summary.approvedExceptions}\n`);
    process.stdout.write(`Unapproved Findings:   ${evaluation.summary.unapprovedFindings}\n`);
  }

  if (evaluation.passed) {
    process.stdout.write('\n[PASS] Security audit gate succeeded.\n');
    if (evaluation.summary?.status === 'EXCEPTION_APPROVED') {
      process.stdout.write(`Active Approved Exception:\n`);
      process.stdout.write(`  Advisory ID:      ${APPROVED_EXCEPTION.advisoryId}\n`);
      process.stdout.write(`  Package:          ${APPROVED_EXCEPTION.packageName}@${APPROVED_EXCEPTION.installedVersion}\n`);
      process.stdout.write(`  Severity:         ${APPROVED_EXCEPTION.severity}\n`);
      process.stdout.write(`  Scope:            Development tooling only\n`);
      process.stdout.write(`  Owner:            ${APPROVED_EXCEPTION.owner}\n`);
      process.stdout.write(`  Review Gate Date: ${APPROVED_EXCEPTION.reviewDate}\n`);
      process.stdout.write(`  Chain:            ${APPROVED_EXCEPTION.approvedChain.map((c) => c.name + '@' + c.version).join(' -> ')}\n`);
      process.stdout.write(`Note: This is a temporary maintainer-approved exception, NOT a claim that the vulnerability has been resolved.\n`);
    } else {
      process.stdout.write('Repository dependencies are 100% clean with zero reported vulnerabilities.\n');
    }
    return { exitCode: 0, evaluation };
  }

  process.stderr.write('\n[FAIL] Security audit gate rejected with the following error(s):\n');
  for (const err of evaluation.errors) {
    process.stderr.write(`  - ${err}\n`);
  }
  return { exitCode: 1, evaluation };
}

// CLI entrypoint if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runAuditGate();
  process.exit(result.exitCode);
}
