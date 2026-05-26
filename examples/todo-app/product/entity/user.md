---
links:
  entity: [list]
---

# User

A person with an account in the app. Owns lists and todos; may be a collaborator on others' lists.

## Identity

A user is identified by an opaque ID. Their email address is unique at any given time but MAY be changed.

## Notable attributes

- **Email** — used for authentication and for sharing invitations.
- **Display name** — shown to collaborators on shared lists.
- **Default list** — the "Inbox" [[list]] assigned at signup, used as the destination for quick-capture todos.
- **Notification preferences** — opt-in flags per channel.

## Invariants

- A user always has a default list. Deleting it is impossible; renaming is permitted.
- A user's display name is what other collaborators see — the email is never exposed on a shared list.
