/**
 * Project-mode linting: locates a LiveSpec project, runs every single-file
 * rule, then the cross-file rules that need the whole project in view
 * (SPEC.md §7.1 slug-area collisions, §9.2 link resolution, §9.5 in-prose
 * resolution, §9.4 spec<->code markers).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { LintDiagnostic, LintOptions } from "./diagnostics.js";
import { collector } from "./diagnostics.js";
import { lintFile, type FileContext, type FileKind } from "./lint-file.js";
import { parseFrontmatter, parseInProseRefs, parseMarkers, parseSpecItems } from "./parse.js";

export interface ProjectLintOptions {
  /**
   * Root to scan for `livespec:` source markers (§9.4). Defaults to the
   * project root. Point it at the repo root when the code lives outside the
   * spec folder.
   */
  codeRoot?: string;
  /** Highest format major this linter supports (default 1). */
  supportedMajor?: number;
}

/** SPEC.md version this linter targets. */
export const SUPPORTED_FORMAT_MAJOR = 1;

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);
const MAX_SCAN_BYTES = 512 * 1024;

export interface ProjectLintResult {
  projectRoot: string;
  diagnostics: LintDiagnostic[];
}

/**
 * Lint the LiveSpec project rooted at `projectRoot` (the directory that
 * contains `livespec.yaml`).
 */
export function lintProject(projectRoot: string, options: ProjectLintOptions = {}): ProjectLintResult {
  const diagnostics: LintDiagnostic[] = [];
  const manifestPath = path.join(projectRoot, "livespec.yaml");

  // --- Manifest (§4) ---
  const md = collector("livespec.yaml", diagnostics);
  let mode: "loose" | "strict" = "loose";
  if (!fs.existsSync(manifestPath)) {
    md("E010", "error", "Missing livespec.yaml at project root");
    return { projectRoot, diagnostics };
  }
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  try {
    const m = parseYaml(manifestRaw) as Record<string, unknown> | null;
    if (m === null || typeof m !== "object") {
      md("E013", "error", "livespec.yaml is not a mapping");
    } else {
      if (!("format_version" in m)) md("E011", "error", "livespec.yaml missing format_version");
      if (!("name" in m)) md("E012", "error", "livespec.yaml missing name");
      const rawMode = m.mode;
      if (rawMode !== undefined) {
        if (rawMode === "strict" || rawMode === "loose") {
          mode = rawMode;
        } else {
          md("W010", "warning", `Unknown mode "${String(rawMode)}" (expected loose or strict)`);
        }
      }
      const supported = options.supportedMajor ?? SUPPORTED_FORMAT_MAJOR;
      const major = parseInt(String(m.format_version ?? "").split(".")[0], 10);
      if (!Number.isNaN(major) && major > supported) {
        md("W011", "warning", `Project targets format_version ${String(m.format_version)} (linter supports ${supported}.x)`);
      }
    }
  } catch (e) {
    md("E013", "error", `livespec.yaml failed to parse: ${e instanceof Error ? e.message : String(e)}`);
  }

  const fileOpts: LintOptions = { mode };

  // --- Index pass: classify and collect every entity file ---
  const entities = collectEntities(projectRoot);

  // Build cross-file indices.
  const featureSlugs = new Set<string>();
  const conceptSlugsByType = new Map<string, Set<string>>();
  const featureItemIds = new Map<string, Set<string>>(); // slug -> ids present
  const areaNames = new Set<string>(); // every area path segment chain under features/

  for (const e of entities) {
    const slug = path.basename(e.relPath, ".md");
    if (e.kind === "feature") {
      featureSlugs.add(slug);
      const { body, bodyStartLine } = parseFrontmatter(fs.readFileSync(path.join(projectRoot, e.relPath), "utf-8"));
      const { items } = parseSpecItems(body, bodyStartLine);
      featureItemIds.set(slug, new Set(items.map((i) => i.id)));
      // record areas (path segments between features/ and the file)
      const parts = e.relPath.split("/").slice(1, -1); // drop "features" and filename
      for (let i = 1; i <= parts.length; i++) areaNames.add(parts.slice(0, i).join("/"));
    } else {
      const type = e.conceptType!;
      if (!conceptSlugsByType.has(type)) conceptSlugsByType.set(type, new Set());
      conceptSlugsByType.get(type)!.add(slug);
    }
  }

  // Shorthand index: slug -> number of entities carrying it (§9.5).
  const slugCounts = new Map<string, number>();
  const bump = (s: string) => slugCounts.set(s, (slugCounts.get(s) ?? 0) + 1);
  for (const s of featureSlugs) bump(s);
  for (const set of conceptSlugsByType.values()) for (const s of set) bump(s);

  // --- Per-file pass: single-file rules + cross-file link/in-prose checks ---
  for (const e of entities) {
    const abs = path.join(projectRoot, e.relPath);
    const content = fs.readFileSync(abs, "utf-8");
    const ctx: FileContext = {
      filePath: e.relPath,
      kind: e.kind,
      conceptType: e.conceptType,
      topDir: e.relPath.split("/")[0],
    };
    diagnostics.push(...lintFile(content, ctx, fileOpts));

    const fileD = collector(e.relPath, diagnostics);
    const fm = parseFrontmatter(content);

    // Frontmatter link resolution (§9.2 -> W500, §7.2 -> W501)
    checkLinks(fm.data, featureSlugs, conceptSlugsByType, fileD);

    // In-prose references (§9.5 -> W502 / W503)
    for (const ref of parseInProseRefs(fm.body, fm.bodyStartLine)) {
      resolveInProse(ref, featureSlugs, conceptSlugsByType, slugCounts, fileD);
    }
  }

  // --- Slug-area collisions (§7.1 -> E401), area depth (§7.1 -> E402) ---
  for (const e of entities) {
    if (e.kind !== "feature") continue;
    const slug = path.basename(e.relPath, ".md");
    const areaParts = e.relPath.split("/").slice(1, -1);
    if (areaParts.length > 2) {
      // features/{area}/{sub}/file.md == 2 area levels max (§7.1).
      const fd = collector(e.relPath, diagnostics);
      fd("E402", "error", `Feature area nests deeper than one level: ${areaParts.join("/")}`);
    }
    // A feature whose slug equals an area chain collides (features/billing.md vs features/billing/...).
    const ownArea = areaParts.join("/");
    const candidate = ownArea ? `${ownArea}/${slug}` : slug;
    if (areaNames.has(candidate)) {
      const fd = collector(e.relPath, diagnostics);
      fd("E401", "error", `Feature slug "${slug}" collides with sibling area "${candidate}"`);
    }
  }

  // --- Spec <-> code markers (§9.4) ---
  lintMarkers(options.codeRoot ?? projectRoot, projectRoot, featureSlugs, featureItemIds, diagnostics);

  return { projectRoot, diagnostics };
}

