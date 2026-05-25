# LiveSpec — Format Specification

**Version:** `v1.0.0-draft.1`
**Status:** Draft — open for comments
**Canonical home:** https://livespec.dev

> LiveSpec is a file format for product specifications that stay current with the code they describe. It is designed to be readable by humans, parseable by tools, and consumable by AI coding agents — without lock-in to any specific application.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Conventions & Conformance Language](#2-conventions--conformance-language)
3. [Repository Layout](#3-repository-layout)
4. [The Project Manifest](#4-the-project-manifest-livespecyaml)
5. [Entities](#5-entities)
6. [Concepts](#6-concepts)
7. [Features](#7-features)
8. [Spec Items](#8-spec-items)
9. [Linking System](#9-linking-system)
10. [Status Lifecycle](#10-status-lifecycle)
11. [Assets](#11-assets)
12. [Modes](#12-modes)
13. [Format Versioning](#13-format-versioning)
14. [Conformance Levels](#14-conformance-levels)
15. [Open Questions](#15-open-questions-rfc-candidates)

---

## 1. Philosophy

LiveSpec exists to solve a single problem: **product specifications drift away from reality the moment they are written.** Traditional spec formats (Word docs, Jira tickets, Notion pages) assume specs are written once and discarded. LiveSpec assumes specs are *continuously maintained alongside code* — by humans and AI agents working together.

The format optimizes for:

- **Human readability** — plain markdown, no proprietary editor required
- **Machine parseability** — strict, validated frontmatter; conventional body sections
- **Agent consumption** — structured enough for LLMs to reason about, compact enough to keep token budgets sane
- **Git-native workflow** — files, folders, diffs, pull requests
- **Tool independence** — any LiveSpec-conformant tool can read or write any LiveSpec project
- **Code-anchored** — a minimal, interoperable syntax (§9.4) links spec items to the source code that implements them, so the "live" in *LiveSpec* is backed by an actual mechanism — not just a workflow expectation

### Spec-anchored, not spec-first or spec-as-source

Following Birgitta Böckeler's framing ([Martin Fowler — *SDD: 3 Tools*](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)), LiveSpec targets the **spec-anchored** position on the spectrum:

- **Spec-first** treats the spec as a phase: write it, generate code, move on. The spec drifts or is abandoned once code exists.
- **Spec-anchored** treats spec and code as two first-class, independently authored artifacts kept in sync by explicit linkage (§9.4).
- **Spec-as-source** treats the spec as *the* artifact and code as regenerable on demand.

The §9.4 `livespec:` markers exist precisely to make anchoring **mechanical**: any tool can resolve a spec item back to the code that implements it, and any code site back to the intent it serves. LiveSpec does not assume code is generated from the spec, nor that the spec is reconstructed from the code — both are authored by humans and agents, and linked. Workflow concerns that follow from this stance (drift detection, coverage rules, regeneration semantics) are deliberately left to tooling (§9.4, §15 #014).

### Core principle: the software, not the work

LiveSpec describes **the software** — what it should do, why, who it serves, how it relates to other parts of the system. It does NOT describe **the work on the software** — who is doing it, when, in what state, or how the work is progressing.

That second concern belongs to project-management tools, code-review workflows, and the developer's own task system. Conflating the two is exactly what made past spec formats drift into staleness (Notion pages that nobody updates) or noise (Confluence trees of half-finished tickets). LiveSpec stays on the *software* side of that line on purpose; every design decision in this document can be cross-checked against it.

This principle is the rationale behind several explicit exclusions: no `status` enum on features (§10), no Implementation Notes section, no assignees or due dates, no kanban states. Anything that answers *"how is the work going?"* lives outside the spec — typically referenced from the spec via `x-*` extension fields if a tool needs the bridge.

It does **not** try to be:

- A project management system (see the principle above)
- A documentation generator (no rendering opinions beyond markdown)
- A verification engine — v1 defines how to *express* spec ↔ code links, but leaves coverage, drift detection, and validation entirely to tools (§9.4)
- A policy engine — the format lets you *express* principles, constraints, and conventions as concepts (§6.2), but *enforcing* them across the corpus (e.g. raising warnings when a feature violates a constraint, or requiring features tagged with a given persona to satisfy a checklist) is a tooling concern, not a format concern
- A specific application (LiveSpec is the format; Territory is one implementation)

---

## 2. Conventions & Conformance Language

This document uses RFC 2119 / RFC 8174 keywords: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**.

- **MUST** / **MUST NOT** — absolute requirements for conformance.
- **SHOULD** / **SHOULD NOT** — strong recommendations with allowed exceptions for justified cases.
- **MAY** — optional features.

Tools claiming LiveSpec conformance MUST satisfy all **MUST** requirements at the conformance level they target (see §14).

---

## 3. Repository Layout

A LiveSpec project is a directory tree rooted at a folder containing a `livespec.yaml` manifest. The canonical layout:

```
my-project/
├── livespec.yaml              # Project manifest (required)
├── product/                   # Product context — why, who, what
│   └── {type}/{slug}.md
├── ux/                        # User experience context
│   └── {type}/{slug}.md
├── tech/                      # Technical context
│   └── {type}/{slug}.md
└── features/                  # Feature specifications
    └── {area}/{slug}.md
```

**Rules:**

- The directory containing `livespec.yaml` is the **project root**.
- All paths in this spec are relative to the project root unless stated otherwise.
- The four semantically-meaningful top-level directories are **exhaustive and fixed**: `product/`, `ux/`, `tech/`, `features/`. LiveSpec defines **no mechanism** for adding new top-level directories with LiveSpec semantics. Concerns that span audiences (e.g. developer experience), or that look like sub-domains (e.g. ops, security, compliance, data, business), MUST be modeled as extension types **within the existing four** — never as new top-level folders. This constraint is deliberate: it preserves cross-tool interoperability and prevents the format from fragmenting.
- A project MAY contain additional top-level files and directories (e.g. `README.md`, `.git/`, `compiled/`, `node_modules/`). These have no semantic meaning to LiveSpec; conformant tools MUST ignore them unless explicitly opted in.

### 3.1 Project location patterns

A LiveSpec project can live anywhere — at the root of a repository, or nested inside a wider codebase. The presence of `livespec.yaml` is what defines the project root; everything else is convention. Common patterns:

| Pattern                          | Use case                                                              |
|----------------------------------|-----------------------------------------------------------------------|
| `./livespec.yaml`                | Repository dedicated to a product spec (e.g. `acme/product-spec`).    |
| `docs/livespec/livespec.yaml`    | Spec colocated with code inside an application repository.            |
| `.livespec/livespec.yaml`        | Spec kept as "infra" in a hidden top-level folder (`.github/` style). |
| `specs/livespec.yaml`            | Alternative when a `specs/` folder already exists by convention.      |

A single repository MAY contain multiple LiveSpec projects (e.g. one per app in a monorepo), each with its own `livespec.yaml` defining its own root. They are treated as independent projects with independent slug namespaces.

---

## 4. The Project Manifest (`livespec.yaml`)

Every LiveSpec project MUST contain a `livespec.yaml` at its root:

```yaml
format_version: "1.0"
name: My Project
```

A manifest activating strict mode:

```yaml
format_version: "1.0"
name: Acme Banking Domain
description: Spec for the Account Domain replatforming
mode: strict
```

| Field            | Type   | Required | Description                                              |
|------------------|--------|----------|----------------------------------------------------------|
| `format_version` | string | Yes      | LiveSpec spec version this project conforms to (semver). |
| `name`           | string | Yes      | Human-readable project name.                             |
| `description`    | string | No       | Short project description.                               |
| `mode`           | enum   | No       | `loose` (default) or `strict`. See §12.                  |

Additional fields MAY be added by tools as `x-{tool}-{key}` (e.g. `x-territory-project-id`). Conformant tools MUST preserve unknown `x-*` fields on write.

> **Future:** Mechanisms for shared configuration (presets, manifest inheritance) are under consideration for a future minor version. See §15.

---

## 5. Entities

LiveSpec defines two primary entity kinds:

| Kind             | Purpose                                      | Location              |
|------------------|----------------------------------------------|-----------------------|
| **Concept**      | Stable product/UX/tech knowledge             | `product/`, `ux/`, `tech/`     |
| **Feature**      | Specification of a capability being built    | `features/`           |

Each entity is exactly one markdown file. Each file MUST contain:
1. YAML frontmatter (delimited by `---` on its own line, at the start of the file)
2. An H1 heading matching the entity's title
3. Body content (sections defined per entity kind)

---

## 6. Concepts

### 6.1 Directory mapping rule

**Rule:** Inside `product/`, `ux/`, and `tech/`, each concept type lives in a subdirectory whose name **is** the type slug. The same slug is used as the key in `links` (see §9). No mapping table — the slug is canonical everywhere.

```
product/{type}/{item-slug}.md
ux/{type}/{item-slug}.md
tech/{type}/{item-slug}.md
```

Example: a concept of type `persona` with slug `the-product-engineer` lives at `product/persona/the-product-engineer.md`, and is referenced as `links: { persona: [the-product-engineer] }`.

### 6.2 Core taxonomy

This is the minimal **core taxonomy** of v1. Tools claiming Level 2+ conformance MUST support these types.

**Under `product/`:**
- `persona` — A user archetype.
- `pain_point` — A user or business pain the product addresses.
- `goal` — An outcome the product aims to deliver.
- `principle` — A guiding belief or rule for product decisions.
- `constraint` — A limit imposed on the product (scope, business, regulatory).
- `glossary_term` — A defined term used consistently across specs.

**Under `ux/`:**
- `ui_component` — A UI component (button, modal, input) with its usage rules.
- `design_principle` — A guiding belief or rule for UX decisions.
- `ux_pattern` — A reusable interaction or layout pattern.

**Under `tech/`:**
- `coding_standard` — A coding rule or convention.
- `architecture_decision` — An architectural choice and its rationale.

#### Naming convention for type slugs

Two rules govern type slug naming:

1. **Globally unique.** A type slug MUST be unique across the entire taxonomy. The resolver determines a concept's location from its type slug alone — no two types may share a slug, even across different top-level directories.
2. **Self-disambiguating.** A type slug SHOULD make sense on its own, without relying on its containing directory for meaning. Types whose bare name could plausibly belong to a different domain MUST be prefixed (e.g. `ui_component`, not `component`, because "component" is ambiguous with software components; `ux_pattern`, not `pattern`, because patterns exist in tech too).

Conversely, types whose bare name is already unambiguous (`persona`, `coding_standard`, `architecture_decision`) do not need a prefix.

**The product layer is the implicit default domain.** When a concept exists at both the product level and a more specific domain level, the unprefixed slug is reserved for the product-level variant. Example: `principle` is a product principle in `product/`; `design_principle` is its UX specialization in `ux/`. The same convention would apply if a future `tech_constraint` were introduced — `constraint` (unprefixed) would remain the product-level constraint in `product/`.

#### Recommended extension namespaces

To prevent fragmentation when teams introduce extension types for common technical concerns, LiveSpec recommends a shared naming convention:

- **`{concern}_convention`** for cross-cutting engineering rules: `api_convention`, `testing_convention`, `logging_convention`, `error_handling_convention`, `i18n_convention`, `data_convention`, `security_convention`, `performance_convention`.
- **`{concern}_pattern`** in `ux/` for design-system or interaction patterns scoped to a concern: `form_pattern`, `navigation_pattern`, `feedback_pattern`.

These are **not core types** — tools are not required to support them. But teams adding any of these SHOULD use the slug listed here so that LiveSpec projects and tools can interoperate consistently across organizations.

> **Extensions:** Tools MAY define additional types as subdirectories of `product/`, `ux/`, or `tech/`. Custom type slugs MUST follow both naming rules above. Unknown types MUST NOT cause parse failure in Level 1+ readers. A future RFC will formalize the extension registration mechanism (including the recommended namespaces above). See §15.

### 6.3 Frontmatter contract

```yaml
---
tags: [optional, comma-separated, labels]
links:
  {other-type-slug}: [slug-1, slug-2]
---
```

| Field   | Type             | Required | Description                          |
|---------|------------------|----------|--------------------------------------|
| `tags`  | string[]         | No       | Free-form classification labels.     |
| `links` | object           | No       | Cross-references; see §9.            |

### 6.4 Body contract

```markdown
# {Title}

{One-paragraph summary — MUST be present, MUST be a single paragraph}

## Details

### {Subsection}

{Free-form markdown content organized in H3 subsections}
```

- The H1 title MUST match the file's intended display name.
- The opening paragraph is the **summary** and is what tools display in lists / link previews.
- The `## Details` section is OPTIONAL and contains free-form H3 subsections.
- Tools MUST NOT impose constraints on H3 subsection names within `## Details`.

### 6.5 Choosing: concept or spec item

A rule like *"all logs must include a trace_id"* could plausibly live as a `logging_convention` concept in `tech/`, or as a `REQ` (an inline spec item — see §8) inside every feature that emits logs. The wrong choice produces either silent duplication across features or a single concept that no feature acknowledges. The format gives you a linking mechanism (§9) to avoid duplication; this section gives you the editorial rule for *when* to use it.

**Principle.** A concept captures a **standing rule** that applies across multiple features. A spec item captures a **specific behavior** of one feature.

**Diagnostic symptoms.** These are facets of the same principle, not an independent checklist:

- The rule pre-existed this feature and will survive after it ships.
- The rule applies to other features without needing to be restated.
- The rule evolves at its own pace, not in lockstep with any single feature.
- The rule is owned by a transverse team or domain authority, not by the feature's author.

If most of these point the same way, the answer is usually obvious. If they conflict, prefer **promote + link**: extract the rule as a concept, and let each feature reference it. Promoting is cheap; un-duplicating later is not.

**Illustrative examples:**

| Statement                                                                   | Goes as                          | Why                                                                                          |
|-----------------------------------------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------|
| *"All public APIs accept JSON and XML."*                                    | `api_convention` (concept)       | Pre-existing, applies to every API endpoint, evolves at platform pace.                       |
| *"All logs include a `trace_id`."*                                          | `logging_convention` (concept)   | Cross-cutting, no single feature owns it.                                                    |
| *"The `/checkout` endpoint accepts an `idempotency_key` header."*           | `REQ` in the checkout feature    | Specific to this endpoint and feature; not a general convention.                             |
| *"Telemetry events are opt-in."*                                            | `principle` in `product/`        | Standing product belief that shapes every feature emitting telemetry.                        |
| *"On checkout error, retry up to 3 times with exponential backoff."*        | `REQ` in the checkout feature    | Feature-specific behavior, unless retry policy is uniform — then promote to a convention.    |

**Boundary rule when feature work uncovers a new convention.** If, while writing a feature, you find yourself stating a rule that *would clearly apply elsewhere*, stop and write it as a concept first, then link from the feature. Do not let a global rule be born inside a single feature file.

---

## 7. Features

### 7.1 Directory layout

Features live under `features/{area}/{slug}.md`. The `{area}` segment groups related features (e.g. `features/authentication/sign-in-with-google.md`). Features with no area MUST live under `features/_uncategorized/`.

Areas MAY nest one level (e.g. `features/billing/invoicing/generate-pdf.md`). Deeper nesting is reserved for a future RFC.

### 7.2 Frontmatter contract

```yaml
---
links:
  persona: [slug-1, slug-2]
  pain_point: [slug-3]
  goal: [slug-4]
  feature: [related-feature-slug]
assets:
  - id: {uuid-or-stable-id}
    type: wireframe | mockup | diagram | screenshot | reference
    title: {Human-readable title}
    description: {Short description}
    path: assets/{feature-slug}/{filename}
---
```

| Field    | Type     | Required | Description                                              |
|----------|----------|----------|----------------------------------------------------------|
| `links`  | object   | No       | Cross-references; see §9.                                |
| `assets` | object[] | No       | Asset metadata; see §11.                                 |

> **Note:** v1 intentionally does not define a `status` field for features. Capturing spec maturity and implementation state in a structured way is deferred — see §10 and §15.

### 7.3 Body contract

A feature body MUST contain:
- An H1 heading matching the feature title
- An opening summary paragraph (see §7.4)

The body MAY contain free-form markdown content: prose, H2/H3 headings, lists, code, and inline spec items (see §8). Spec items are recognized by their syntax, not by their containing section.

**Canonical section names.** LiveSpec defines a set of canonical H2 section names whose semantics are universally understood:

| Section                   | Intended contents                                                            |
|---------------------------|------------------------------------------------------------------------------|
| `## Requirements`         | `REQ` items (with nested `AC` items)                                         |
| `## Assumptions`          | `AS` items                                                                   |
| `## Open Questions`       | `OQ` items                                                                   |
| `## Known Issues`         | `KI` items                                                                   |
| `## UX`                   | Free-form UX notes (and future `UX_DIRECTION` items, §15 #005)               |
| `## Tech`                 | Free-form technical notes (and future `TECH_DIRECTION` items, §15 #005)      |

> **Ephemeral implementation context** — decisions in progress, handoff state, "I'm here, next step is X" — belongs in git commits, PR descriptions, or external task trackers, not in the spec. This follows from the core principle (§1): LiveSpec describes the software, not the work on it. Durable architectural decisions go to `## Tech` or to an `architecture_decision` concept.

**Behavior by mode** (see §12):

- **Loose mode (default):** Writers SHOULD use canonical section names where applicable, but MAY use any H2 name. Spec items are identified by their inline syntax wherever they appear. Tools MUST preserve unrecognized sections on write (losslessness).
- **Strict mode:** H2 section names MUST be drawn from the canonical set above. Each spec item type MUST appear only in its intended section (e.g. a `KI` item inside `## Requirements` is a lint error). Section ordering MUST follow the canonical order: Requirements → Assumptions → Open Questions → Known Issues → UX → Tech.

**Empty sections:** H2 sections with no content SHOULD be omitted rather than left empty. A missing section is the canonical way to say "nothing here."

**Section content:** Within any section (canonical or otherwise), free-form prose, H3 sub-headings, and inline spec items can intermix freely. H3 sub-headings are visual organizers and carry no semantic meaning for the parser. AC nesting (§8) is determined by markdown list indentation, not by section structure.

### 7.4 Opening paragraph conventions

Every feature MUST begin with a single opening paragraph that summarizes the feature in human terms. Its **presence** is required; its **form** is the author's choice. Tools display this paragraph in lists and link previews.

The user-story format remains the recommended idiom for user-facing features, but it is one form among several. Common idiomatic openings:

- **User-facing** — `As a {role}, I want {capability} so that {value}.`
- **System / integration** — `When {trigger}, the system {action} so that {outcome}.`
- **Data / migration / infrastructure** — a plain declarative sentence describing the target state, e.g. *"The search index moves from Postgres full-text to Meilisearch, with parity on query semantics and a sub-200ms p95 latency."*

These are not a closed taxonomy and v1 does not enforce a specific signature. The intent is to normalize the fact that **several legitimate forms exist**, so authors aren't tempted to contort a system feature into an `As a {role}` template that doesn't fit. A future RFC may promote one or more of these into a structured frontmatter field if a clear need emerges.

---

## 8. Spec Items

Spec items are atomic, addressable units inside a feature: requirements, acceptance criteria, assumptions, open questions, bugs, and design directions.

### 8.1 Inline syntax

Spec items appear as GitHub-flavored checkbox list items:

```markdown
- [x] REQ-1: User can sign in with email and password
  - [x] AC-1.1: Email field accepts standard RFC 5322 addresses
  - [ ] AC-1.2 [edge-case]: Whitespace-only input is rejected with inline error
  - [-] AC-1.3: Network failure retry banner — dropped in favor of generic toast
- [ ] REQ-2 [auth]: Failed login shows error message
  - [ ] AC-2.1: Error appears within 200ms of submit
```

(The example above shows categories used sparingly and with free-form labels — v1 imposes no vocabulary, see §8.3.)

| Field        | Format                                                       | Required |
|--------------|--------------------------------------------------------------|----------|
| Indent       | 0 spaces (REQ/AS/OQ/KI), 2 spaces (AC under its parent REQ)  | Yes      |
| Checkbox     | `- [ ]`, `- [x]`, or `- [-]` (see "Checkbox states" below)   | Yes      |
| Type prefix  | `REQ`, `AC`, `AS`, `OQ`, `KI`                                | Yes      |
| ID           | See §8.4                                                     | Yes      |
| Category     | `[category-name]` after the ID                               | No       |
| Body         | After `:` (may span multiple lines, see below)               | Yes      |

#### Checkbox states

| Token  | Generic meaning            | Per-type interpretation                                                    |
|--------|----------------------------|----------------------------------------------------------------------------|
| `[ ]`  | Open / pending             | REQ/AC: not yet done. AS: not yet validated. OQ: unanswered. KI: unresolved.  |
| `[x]`  | Done / closed              | REQ/AC: implemented. AS: validated / confirmed. OQ: answered. KI: resolved.   |
| `[-]`  | Cancelled / won't do       | Explicitly decided not to pursue. Body SHOULD state the reason.             |

The `[-]` state preserves the historical record of a dropped item without removing it (which would lose decision context) or falsely checking it. GitHub renders `[-]` with strikethrough.

#### Multi-line bodies

A spec item body MAY span multiple lines via standard markdown list-item continuation — text indented under the item, before any nested children:

```markdown
- [ ] REQ-3: User can export their data as CSV.
  The export includes all fields visible in the UI, plus internal
  IDs. Computed fields are flattened to their displayed string form.
  - [ ] AC-3.1: Export button visible in user menu
```

#### Inline formatting

Bodies MAY contain **inline** markdown formatting: `**bold**`, `*italic*`, `` `code` ``, `[link](url)`, etc.

Bodies MUST NOT contain **block-level** constructs (headings, fenced code blocks, tables, blockquotes). If a requirement needs that level of elaboration, the prose belongs in `## Tech` or `## UX` notes, with the REQ referencing it by name.

#### Nesting depth

ACs MUST be nested exactly **one indentation level** (2 spaces) below their parent REQ. Deeper nesting is invalid:

```markdown
- [ ] REQ-1: ...
  - [ ] AC-1.1: ...      ← valid
    - [ ] AC-1.1.1: ...  ← INVALID; split into multiple REQs instead
```

If a REQ would naturally produce sub-structure, decompose it into multiple REQs rather than introducing AC sub-trees. This keeps the parsing model simple and the document scannable.

#### Visual spacing

Writers SHOULD insert a blank line between top-level spec items when a section contains more than three of them, to improve scannability. The blank line is semantically meaningless to LiveSpec parsers — both tight and loose markdown lists are valid.

#### Inline references to other spec items

Within a spec item body, references to other spec items use bracketed-ID syntax:

| Reference target               | Syntax                          |
|--------------------------------|---------------------------------|
| Same-feature spec item         | `[REQ-3]`, `[AC-3.2]`, `[OQ-1]` |
| Spec item in another feature   | `[feature-slug#REQ-3]`          |

Example:

```markdown
- [ ] OQ-1: Does [REQ-3] need pagination when the result list exceeds 100 entries?
- [ ] KI-2: [AC-2.1] currently fails on Safari 16 (works on Chrome and Firefox).
```

Tools MAY render these as navigable links and use them to build a reverse-reference index ("where is REQ-3 referenced?").

### 8.2 Spec item types

| Type  | Name                  | Position                            | Purpose                                              |
|-------|-----------------------|-------------------------------------|------------------------------------------------------|
| `REQ` | Requirement           | Top-level in `## Requirements`      | Functional/behavioral requirement of the feature.    |
| `AC`  | Acceptance Criterion  | Nested under a REQ (2-space indent) | Specific testable condition for its parent REQ.      |
| `AS`  | Assumption            | Top-level in `## Assumptions`       | Assumption the spec relies on; flag if invalidated.  |
| `OQ`  | Open Question         | Top-level in `## Open Questions`    | Unresolved question that blocks or shapes the spec.  |
| `KI`  | Known Issue           | Top-level in `## Known Issues`      | Known issue, defect, or limitation affecting this feature. |

**AC linkage.** An AC's parent REQ is determined **structurally** by markdown list nesting — no explicit reference is needed. An AC that is not nested under a REQ is a lint error.

**REQ done semantics.** A REQ marked `[x]` while one or more of its ACs are still `[ ]` is permitted but SHOULD trigger a lint warning. Teams may legitimately consider a REQ "done enough" when non-critical ACs remain open, but the discrepancy is worth surfacing. ACs in the `[-]` (cancelled) state do not contribute to this warning.

> **Future:** `UX_DIRECTION` and `TECH_DIRECTION` will be formalized as block-level (not inline) spec items. See §15 #005.

### 8.3 Categories

Spec items MAY carry a single bracketed category tag immediately after the ID, for example:

```markdown
- [ ] REQ-3 [billing]: ...
- [ ] AC-3.1 [edge-case]: ...
```

**Categories are entirely OPTIONAL.** A spec item with no category is fully conformant — it is the default state. Writers SHOULD NOT add a category just to fill the slot.

**v1 defines no controlled vocabulary.** Any kebab-case label is accepted. The choice is deliberate: industry-standard requirement taxonomies (FURPS+, ISO 25010, and similar) have fuzzy boundaries that, when enforced, produce bikeshedding and default-value reflexes more than they produce signal. v1 lets each team converge on labels that are useful in their own context; emerging practice will inform a better-grounded standard in a future version.

**Omission carries signal.** If no label clearly clarifies an item, OMIT it. An omitted category is more informative than a default-filled one: it preserves the option of clarifying later, whereas a wrong-but-plausible tag freezes the wrong information. Tools MUST NOT auto-assign categories on write.

> **Future:** A future minor version may (a) introduce a default vocabulary for REQ and/or AC categories, and/or (b) let projects declare their own vocabulary in `livespec.yaml`. Any such change will be additive — projects that used no categories in v1 will remain conformant. See §15 #016.

### 8.4 Identifiers

**REQ / AS / OQ / KI IDs** use the form `{TYPE}-{N}` where `N` is a positive integer, scoped to its parent H2 section. Example: `REQ-1`, `REQ-2`, `AS-1`, `OQ-1`, `KI-1`.

**AC IDs** use the form `AC-{parent_req_index}.{ac_index}` reflecting structural nesting:

```markdown
- [x] REQ-1: ...
  - [x] AC-1.1: ...
  - [x] AC-1.2: ...
- [x] REQ-2: ...
  - [x] AC-2.1: ...
```

**IDs are file-scoped and human-assigned.** `REQ-1` in feature A is unrelated to `REQ-1` in feature B. Cross-feature references use the form `{feature-slug}#REQ-3` or `{feature-slug}#AC-3.2`.

#### Immutability

Once assigned, an ID MUST never be reused or renumbered, even if its spec item is deleted or cancelled. This guarantee is what makes inline references (`[REQ-3]`) and cross-feature references (`{slug}#REQ-3`) reliable. Tools that mutate LiveSpec files MUST preserve existing IDs and MUST assign new IDs only by extending the sequence.

To remove a spec item without breaking inbound references, mark it `[-]` (cancelled) rather than deleting it.

**Bodies are mutable; IDs are not.** A spec item's body MAY evolve freely over time — typo fixes, clarifications, scope adjustments — while keeping the same ID. Tracking the substantive history of a body change (e.g. "this AC originally said X, now says Y") is **out of scope for v1**: the canonical history is `git`. See §15 #019.

#### Gaps are valid

Gaps in numbering are conformant. A file containing `REQ-1, REQ-3, REQ-7` is valid — it simply means earlier IDs were assigned and later removed (or the sequence was never contiguous). Tools MUST NOT reject gapped numbering, MUST NOT renumber to close gaps, and MUST NOT require IDs to appear in numeric order within the file.

> **Known limitation:** Manual numbering can still produce merge conflicts when two parallel changes assign the same next integer. Resolution is mechanical (the second-merged change takes the next free integer) but currently manual. Opaque IDs (e.g. `REQ-7f3a`) as an alternative scheme are under consideration for a future RFC. See §15.

---

## 9. Linking System

### 9.1 Slug rules

All entities are identified by a **slug**: the filename without the `.md` extension.

- Slugs MUST match the regex `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case ASCII).
- Slugs MUST be unique within their type's directory.
- Slugs SHOULD be stable; renaming a file is a breaking change for inbound links.

### 9.2 Link resolution

Links appear in frontmatter under the `links` field, keyed by **target type slug** (always singular):

```yaml
links:
  persona: [the-product-engineer]
  pain_point: [decisions-get-lost, context-gap-for-ai-coding-tools]
  feature: [feature-context-linking]
```

Resolution algorithm:
1. The key (e.g. `persona`) is the type slug.
2. For concept types, the file is resolved to `{product|ux|tech}/{key}/{slug}.md` — the resolver determines the containing top-level directory by looking up the type in the core taxonomy (§6.2) or in registered extensions.
3. For the special key `feature`, the file is resolved to `features/**/{slug}.md` (searched across feature areas; slugs are globally unique within `features/`).
4. A link to a non-existent file is a **lint warning**, not a parse error (see §14).

### 9.3 Bidirectional links

Links are unidirectional in the file format but SHOULD be presented bidirectionally by tools. Tools MAY maintain an index for reverse lookup. The source of truth is always the forward link in the writing entity.

### 9.4 Spec ↔ Code Linking

A LiveSpec project describes software that exists (or is being built) in a codebase. To make that relationship explicit and machine-discoverable — without locking the format to a specific verification workflow — v1 defines a single convention: an inline marker placed in source files, pointing back to a spec item.

#### Marker format

```
livespec: {feature-area}/{feature-slug}#{spec-item-id}
```

The marker MUST appear inside a comment using the host language's native comment syntax. The format defines the **payload**, not the comment delimiter:

```js
// livespec: search/full-text-search#REQ-3
```
```python
# livespec: search/full-text-search#AC-1.2
```
```html
<!-- livespec: checkout/idempotency#REQ-1 -->
```

A source file MAY carry zero, one, or many markers. A marker pointing to a `REQ` implicitly covers its nested `AC`s unless more specific AC-level markers exist elsewhere.

The payload grammar is `livespec:` followed by one or more spaces, then `{feature-area}/{feature-slug}#{spec-item-id}` with no internal whitespace. Tools MUST match case-sensitively.

#### Resolution

A `livespec:` marker resolves by:
1. Locating the feature file at `features/{feature-area}/{feature-slug}.md`.
2. Finding the spec item with the matching ID inside that file (per §8.4).

A marker whose feature file is missing, or whose spec item ID does not exist, is a **broken link**. Tools SHOULD report it as a lint warning at Level 3+.

#### Scope of this section — what v1 does and does not define

LiveSpec v1 defines **the syntax of the link, and only the syntax**. The format does NOT define:

- **Coverage rules** — which spec items must carry a marker, or how many markers a spec item should have.
- **Drift detection** — what to do when code changes without spec changes, or vice-versa.
- **Verification semantics** — running the marked code as a test of the spec item, computing coverage reports, blocking merges on missing markers, or invoking agents to re-validate conformance.

These are **tooling concerns**, not format concerns. A CI hook, an IDE plugin, or an agent-driven verifier MAY implement any of them on top of the marker syntax; doing so is out of scope for the format itself. Standardizing any subset of these semantics is tracked in §15 #014.

The format guarantees one thing: **if a `livespec:` marker is present in source code, any conformant LiveSpec tool will recognize it and resolve it to a spec item**. That minimum is what makes spec↔code linking interoperable across tools and workflows.

---

## 10. Status Lifecycle

**Deferred to a future version.** v1 does not define a structured status for features. Earlier drafts proposed a single `status` enum (`idea | specified | implemented`), but it conflated two orthogonal axes — *spec maturity* (is the intent captured and validated?) and *implementation state* (does the code exist?) — and crowded into project-management territory that LiveSpec deliberately stays out of (§1).

Until a future RFC settles the model:

- Features MUST NOT carry a `status` field in their frontmatter.
- Teams that need to express workflow state SHOULD use external tooling (issue tracker, project board) and MAY reference it from the feature via tool-specific `x-*` extensions.
- The progress of work *inside* a feature is expressed by the checkbox states of its spec items (§8.1).

See §15 #015 for the design question being deferred.

---

## 11. Assets

Assets (images, wireframes, diagrams) are stored on disk and referenced from the feature's frontmatter.

### 11.1 Storage layout

```
features/{area}/
├── {feature-slug}.md
└── assets/{feature-slug}/
    ├── wireframe.svg
    └── flow-diagram.png
```

Each feature's assets live in its own subdirectory under `assets/{feature-slug}/`. Asset files MAY be any media format.

### 11.2 Frontmatter declaration

Each asset MUST be declared in the feature's frontmatter:

```yaml
assets:
  - id: 019c5325-d453-760e-a970-396b261743b2
    type: wireframe
    title: Sign-in flow wireframe
    description: First draft of the sign-in modal interaction
    path: assets/sign-in/wireframe.svg
```

| Field         | Type   | Required | Description                                        |
|---------------|--------|----------|----------------------------------------------------|
| `id`          | string | Yes      | Stable identifier (UUID recommended).              |
| `type`        | enum   | Yes      | `wireframe`, `mockup`, `diagram`, `screenshot`, `reference` |
| `title`       | string | Yes      | Human-readable title.                              |
| `description` | string | No       | Short description for accessibility and search.    |
| `path`        | string | Yes      | Project-root-relative path to the asset file.      |

> **Future:** External asset URLs (Figma, Loom, Miro) are not in v1. See §15.

---

## 12. Modes

LiveSpec defines two modes of operation, declared by the `mode` field in `livespec.yaml` (see §4). The mode tightens (or relaxes) a set of conformance rules applied by linters and writers without changing the underlying grammar.

### 12.1 `loose` (default)

The default mode, optimized for individual contributors, small teams, and projects in active discovery. Designed to feel frictionless to newcomers.

- H2 section names MAY be anything; canonical names (Requirements, Assumptions, Open Questions, Known Issues, UX, Tech) are RECOMMENDED but not enforced.
- Spec items are identified by their inline syntax wherever they appear. A `KI` item inside `## Requirements` is permitted (lint warning at most).
- User story format (§7.4) is SHOULD.
- Spec item categories are OPTIONAL.
- Section ordering is unconstrained.
- Tools MUST preserve unrecognized H2 sections and their content on write (losslessness).

### 12.2 `strict`

Optimized for larger teams, enterprise contexts, and regulated environments where predictability and audit-readiness matter more than authoring flexibility. Strict mode is a **superset** of loose mode: every strict file is also a valid loose file, but not the inverse.

In strict mode, the following rules are upgraded:

| Rule                                                     | Loose      | Strict     |
|----------------------------------------------------------|------------|------------|
| H2 section names limited to canonical set                | SHOULD     | **MUST**   |
| Spec item type must match its containing section's type  | SHOULD     | **MUST**   |
| Section ordering follows canonical order                 | MAY        | **MUST**   |
| Every REQ has at least one AC                            | MAY        | **SHOULD** (warning) |

**Design rule.** Strict-mode rules MUST be *mechanical*: a writer or linter can decide compliance without judgment. Rules that require the author to interpret meaning (e.g. choosing the "right" category for a REQ) MUST NOT be promoted to MUST in strict mode — they generate bikeshedding and degrade to default-value reflexes, losing the signal they were meant to capture. Spec item categories (§8.3) are deliberately excluded from strict enforcement for this reason.

### 12.3 Compatibility

Loose and strict are not separate dialects. A strict-mode project is always readable by a loose-mode reader (and vice-versa for read-only operations). The mode only affects **what tools enforce on write**.

A project MAY change mode over its lifetime (e.g. starting in loose, migrating to strict as the team matures). Tools migrating a project to strict mode SHOULD report all violations as a single batch rather than refusing the migration.

---

## 13. Format Versioning

LiveSpec follows semantic versioning at the format level:

- **Major** (`2.0.0`) — breaking changes to file structure, frontmatter shape, or required fields.
- **Minor** (`1.1.0`) — additive: new optional fields, new entity types, new spec item types.
- **Patch** (`1.0.1`) — clarifications, typo fixes, no semantic change.

The `format_version` field in `livespec.yaml` declares the version a project targets. Tools MUST refuse to write files in a version they don't support and SHOULD warn (not refuse) when reading a newer minor version.

---

## 14. Conformance Levels

Tools claim conformance at one of three levels:

### Level 1 — Reader
- MUST parse all required frontmatter fields without error
- MUST preserve unknown fields on read
- MAY ignore unknown spec item types

### Level 2 — Writer
- All Level 1 requirements
- MUST preserve unknown frontmatter fields on write (round-trip safety)
- MUST emit valid markdown that other Level 1 tools can re-read
- MUST validate against the canonical JSON schemas
- MUST recognize the core concept taxonomy (§6.2) — type slugs, their canonical containing directories, and link resolution
- MUST recognize `livespec:` code markers (§9.4) when scanning source files and resolve them to spec items

### Level 3 — Linter
- All Level 2 requirements
- MUST emit diagnostics for: broken links, invalid slugs, duplicate IDs, missing required fields, unknown spec item types, malformed checkboxes
- MUST emit diagnostics for broken `livespec:` code markers (feature file or spec item ID does not exist)

A conformance test suite is published alongside this spec (TBD — see §15 #001).

---

## 15. Open Questions (RFC Candidates)

These are known limitations or undecided design points. Each will be addressed in a numbered RFC before v2.

| #   | Topic                                                                                          |
|-----|------------------------------------------------------------------------------------------------|
| 001 | Conformance test suite — fixtures and validation tooling                                       |
| 002 | Concept extension mechanism — how third parties register new types                             |
| 003 | Spec-item ID strategy — opaque IDs vs positional vs current human IDs                          |
| 004 | Bidirectional AC ↔ REQ linking — formal frontmatter or inline?                                 |
| 005 | UX_DIRECTION and TECH_DIRECTION as first-class block spec items                                |
| 006 | External assets — Figma, Loom, Miro URL support                                                |
| 007 | i18n — multilingual specs, translatable section names                                          |
| 008 | Deprecation lifecycle — `deprecated` status, archival conventions                              |
| 009 | Deeper feature-area nesting (>1 level)                                                         |
| 010 | Cross-project links — referencing entities in other LiveSpec repos                             |
| 011 | Slug-aliasing for safe renames                                                                 |
| 012 | Decision records — should ADRs be a first-class entity kind?                                   |
| 013 | Presets and manifest inheritance (`presets`, `extends`) — packaging shared types and config    |
| 014 | Spec ↔ code verification semantics — standardizing coverage rules, drift detection, and agent-driven re-validation on top of the §9.4 marker syntax |
| 015 | Feature status — structured representation of spec maturity vs implementation state, if any     |
| 016 | Category vocabularies — should v2 introduce defaults (REQ / AC), per-project configurability via `livespec.yaml`, or both? |
| 017 | Compiled artifacts — should LiveSpec standardize how tools generate aggregated views (per-type aggregations, AI-consumption bundles), or leave this entirely to tools? |
| 018 | Typed feature-to-feature relations — currently `feature:` links are untyped; should v2 introduce typed relations (`requires`, `extends`, `replaces`, `supersedes`)? Strictly software relationships only — scheduling/blocking is excluded by §1 |
| 019 | Spec item body change tracking — should LiveSpec define a substantive-vs-editorial diff convention for spec item bodies, beyond what `git` provides? |

---

## Appendix A — Minimal Example

A complete minimal LiveSpec project:

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

**`livespec.yaml`**
```yaml
format_version: "1.0"
name: My App
```

**`product/persona/power-user.md`**
```markdown
---
tags: [primary]
---

# Power User

Heavy daily user who knows the product deeply and pushes its edges.
```

**`features/search/full-text-search.md`**
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
  - [ ] AC-1.2: Search remains accessible on mobile via icon-only collapsed mode
- [ ] REQ-2: Results returned within 300ms for queries under 50 chars
  - [ ] AC-2.1: P95 latency under 300ms measured against 10k-document corpus
  - [ ] AC-2.2: Query timeout shows fallback message after 2s
- [ ] REQ-3: Index updated within 5s of document creation

## Assumptions

- [ ] AS-1: Document corpus stays under 1M entries for v1 — re-evaluate indexing strategy beyond that.

## Open Questions

- [ ] OQ-1: Do we need search history per user, or is recent-results enough?

## UX

Search input uses inline autocomplete. Results show in a dropdown panel with keyboard navigation.

## Tech

Use PostgreSQL full-text search (tsvector) for v1. Reconsider with Meilisearch if latency budget is exceeded.
```

---

*This document is itself a living spec. See `rfcs/` for proposals in progress.*
