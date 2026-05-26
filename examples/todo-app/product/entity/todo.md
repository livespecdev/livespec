---
links:
  entity: [list, user]
  constraint: [max-list-size]
---

# Todo

A single thing the user wants to remember to do. The atomic unit of the product.

## Identity

A todo is identified by an opaque ID. Its title alone is not unique — two todos with the same title are two distinct todos.

## Notable attributes

- **Title** — short human description; required.
- **Due date** — optional. When set, the todo participates in reminders.
- **Recurrence rule** — optional. When set, completing the todo schedules its next occurrence.
- **List membership** — every todo belongs to exactly one [[list]].
- **Owner** — the [[user]] who created the todo. Distinct from "assignee" on shared lists.
- **Completion state** — open, done, or archived.

## Invariants

- A todo always belongs to a list, never to a user directly.
- A todo's owner does not change, even when its list is shared or transferred.
- A todo's completion state can transition open → done, done → open (un-check), and either → archived. Archived is terminal.
