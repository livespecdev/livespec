# Eventual Consistency for Shared Lists

Updates to a shared list (new todo, completion, archive) are durably applied locally first, then propagated to collaborators asynchronously. The system does NOT serialize writes through a single authority.

## Why

The collaboration patterns we observe — small groups, a few writers per list per day, no high-stakes ordering — do not justify the latency and complexity of strict consistency. Mobile clients spend significant time offline; treating offline writes as first-class requires CRDT-style merge semantics anyway.

## Trade-offs accepted

- Two collaborators completing the same todo simultaneously: both events succeed; the second is idempotent at the data layer.
- Conflicting renames on the same list: last-write-wins by wall-clock, with the loser's version preserved in history for one week.
- A collaborator may briefly see a stale view after another's write — bounded by sync latency (target: <5s p95).
