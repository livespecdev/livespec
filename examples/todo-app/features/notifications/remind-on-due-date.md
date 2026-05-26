---
links:
  entity: [todo, reminder, user]
  external_system: [push-notification-provider]
---

# Remind on Due Date

When a [[todo]]'s due time arrives, the system delivers a push notification to its recipient (modeled as a [[reminder]]) so that the user is prompted to act without having to open the app. Delivery goes through [[push-notification-provider]].

## Requirements

- [ ] REQ-1: A pending reminder fires within ±60 seconds of its scheduled time.
  - [ ] AC-1.1: P95 fire-time accuracy is within 30 seconds of the scheduled time, measured across all reminders in a 24-hour window.
  - [ ] AC-1.2: If the push provider is unavailable, the reminder is retried up to three times with exponential backoff, then dropped silently.
- [ ] REQ-2: A reminder includes the todo's title and a deep link that opens the todo in-app.
- [ ] REQ-3: Reminders respect the recipient's notification preferences.
  - [ ] AC-3.1: A user who has disabled push notifications receives no reminder, even if a todo's due time arrives.
  - [ ] AC-3.2: Email-only recipients receive an email at the scheduled time instead of a push.
- [ ] REQ-4: A reminder is cancelled when its underlying todo is marked done, archived, or has its due date cleared (already captured in the Reminder entity invariants).

## Assumptions

- [ ] AS-1: Users tolerate "best-effort" delivery — i.e. a missed reminder is regrettable but not a defect when caused by OS-level push suppression or device offline state.
