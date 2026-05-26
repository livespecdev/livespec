---
links:
  entity: [todo, user]
  external_system: [push-notification-provider]
---

# Reminder

A scheduled notification associated with a due todo. Internal to the system; users never create reminders directly — they emerge from todos with a due date.

## Identity

A reminder is identified by an opaque ID. It is scoped to one todo and one user.

## Notable attributes

- **Todo** — the [[todo]] this reminder is for.
- **Recipient** — the [[user]] who will be notified. On a shared list with an assignee, the assignee; otherwise, the todo's owner.
- **Fire-at** — the absolute timestamp at which the reminder should fire.
- **Channel** — push, email, or both, derived from the recipient's notification preferences.
- **State** — pending, fired, or cancelled.

## Invariants

- A reminder is cancelled when its underlying todo is marked done, archived, or has its due date cleared.
- Recurring todos schedule the *next* reminder when the current one fires, not at creation time — to avoid drift if the user reschedules the todo.
