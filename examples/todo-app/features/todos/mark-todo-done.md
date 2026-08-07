---
links:
  persona: [solo-organizer, team-coordinator]
  goal: [stay-on-top-of-personal-tasks, coordinate-team-work]
  entity: [todo, reminder]
  screen: [list-view, todo-detail]
  feature:
    requires: [sign-in]
---

# Mark Todo Done

As a user, I want to mark a todo as done with one tap so that closing a task feels as fast as creating one.

## Requirements

- [ ] REQ-1: A signed-in user can mark any todo they can see as done with a single interaction.
  - [ ] AC-1.1: The toggle is reversible — tapping a done todo re-opens it.
  - [ ] AC-1.2: The action takes effect locally without waiting for a server round-trip.
- [ ] REQ-2: Marking a todo done cancels any pending reminder for it.
- [ ] REQ-3: Marking a recurring todo done schedules its next occurrence.
  - [ ] AC-3.1: The next occurrence inherits all attributes (title, recurrence rule, list) of the original.
  - [ ] AC-3.2: The original occurrence is moved to archived state, preserving the history.

## Issues

- [ ] ISS-1: On shared lists, two collaborators marking the same todo done within seconds occasionally produces two completion events. The data layer is idempotent so the user-visible state is correct, but completion-count metrics are temporarily inflated.
