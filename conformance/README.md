# LiveSpec conformance corpus

This directory is the conformance test suite anticipated by `SPEC.md` §14 and tracked as §15 #001. It is part of the **standard**, not of any single tool: it tests the **format**, not an implementation.

Each case under `cases/<name>/` is a small but real LiveSpec project paired with an `expected.json` describing the diagnostics a Level-3 linter (§14) MUST emit when linting that project. Because every fixture is itself a valid (or deliberately invalid) LiveSpec project, the corpus dogfoods the format end to end.

## Case layout

```
cases/<name>/
├── expected.json          # the contract: which diagnostics must be emitted
├── livespec.yaml          # (usually) the project manifest
├── product/ ux/ tech/     # concepts, as needed
├── features/              # features, as needed
└── src/                   # optional source files carrying livespec: markers (§9.4)
```

## `expected.json`

```json
{
  "description": "Human-readable summary of what this case exercises",
  "diagnostics": [
    { "ruleId": "E301", "file": "features/items.md" }
  ]
}
```

The harness asserts the **multiset** of `(ruleId, file)` pairs matches exactly. Line numbers and messages are intentionally not asserted, so fixtures stay stable as wording evolves. A clean project has `"diagnostics": []`.

`file` is the path relative to the case directory (the project root). For diagnostics on the manifest, `file` is `livespec.yaml`. For spec-code markers, `file` is the source file the marker was found in.

## Rule IDs

Rule IDs and the `SPEC.md` section each enforces are catalogued in `../tools/linter/src/rules.ts`. The reference linter that consumes this corpus lives in `../tools/linter`.

## Running

```bash
cd ../tools/linter
npm install
npm test
```

Third-party tools claiming Level-3 conformance SHOULD run their linter against this corpus and reproduce the expected diagnostics.
