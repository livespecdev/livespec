---
links:
  persona: [team-coordinator]
  pain_point: [coordinating-on-shared-work]
  goal: [coordinate-team-work]
  entity: [list, user]
  principle: [todos-are-private-by-default]
  feature:
    requires: [sign-in]
---

# Share List with User

As a team coordinator, I want to invite collaborators to a [[list]] by email so that we can work from a shared source of truth without duplicating tasks elsewhere. Sharing remains opt-in on both sides, in line with [[todos-are-private-by-default]].

## Requirements

- [ ] REQ-1: A list owner can invite another user to a list by email address.
  - [ ] AC-1.1: The invitee receives an email with a link that, when followed, prompts sign-in (if needed) and joins the list.
  - [ ] AC-1.2: Invites expire after 14 days unaccepted; expired invites can be re-issued.
  - [ ] AC-1.3: An invite to an email already linked to an existing account adds the collaborator immediately — no email link required if the invitee is already signed in on the same browser session.
- [ ] REQ-2: Sharing is opt-in on both sides — an invite is never auto-accepted.
- [ ] REQ-3: A list owner can revoke a collaborator's access at any time.
  - [ ] AC-3.1: Revocation takes effect within five seconds across the collaborator's active devices.
  - [ ] AC-3.2: A revoked collaborator no longer sees the list; todos they authored remain in the list, attributed to them.
- [ ] REQ-4: A collaborator can leave a shared list at any time, with the same data semantics as REQ-3.

## Assumptions

- [ ] AS-1: A list has at most ~10 collaborators in practice — we do not optimize for hundred-collaborator lists in v1.

## Questions

- [ ] Q-1: Should a shared list show the *email* of pending invitees to the owner, or only the display name once they accept? Current draft: email until acceptance, display name after.
