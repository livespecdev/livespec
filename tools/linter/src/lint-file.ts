/**
 * Single-file linting: every rule decidable from one file's content plus its
 * path, without cross-file context (SPEC.md §5-§8, §10, §12).
 *
 * Cross-file rules (dangling links, in-prose resolution, slug-area collisions,
 * markers) live in lint-project.ts.
 */

import { collector, type Diag, type LintDiagnostic, type LintOptions } from "./diagnostics.js";
import {
  parseFrontmatter,
  parseTitle,
  hasSummaryParagraph,
  parseSections,
  parseSpecItems,
  type ParsedSpecItem,
} from "./parse.js";
import {
  SLUG_REGEX,
  SPEC_ITEM_TYPES,
  FEATURE_RELATIONS,
  CANONICAL_SECTIONS,
  CANONICAL_SECTION_ORDER,
  SECTION_EXPECTED_TYPE,
  isCoreConceptType,
  CORE_CONCEPT_TYPES,
} from "./taxonomy.js";

export type FileKind = "concept" | "feature";

export interface FileContext {
  /** Path relative to the project root, e.g. "product/persona/foo.md". */
  filePath: string;
  kind: FileKind;
  /** For concepts: the type slug derived from the directory (§6.1). */
  conceptType?: string;
  /** The top-level dir the file sits in. */
  topDir: string;
}

/**
 * Lint one entity file. `ctx` carries what the project walker already derived
 * from the path; callers that lint a bare file can build it with `classify`.
 */
export function lintFile(
  content: string,
  ctx: FileContext,
  options: LintOptions = {},
): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const d = collector(ctx.filePath, diagnostics);
  const mode = options.mode ?? "loose";

  // --- Slug (§9.1) ---
  const filename = ctx.filePath.slice(ctx.filePath.lastIndexOf("/") + 1).replace(/\.md$/, "");
  if (!SLUG_REGEX.test(filename)) {
    d("E001", "error", `Invalid slug "${filename}" (must match ${SLUG_REGEX.source})`);
  }

  // --- Concept placement (§6.1) ---
  if (ctx.kind === "concept") {
    checkConceptPlacement(ctx, d);
  }

  // --- Frontmatter (§5) ---
  const fm = parseFrontmatter(content);
  if (fm.unclosed) {
    d("E101", "error", "Unclosed YAML frontmatter (missing closing ---)", 1);
    return diagnostics; // can't reliably parse the rest
  }
  if (fm.empty) {
    d("E104", "error", "Empty frontmatter block: omit it entirely (§5)", 1);
  }
  if (fm.parseError) {
    d("E102", "error", `Frontmatter parse error: ${fm.parseError}`, 1);
  }

  // --- Title + summary (§6.4, §7.3, §7.4) ---
  const { title, line: titleLine } = parseTitle(fm.body, fm.bodyStartLine);
  if (!title) {
    d("E103", "error", "Missing H1 title (# Title)");
  } else if (!hasSummaryParagraph(fm.body)) {
    d("E105", "error", "Missing opening summary paragraph after the H1", titleLine);
  }

  const data = fm.data ?? {};

  // --- Feature-only: forbidden status (§10) ---
  if (ctx.kind === "feature" && "status" in data) {
    d("E106", "error", "Features MUST NOT carry a status field (§10)", 1);
  }

  // --- links.feature form check (§7.2) ---
  if (ctx.kind === "feature") {
    checkFeatureRelations(data, d);
  }

  // --- Spec items (§8) ---
  const { items, malformed } = parseSpecItems(fm.body, fm.bodyStartLine);
  for (const bad of malformed) {
    d("E303", "error", `Malformed spec item line: "${truncate(bad.text)}"`, bad.line);
  }
  lintSpecItems(items, d);

  // --- Sections / modes (§7.3, §12.2) ---
  if (ctx.kind === "feature") {
    lintSections(fm.body, fm.bodyStartLine, items, mode, d);
  }

  return diagnostics;
}

// ============================================
// Concept placement (§6.1)
// ============================================

function checkConceptPlacement(ctx: FileContext, d: Diag): void {
  // Expected shape: {product|ux|tech}/{type}/{slug}.md  (exactly 3 segments)
  const parts = ctx.filePath.split("/");
  if (parts.length !== 3) {
    d("E002", "error", `Concept must be at {product|ux|tech}/{type}/{slug}.md, got "${ctx.filePath}"`);
    return;
  }
  const type = ctx.conceptType ?? parts[1];
  if (isCoreConceptType(type)) {
    const expectedDir = CORE_CONCEPT_TYPES[type];
    if (expectedDir !== ctx.topDir) {
      d("E003", "error", `Core type "${type}" must live under ${expectedDir}/, not ${ctx.topDir}/`);
    }
  }
  // Unknown types are valid extensions (§6.2): no diagnostic.
}

// ============================================
// Feature relations (§7.2)
// ============================================

function checkFeatureRelations(data: Record<string, unknown>, d: Diag): void {
  const links = data.links;
  if (!links || typeof links !== "object") return;
  const feature = (links as Record<string, unknown>).feature;
  if (feature === undefined) return;

  if (Array.isArray(feature)) {
    return; // untyped list form is valid on its own
  }
  if (feature && typeof feature === "object") {
    for (const rel of Object.keys(feature as Record<string, unknown>)) {
      if (!(FEATURE_RELATIONS as readonly string[]).includes(rel)) {
        d("W501", "warning", `Unknown feature relation "${rel}" (expected ${FEATURE_RELATIONS.join(", ")})`);
      }
    }
    // A value that is both array-ish and object-ish is impossible in YAML; the
    // mixed-form error (E501) is detected at the raw level below.
  }
}

