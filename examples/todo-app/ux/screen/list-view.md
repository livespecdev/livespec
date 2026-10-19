---
tags: [authenticated]
links:
  entity: [list, todo]
  screen: [todo-detail]
---

# List View

The main working surface of the app (`/lists/[listId]`): one list, its todos, and the quick-add field that captures a new todo without leaving the page.

## Route and access

- Route: `/lists/[listId]`. The bare `/` redirects to the user's Inbox list.
- Access: signed-in owner or collaborator of the list. Anyone else gets a 404 rather than a 403 (per [Todos Are Private by Default](../../product/principle/todos-are-private-by-default.md), the existence of a list is itself private).

## Regions

1. **List header** — list name (editable in place), collaborator avatars, overflow menu.
2. **Quick add** — single-line input pinned under the header; submitting keeps focus for the next capture.
3. **Todo rows** — checkbox, title, due date, recurrence indicator. Ordered newest first.
4. **Completed section** — collapsed by default, expandable at the bottom.

## States

- **Empty** — no todos yet: the quick-add field is auto-focused and the row area shows a one-line hint.
- **At capacity** — the list has reached its [maximum size](../../product/constraint/max-list-size.md): quick add is disabled with an inline explanation.
- **Offline** — new todos are queued locally and rendered with a pending marker until the write confirms.

## Navigation

- Inbound: sign-in, the list switcher in the sidebar.
- Outbound: [Todo Detail](todo-detail.md) when a row is opened.
