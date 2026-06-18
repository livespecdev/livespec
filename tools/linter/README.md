# @livespec/linter

The reference **Level-3 conformance linter** for the LiveSpec format (`SPEC.md` §14). It reads the markdown files of a LiveSpec project directly, with no server, no API, and no proprietary application, and reports structural, referential, and spec-to-code diagnostics.

Every rule is anchored to a `SPEC.md` section (see `src/rules.ts`). A rule with no section is a bug.

## Install / build

```bash
npm install
npm run build
```

## CLI

```bash
# Lint the project found at or under the current directory
npx livespec-lint

# Lint a specific path; scan a separate code root for livespec: markers (§9.4)
npx livespec-lint path/to/repo --code-root path/to/src

# Errors only
npx livespec-lint --quiet
```

Output is one line per diagnostic:

```
features/items.md:9  error  E305 [§8.3]  AC AC-2.1 should be AC-1.x to match parent REQ-1
```

Exit code is `1` when any error-severity diagnostic is found, `0` otherwise (`2` when no project is found).

## Library

```ts
import { lintProject, findProjectRoots, lintFile, RULES } from "@livespec/linter";

for (const root of findProjectRoots(".")) {
  const { diagnostics } = lintProject(root);
  for (const d of diagnostics) {
    console.log(`${d.filePath}:${d.line ?? "-"}  ${d.severity}  ${d.ruleId}  ${d.message}`);
  }
}
```

Diagnostics are **collected, never thrown**: one pass surfaces every issue.

```ts
interface LintDiagnostic {
  severity: "error" | "warning";
  ruleId: string;     // e.g. "E301", "W500"
  message: string;
  filePath: string;   // relative to the project root
  line: number | null;
}
```

## What it checks

| Area | Rules | Spec |
|---|---|---|
| Manifest | E010-E013, W010-W011 | §4, §12, §13 |
| Placement / slugs | E001-E003 | §3, §6.1, §9.1 |
| Frontmatter / structure | E101-E106, E105 | §5, §6.4, §7.4, §10 |
| Spec items | E301-E306, W300-W303 | §8 |
| Features / sections | E401-E402, W410, E411-E413 | §7.1, §7.3, §12.2 |
| Linking | E501, W500-W503 | §7.2, §9.2, §9.5 |
| Spec-to-code markers | E601-E602, W600-W601 | §9.4 |

See `src/rules.ts` for the full catalog.

## Modes

The linter reads `mode` from `livespec.yaml` (§12). In `loose` (default) the canonical-section rules are advisory; in `strict` they are enforced (E411-E413, W303).

## Conformance corpus

Tests are driven by the shared conformance corpus in `../../conformance` (`SPEC.md` §15 #001): each case is a real LiveSpec project paired with its expected diagnostics.

```bash
npm test
```

Third-party tools claiming Level-3 conformance SHOULD reproduce the corpus's expected diagnostics.

## Scope

This is a **forward** conformance tool: it validates LiveSpec files. It does not author specs (that is the `livespec-tools` Claude Code plugin) and it does not reverse-engineer code into specs (that is `reverse-livespec`). Per `SPEC.md` §9.4, the linter validates marker **syntax and resolution only**; coverage rules, drift detection, and verification semantics are deliberately out of scope.
