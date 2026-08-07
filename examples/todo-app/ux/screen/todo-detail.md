---
tags: [authenticated]
links:
  entity: [todo, reminder]
  screen: [list-view]
---

# Todo Detail

The full view of a single todo (`/lists/[listId]/todos/[todoId]`), where the fields the quick-add field cannot hold (notes, recurrence rule, reminder) are edited.

## Route and access

- Route: `/lists/[listId]/todos/[todoId]`. Opened as a panel beside [[screen:list-view]] on wide viewports, as a full page below 768px.
- Access: same rule as the containing list.

## Regions

1. **Title and completion state**.
2. **Scheduling** — due date, recurrence rule, resulting [[entity:reminder]] preview.
3. **Notes** — free-text body.
4. **Activity** — who created the todo and who completed it, for shared lists.

## States

- **Deleted while open** — the panel is replaced by a dismissable notice; the underlying list stays usable.
- **Conflicting edit** — a collaborator's change lands during editing: the incoming value is shown alongside the local one rather than overwriting it (see [[architecture_decision:eventual-consistency-for-shares]]).

## Navigation

- Inbound: a row on [[screen:list-view]], a reminder notification.
- Outbound: closing returns to [[screen:list-view]].
