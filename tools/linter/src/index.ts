/**
 * @livespec/linter
 *
 * Reference Level-3 conformance linter for the LiveSpec format (SPEC.md §14).
 * Pure, file-based, no server. Diagnostics are collected, never thrown.
 */

export { lintFile, type FileContext, type FileKind } from "./lint-file.js";
export {
  lintProject,
  SUPPORTED_FORMAT_MAJOR,
  type ProjectLintOptions,
  type ProjectLintResult,
} from "./lint-project.js";
export { findProjectRoots } from "./locate.js";
export { RULES, ruleSpec, type RuleDefinition } from "./rules.js";
export {
  collector,
  type LintDiagnostic,
  type LintOptions,
  type Severity,
  type Diag,
} from "./diagnostics.js";
export * as parse from "./parse.js";
export * as taxonomy from "./taxonomy.js";
