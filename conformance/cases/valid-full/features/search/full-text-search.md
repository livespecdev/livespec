---
links:
  persona: [the-product-engineer]
  pain_point: [decisions-get-lost]
  feature:
    requires: [sign-in]
---

# Full-text Search

As [[persona:the-product-engineer]], I want to search across all my documents so that I can find content without remembering where I put it.

## Requirements

- [ ] REQ-1: User can run a full-text query across all documents
  - [x] AC-1.1: Results return within 200ms p95
  - [ ] AC-1.2: Whitespace-only input is rejected with inline error
- [ ] REQ-3: Results are ranked by relevance
  - [ ] AC-3.1: Exact title matches rank above body matches

## Assumptions

- [ ] AS-1: The document corpus fits in the search index memory budget

## Questions

- [x] Q-1: Does the export need pagination beyond 100 results?
  → Yes, paginate by 50 with an opaque cursor.

## Issues

- [-] ISS-1: Highlighting dropped on the first release.
  → Deferred to a follow-up; not worth blocking launch.
