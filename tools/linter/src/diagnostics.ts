/**
 * Diagnostic types for the LiveSpec reference linter.
 *
 * Diagnostics are collected, never thrown: a single pass over a file or
 * project surfaces every issue it contains.
 */

export type Severity = "error" | "warning";

export interface LintDiagnostic {
  /** Error or warning. */
  severity: Severity;
  /** Stable rule identifier (e.g. "E301", "W500"). See rules.ts. */
  ruleId: string;
  /** Human-readable description of the issue. */
  message: string;
  /** Path of the offending file, relative to the project root. */
  filePath: string;
  /** 1-based line number, when traceable. */
  line: number | null;
}

export interface LintOptions {
  /**
   * Manifest mode (`loose` | `strict`), per SPEC.md §12. When omitted, the
   * linter applies loose-mode rules. lintProject derives this from
   * `livespec.yaml`.
   */
  mode?: "loose" | "strict";
}

/** Factory for a scoped diagnostic collector bound to one file path. */
export function collector(filePath: string, sink: LintDiagnostic[]) {
  return (
    ruleId: string,
    severity: Severity,
    message: string,
    line: number | null = null,
  ): void => {
    sink.push({ severity, ruleId, message, filePath, line });
  };
}

export type Diag = ReturnType<typeof collector>;
