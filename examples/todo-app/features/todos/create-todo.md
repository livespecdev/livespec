---
links:
  persona: [solo-organizer, team-coordinator]
  pain_point: [forgetting-recurring-tasks]
  goal: [stay-on-top-of-personal-tasks]
  entity: [todo, list, reminder]
  constraint: [max-list-size]
  feature:
    requires: [sign-in]
    triggers: [remind-on-due-date]
---

# Create Todo

As a user, I want to capture a new todo in seconds so that nothing slips out of my head before I can write it down.

## Requirements

- [ ] REQ-1: A signed-in user can create a todo by entering a title and (optionally) a due date.
  - [ ] AC-1.1: The title field is required and limited to 280 characters.
  - [ ] AC-1.2: If no list is chosen, the todo is placed in the user's default Inbox list.
  - [ ] AC-1.3: The new todo appears at the top of its list within 200ms on the originating device.
- [ ] REQ-2: A user can set a recurrence rule (daily, weekly, monthly, custom interval) at creation time.
  - [ ] AC-2.1: A todo with a recurrence rule MUST also have a due date — the recurrence anchors on it.
  - [ ] AC-2.2: A recurrence interval below 1 day is not supported in v1.
- [ ] REQ-3: A todo with a due date schedules a reminder for its recipient.
  - [ ] AC-3.1: The reminder fires at the due timestamp ±60 seconds.
  - [ ] AC-3.2: If the due date is in the past at creation time, no reminder is scheduled; the todo is created normally.
- [ ] REQ-4: Creating a todo on a list at its size cap is rejected with a clear error.
  - [ ] AC-4.1: The error message names the cap and suggests archiving completed todos to make room.

## Assumptions

- [ ] AS-1: Users accept that recurring reminders fire on the same device-local time across timezone changes — i.e. travelling does not shift "8am daily" to a new wall-clock time.
