# REST with Cursor Pagination

All public API endpoints follow REST semantics over HTTPS. Paginated endpoints use opaque forward cursors, never page numbers or offsets.

## Rules

- Resource paths use plural nouns (`/lists`, `/todos`).
- State-changing verbs use HTTP methods (`POST`, `PATCH`, `DELETE`); never POST-for-everything.
- All `GET` collection endpoints accept `?cursor={opaque}&limit={n}` and return `next_cursor` in the response body. A null `next_cursor` means end of stream.
- Responses are JSON with `snake_case` keys. Dates are ISO 8601 in UTC.
- Errors return a stable problem-detail body (`type`, `title`, `detail`, `instance`) per RFC 7807.

## Why cursor pagination

Offset pagination is correct only for static datasets; ours change constantly (new todos appear, completed ones disappear from default views). Cursor pagination is stable under concurrent writes and removes a class of "missing/duplicate item" bug reports.
