# LiveSpec

> A file format for product specifications that stay current with the code they describe.

LiveSpec is an open specification format for capturing what a software product is, why it exists, and how it should behave — in a way that humans, AI agents, and tools can all read and write the same files.

It targets teams building software with AI coding agents, where the quality of the spec directly determines the quality of the generated code.

## Why

Product specifications drift away from reality the moment they're written. Word docs, Notion pages, Jira tickets — all assume specs are written once and discarded. In an agent-first workflow, that's catastrophic: every new session burns time re-explaining context that should already exist in a durable, structured form.

LiveSpec is built on the opposite assumption: **specs should live alongside code and be maintained continuously, by humans and agents working together.**

## What it is

- **A plain-markdown file format** — readable in any editor, renderable on GitHub, diffable in git
- **A folder convention** — `product/`, `ux/`, `tech/`, `features/`
- **A typed system** — every concept (persona, principle, requirement, etc.) has a known shape, validated by tools
- **Tool-independent** — any LiveSpec-conformant tool can read or write any LiveSpec project

## What it's not

A project management system. A documentation generator. A specific application. LiveSpec is just the format — the layer that lets specs travel between people, tools, and agents without lock-in.

## A minimal example

```
my-app/
├── livespec.yaml
├── product/
│   └── persona/
│       └── power-user.md
└── features/
    └── search/
        └── full-text-search.md
```

`product/persona/power-user.md`:

```markdown
---
tags: [primary]
---

# Power User

Heavy daily user who knows the product deeply and pushes its edges.
```

`features/search/full-text-search.md`:

```markdown
---
links:
  persona: [power-user]
---

# Full-text Search

As a power user, I want to search across all my documents so that I can find content without remembering where I put it.

## Requirements

- [ ] REQ-1: Search bar visible in main navigation
  - [ ] AC-1.1: Search input renders in header on all pages
  - [ ] AC-1.2: Search remains accessible on mobile
- [ ] REQ-2: Results returned within 300ms

## Tech

Use PostgreSQL full-text search for v1.
```

That's a complete, valid LiveSpec project.

## Core principles

- **Markdown all the way down.** Specs are plain text files. No proprietary editor, no database, no vendor required.
- **Structured where it matters.** YAML frontmatter for metadata, conventional sections for body, checkboxes for tracked items. Strict enough to be machine-parseable, loose enough to be human-writeable.
- **Git-native.** Specs live in the repo, evolve through pull requests, get reviewed like code.
- **Spec-anchored.** Spec and code are independently authored and kept in sync by explicit code-side markers — not generated from each other.
- **Agent-ready.** Compact layout, slug-based linking, predictable structure — designed for LLMs to consume efficiently.
- **Lean core, extensible by convention.** A small set of universal concept types in v1; everything else through a documented extension mechanism.

## Status

**Draft `v1.0.0-draft`** — open for review.

The full specification is in [`SPEC.md`](./SPEC.md). JSON Schemas, conformance test suite, and reference tooling are under active development.

## Reference implementation

[Territory](https://territory.dev) — the product where LiveSpec was developed and the current reference implementation.

## Contributing

LiveSpec is an open specification. Issues, RFC proposals, and discussion are welcome via GitHub issues. Work-in-progress RFCs live in [`rfcs/`](./rfcs/).

## License

TBD.
