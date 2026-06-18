/**
 * Conformance suite harness (SPEC.md §15 #001).
 *
 * Each case under `conformance/cases/<name>/` is a small LiveSpec project paired
 * with an `expected.json` listing the diagnostics the reference linter must
 * emit. We assert the multiset of (ruleId, file) pairs matches exactly: this
 * dogfoods the format (every fixture is real LiveSpec) and pins each rule to a
 * concrete example. Line/message are not asserted, to keep fixtures stable.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { lintProject } from "../lint-project.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CASES_DIR = path.resolve(here, "../../../../conformance/cases");

interface Expected {
  description: string;
  diagnostics: { ruleId: string; file: string }[];
}

function key(d: { ruleId: string; file?: string; filePath?: string }): string {
  return `${d.ruleId}@${d.file ?? d.filePath}`;
}

const caseNames = fs.existsSync(CASES_DIR)
  ? fs.readdirSync(CASES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];

describe("conformance corpus", () => {
  it("the corpus directory exists and has cases", () => {
    expect(caseNames.length).toBeGreaterThan(0);
  });

  for (const name of caseNames) {
    it(name, () => {
      const caseDir = path.join(CASES_DIR, name);
      const expected: Expected = JSON.parse(
        fs.readFileSync(path.join(caseDir, "expected.json"), "utf-8"),
      );

      const { diagnostics } = lintProject(caseDir);

      const actualKeys = diagnostics.map(key).sort();
      const expectedKeys = expected.diagnostics.map(key).sort();

      // Friendly failure: show the symmetric difference.
      if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
        const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
        const unexpected = actualKeys.filter((k) => !expectedKeys.includes(k));
        throw new Error(
          `Case "${name}" diagnostics mismatch.\n` +
            `  missing (expected, not emitted): ${JSON.stringify(missing)}\n` +
            `  unexpected (emitted, not expected): ${JSON.stringify(unexpected)}\n` +
            `  full actual: ${JSON.stringify(diagnostics.map((d) => `${d.ruleId}@${d.filePath}:${d.line}`), null, 2)}`,
        );
      }
      expect(actualKeys).toEqual(expectedKeys);
    });
  }
});
