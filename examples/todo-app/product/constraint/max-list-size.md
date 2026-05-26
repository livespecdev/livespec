# Max List Size

A single list MUST NOT exceed 500 active (non-archived) todos. Attempts to add a todo beyond that cap MUST be rejected with a clear message inviting the user to archive or split.

## Why this cap

The mobile UI degrades past a few hundred items, and product research consistently shows that lists beyond ~500 entries are no longer used for active work — they become append-only graveyards. Capping the size protects users from a failure mode they don't recognize until it has cost them.

## Scope

Applies to personal lists and shared lists alike. Archived items do not count. The cap is a product constraint, not a technical one — the storage layer can hold far more.