// ============================================
// Entity collection / classification (§3)
// ============================================

interface Entity {
  relPath: string;
  kind: FileKind;
  conceptType?: string;
}

function collectEntities(projectRoot: string): Entity[] {
  const out: Entity[] = [];
  for (const top of ["product", "ux", "tech"] as const) {
    walkMd(path.join(projectRoot, top), projectRoot, (rel) => {
      const parts = rel.split("/");
      // concept type is the first segment after the top dir (§6.1)
      out.push({ relPath: rel, kind: "concept", conceptType: parts[1] });
    });
  }
  walkMd(path.join(projectRoot, "features"), projectRoot, (rel) => {
    out.push({ relPath: rel, kind: "feature" });
  });
  return out;
}

function walkMd(dir: string, projectRoot: string, cb: (relPath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue; // §11 asset store, not entities
      walkMd(full, projectRoot, cb);
    } else if (entry.name.endsWith(".md")) {
      cb(path.relative(projectRoot, full).split(path.sep).join("/"));
    }
  }
}

// ============================================
// Links (§9.2, §7.2)
// ============================================

function checkLinks(
  data: Record<string, unknown> | null,
  featureSlugs: Set<string>,
  conceptSlugsByType: Map<string, Set<string>>,
  d: ReturnType<typeof collector>,
): void {
  if (!data || typeof data !== "object") return;
  const links = (data as Record<string, unknown>).links;
  if (!links || typeof links !== "object") return;

  for (const [key, value] of Object.entries(links as Record<string, unknown>)) {
    if (key === "feature") {
      for (const slug of collectFeatureLinkSlugs(value)) {
        if (!featureSlugs.has(slug)) {
          d("W500", "warning", `Dangling feature link: "${slug}" not found`);
        }
      }
      continue;
    }
    // Concept type link: every slug must exist under that type.
    const slugs = Array.isArray(value) ? value : [];
    const known = conceptSlugsByType.get(key);
    for (const slug of slugs) {
      if (typeof slug !== "string") continue;
      if (!known || !known.has(slug)) {
        d("W500", "warning", `Dangling link: ${key}/${slug} not found`);
      }
    }
  }
}

