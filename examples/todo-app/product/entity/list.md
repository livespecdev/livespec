---
links:
  entity: [todo, user]
  constraint: [max-list-size]
  principle: [todos-are-private-by-default]
---

# List

A named collection of todos. The unit of organization and the unit of sharing.

## Identity

A list is identified by an opaque ID. Its name is mutable and not unique across users.

## Notable attributes

- **Name** — human-readable title.
- **Owner** — the [user](user.md) who created the list. Owners can delete the list; collaborators cannot.
- **Collaborators** — zero or more [users](user.md) who have been granted access.
- **Visibility** — derived from collaborators: a list with zero collaborators is *private*; with one or more, *shared*.

## Invariants

- Every user has at least one list ("Inbox") that cannot be deleted.
- A list cannot exceed 500 active todos (see [Max List Size](../constraint/max-list-size.md)).
- A list owner cannot demote themselves to collaborator without first transferring ownership.
