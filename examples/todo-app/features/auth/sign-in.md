---
links:
  persona: [solo-organizer, team-coordinator]
  entity: [user]
---

# Sign In

As a person with an account, I want to sign in with my email so that I can access my lists and todos on any device.

## Requirements

- [ ] REQ-1: User signs in by entering an email address and a one-time code sent to that email.
  - [ ] AC-1.1: The sign-in form accepts any RFC 5322 email address.
  - [ ] AC-1.2: A six-digit code is delivered to the entered email within 30 seconds at the p95.
  - [ ] AC-1.3: The code expires 10 minutes after it is issued; using an expired code shows an inline error.
  - [ ] AC-1.4: After three consecutive failed code entries within five minutes, the account is rate-limited for ten minutes.
- [ ] REQ-2: A successful sign-in establishes a session that persists across app launches on the same device.
  - [ ] AC-2.1: The session cookie is set with `Secure` and `HttpOnly` flags.
  - [ ] AC-2.2: A session is valid for 90 days from last use; idle sessions beyond that require re-authentication.
- [ ] REQ-3: A user can sign out, which invalidates the current session on the current device only.

## Assumptions

- [ ] AS-1: Users have reliable access to their email — i.e. we do not need to support SMS or authenticator-app fallback in v1.

## Questions

- [ ] Q-1: Do we need to support social sign-in (Google, Apple) at launch, or is email-only acceptable for the first release?