function collectFeatureLinkSlugs(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (value && typeof value === "object") {
    const out: string[] = [];
    for (const [rel, list] of Object.entries(value as Record<string, unknown>)) {
      void rel; // relation-name validity is handled in lint-file (W501)
      if (Array.isArray(list)) out.push(...list.filter((v): v is string => typeof v === "string"));
    }
    return out;
  }
  return [];
}

// ============================================
// In-prose resolution (§9.5)
// ============================================

function resolveInProse(
  ref: { type: string | null; slug: string; line: number; raw: string },
  featureSlugs: Set<string>,
  conceptSlugsByType: Map<string, Set<string>>,
  slugCounts: Map<string, number>,
  d: ReturnType<typeof collector>,
): void {
  if (ref.type !== null) {
    // Typed reference (§9.5): resolve against its declared type.
    const ok =
      ref.type === "feature"
        ? featureSlugs.has(ref.slug)
        : (conceptSlugsByType.get(ref.type)?.has(ref.slug) ?? false);
    if (!ok) d("W502", "warning", `Broken in-prose reference ${ref.raw}`, ref.line);
    return;
  }
  // Shorthand (§9.5): must be unambiguous across the whole project.
  const count = slugCounts.get(ref.slug) ?? 0;
  if (count === 0) d("W502", "warning", `Broken in-prose reference ${ref.raw}`, ref.line);
  else if (count > 1) d("W503", "warning", `Ambiguous in-prose reference ${ref.raw} (${count} matches; use [[type:slug]])`, ref.line);
}

// ============================================
// Spec <-> code markers (§9.4)
// ============================================

function lintMarkers(
  codeRoot: string,
  projectRoot: string,
  featureSlugs: Set<string>,
  featureItemIds: Map<string, Set<string>>,
  diagnostics: LintDiagnostic[],
): void {
  walkText(codeRoot, (absPath) => {
    let content: string;
    try {
      const stat = fs.statSync(absPath);
      if (stat.size > MAX_SCAN_BYTES) return;
      content = fs.readFileSync(absPath, "utf-8");
    } catch {
      return;
    }
    if (!content.includes("livespec:")) return;

    const rel = path.relative(projectRoot, absPath).split(path.sep).join("/");
    const d = collector(rel, diagnostics);

    for (const marker of parseMarkers(content)) {
      if (marker.malformedWhitespace) {
        d("E601", "error", `Malformed livespec: marker (whitespace inside payload)`, marker.line);
      }
      if (marker.idCarriesPrefix) {
        d("E602", "error", `livespec: marker list ID carries its own feature-slug# prefix`, marker.line);
      }
      if (marker.unparseable) continue;

      if (!featureSlugs.has(marker.featureSlug)) {
        d("W600", "warning", `Broken livespec: marker (feature "${marker.featureSlug}" not found)`, marker.line);
        continue;
      }
      const ids = featureItemIds.get(marker.featureSlug) ?? new Set<string>();
      for (const id of marker.ids) {
        if (!ids.has(id)) {
          d("W601", "warning", `Broken livespec: marker (${marker.featureSlug}#${id} not found)`, marker.line);
        }
      }
    }
  });
}

function walkText(dir: string, cb: (absPath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkText(full, cb);
    } else if (entry.isFile()) {
      cb(full);
    }
  }
}
