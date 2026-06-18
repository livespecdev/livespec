#!/usr/bin/env node
/**
 * livespec-lint CLI.
 *
 * Usage:
 *   livespec-lint [path]            Lint the project found at/under [path] (default: cwd)
 *   livespec-lint --code-root <dir> Where to scan for livespec: source markers (§9.4)
 *   livespec-lint --quiet           Suppress warnings; report errors only
 *
 * Exit code: 1 if any error-severity diagnostic is found, else 0.
 */

import * as path from "node:path";
import { findProjectRoots } from "./locate.js";
import { lintProject } from "./lint-project.js";
import { ruleSpec } from "./rules.js";
import type { LintDiagnostic } from "./diagnostics.js";

function main(argv: string[]): number {
  const args = argv.slice(2);
  let start = ".";
  let codeRoot: string | undefined;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--code-root") codeRoot = args[++i];
    else if (a === "--quiet") quiet = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      return 0;
    } else start = a;
  }

  const roots = findProjectRoots(start);
  if (roots.length === 0) {
    process.stderr.write(`No livespec.yaml found at or under ${path.resolve(start)}\n`);
    return 2;
  }

  let errorCount = 0;
  let warnCount = 0;

  for (const root of roots) {
    const { diagnostics } = lintProject(root, { codeRoot: codeRoot ? path.resolve(codeRoot) : undefined });
    const shown = quiet ? diagnostics.filter((x) => x.severity === "error") : diagnostics;
    if (roots.length > 1) process.stdout.write(`\n# ${root}\n`);
    for (const x of sortDiagnostics(shown)) {
      process.stdout.write(format(x) + "\n");
      if (x.severity === "error") errorCount++;
      else warnCount++;
    }
  }

  process.stdout.write(`\n${errorCount} error(s), ${warnCount} warning(s)\n`);
  return errorCount > 0 ? 1 : 0;
}

function sortDiagnostics(diags: LintDiagnostic[]): LintDiagnostic[] {
  return [...diags].sort((a, b) => {
    if (a.filePath !== b.filePath) return a.filePath < b.filePath ? -1 : 1;
    return (a.line ?? 0) - (b.line ?? 0);
  });
}

function format(x: LintDiagnostic): string {
  const loc = x.line === null ? x.filePath : `${x.filePath}:${x.line}`;
  return `${loc}  ${x.severity === "error" ? "error" : "warning"}  ${x.ruleId} [${ruleSpec(x.ruleId)}]  ${x.message}`;
}

function printHelp(): void {
  process.stdout.write(
    [
      "livespec-lint - reference Level-3 linter for the LiveSpec format",
      "",
      "Usage: livespec-lint [path] [--code-root <dir>] [--quiet]",
      "",
      "  path           directory to search for livespec.yaml (default: .)",
      "  --code-root    root to scan for `livespec:` source markers (default: project root)",
      "  --quiet        report errors only",
      "",
    ].join("\n"),
  );
}

process.exit(main(process.argv));
