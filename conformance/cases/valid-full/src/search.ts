// A source file anchoring code back to spec items (SPEC.md §9.4).

// livespec: full-text-search#REQ-1,AC-1.2
export function runQuery(q: string): string[] {
  return q.trim() ? [] : [];
}
