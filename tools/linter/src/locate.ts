/**
 * Project location (SPEC.md §3, §3.1).
 *
 * A LiveSpec project root is any directory containing a `livespec.yaml`. A
 * repository MAY hold several (monorepo); each is an independent root. We never
 * assume a fixed path: we search.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const IGNORED = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);

/**
 * Find all project roots at or under `startDir` by locating every
 * `livespec.yaml`. Does not descend into a project's own subtree once found
 * (nested projects under a project root are unusual; the outer wins).
 */
export function findProjectRoots(startDir: string, maxDepth = 6): string[] {
  const roots: string[] = [];

  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth) return;
    if (fs.existsSync(path.join(dir, "livespec.yaml"))) {
      roots.push(dir);
      return; // do not descend below a found root
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORED.has(entry.name)) continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  };

  walk(path.resolve(startDir), 0);
  return roots;
}