// ============================================
// Spec items (§8)
// ============================================

function lintSpecItems(items: ParsedSpecItem[], d: Diag): void {
  const seen = new Map<string, number>();
  const reqsByNum = new Map<number, ParsedSpecItem>();

  for (const it of items) {
    // Duplicate IDs (§8.3)
    if (seen.has(it.id)) {
      d("E301", "error", `Duplicate spec item ID: ${it.id}`, it.line);
    }
    seen.set(it.id, it.line);

    // Unknown type code (§8.2)
    if (!(SPEC_ITEM_TYPES as readonly string[]).includes(it.typeCode)) {
      d("W300", "warning", `Unknown spec item type code: ${it.typeCode}`, it.line);
    }

    // Resolution notes (§8.1)
    if (it.resolutionNotes > 1) {
      d("E306", "error", `Spec item ${it.id} has ${it.resolutionNotes} resolution notes (at most one allowed)`, it.line);
    }
    if (it.resolutionNotes >= 1 && it.checkbox === " ") {
      d("W301", "warning", `Resolution note on open item ${it.id} (notes are for closed items)`, it.line);
    }

    if (it.typeCode === "REQ") {
      reqsByNum.set(parseInt(it.idNum, 10), it);
    }

    // Excessive nesting -> AC sub-tree (§8.1)
    if (it.idNum.split(".").length > 2) {
      d("E304", "error", `Spec item ${it.id} nests too deep (AC sub-trees are invalid)`, it.line);
    }
  }

  // AC structural checks (§8.2, §8.3)
  for (const it of items) {
    if (it.typeCode !== "AC") continue;
    if (it.parentReqId === null) {
      d("E302", "error", `AC ${it.id} is not nested under a REQ`, it.line);
      continue;
    }
    const major = parseInt(it.idNum.split(".")[0], 10);
    if (it.parentReqNum !== null && major !== it.parentReqNum) {
      d("E305", "error", `AC ${it.id} should be AC-${it.parentReqNum}.x to match parent ${it.parentReqId}`, it.line);
    }
  }

  // REQ [x] with open ACs (§8.2)
  const acsByReq = new Map<number, ParsedSpecItem[]>();
  for (const it of items) {
    if (it.typeCode === "AC" && it.parentReqNum !== null) {
      const list = acsByReq.get(it.parentReqNum) ?? [];
      list.push(it);
      acsByReq.set(it.parentReqNum, list);
    }
  }
  for (const [num, req] of reqsByNum) {
    if (req.checkbox !== "x") continue;
    const acs = acsByReq.get(num) ?? [];
    if (acs.some((ac) => ac.checkbox === " ")) {
      d("W302", "warning", `REQ-${num} is [x] but has open ACs`, req.line);
    }
  }
}

// ============================================
// Sections / modes (§7.3, §12.2)
// ============================================

function lintSections(
  body: string,
  bodyStartLine: number,
  items: ParsedSpecItem[],
  mode: "loose" | "strict",
  d: Diag,
): void {
  const sections = parseSections(body, bodyStartLine);

  // Empty sections (§7.3): SHOULD be omitted.
  for (const s of sections) {
    if (s.empty) d("W410", "warning", `Empty section "## ${s.name}" (omit it instead)`, s.line);
  }

  if (mode !== "strict") return;

  // Strict: every REQ SHOULD have at least one AC (§12.2)
  const acParents = new Set<number>();
  for (const it of items) {
    if (it.typeCode === "AC" && it.parentReqNum !== null) acParents.add(it.parentReqNum);
  }
  for (const it of items) {
    if (it.typeCode !== "REQ") continue;
    const num = parseInt(it.idNum, 10);
    if (!acParents.has(num)) {
      d("W303", "warning", `[strict] ${it.id} has no acceptance criteria`, it.line);
    }
  }

  // Strict: canonical names only (§12.2)
  for (const s of sections) {
    if (!(CANONICAL_SECTIONS as readonly string[]).includes(s.name)) {
      d("E411", "error", `[strict] Non-canonical section "## ${s.name}"`, s.line);
    }
  }

  // Strict: canonical order (§12.2)
  let lastIdx = -1;
  for (const s of sections) {
    const idx = (CANONICAL_SECTION_ORDER as readonly string[]).indexOf(s.name);
    if (idx === -1) continue;
    if (idx < lastIdx) {
      d("E413", "error", `[strict] Section "## ${s.name}" is out of canonical order`, s.line);
    }
    lastIdx = Math.max(lastIdx, idx);
  }

  // Strict: spec item type must match its section (§12.2)
  for (const s of sections) {
    const expected = SECTION_EXPECTED_TYPE[s.name];
    if (expected === undefined || expected === null) continue;
    const lo = s.line;
    const hi = s.line + s.contentLines.length;
    for (const it of items) {
      if (it.line <= lo || it.line > hi) continue;
      if (it.typeCode === "AC") continue; // ACs belong to REQs structurally
      if (it.typeCode !== expected) {
        d("E412", "error", `[strict] ${it.typeCode} item in "## ${s.name}" (expected ${expected})`, it.line);
      }
    }
  }
}

// ============================================
// Helpers
// ============================================

function truncate(s: string, n = 70): string {
  return s.length > n ? `${s.slice(0, n)}...` : s;
}
