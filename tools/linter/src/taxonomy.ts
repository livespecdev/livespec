/**
 * The LiveSpec core taxonomy and fixed vocabularies (SPEC.md §3, §6.2, §7, §8, §11).
 *
 * Everything a Level-2 reader "MUST recognize" lives here, as the single
 * source of truth for the rules in lint-file.ts and lint-project.ts.
 */

/** The four fixed, exhaustive top-level directories (§3). */
export const TOP_LEVEL_DIRS = ["product", "ux", "tech", "features"] as const;

/** Top-level directories that hold concepts (§5, §6). */
export const CONCEPT_DIRS = ["product", "ux", "tech"] as const;
export type ConceptDir = (typeof CONCEPT_DIRS)[number];

/**
 * Core concept taxonomy (§6.2): type slug -> containing top-level directory.
 * Level-2 tools MUST recognize these. Unknown types are valid extensions
 * (§6.2) and MUST NOT cause failure, so the linter resolves unknown type
 * slugs by scanning the concept directories rather than rejecting them.
 */
export const CORE_CONCEPT_TYPES: Record<string, ConceptDir> = {
  // product/
  persona: "product",
  pain_point: "product",
  goal: "product",
  principle: "product",
  constraint: "product",
  entity: "product",
  glossary_term: "product",
  // ux/
  ui_component: "ux",
  design_principle: "ux",
  ux_pattern: "ux",
  // tech/
  coding_standard: "tech",
  architecture_decision: "tech",
  external_system: "tech",
};

/** Spec item type codes (§8.2). */
export const SPEC_ITEM_TYPES = ["REQ", "AC", "AS", "Q", "ISS"] as const;
export type SpecItemType = (typeof SPEC_ITEM_TYPES)[number];

/** Top-level (non-AC) spec item types: each lives in its own H2 section (§8.2). */
export const TOP_LEVEL_SPEC_TYPES = ["REQ", "AS", "Q", "ISS"] as const;

/** Checkbox tokens (§8.1). */
export const CHECKBOX_TOKENS = [" ", "x", "-"] as const;
export type CheckboxToken = (typeof CHECKBOX_TOKENS)[number];

/** Typed feature relations under links.feature (§7.2). */
export const FEATURE_RELATIONS = ["requires", "triggers", "extends"] as const;

/** Asset types (§11.2). */
export const ASSET_TYPES = [
  "wireframe",
  "mockup",
  "diagram",
  "screenshot",
  "reference",
] as const;

/** Canonical feature H2 section names (§7.3). */
export const CANONICAL_SECTIONS = [
  "Requirements",
  "Assumptions",
  "Questions",
  "Issues",
  "UX",
  "Tech",
] as const;

/** Canonical order used by strict mode (§7.3, §12.2). */
export const CANONICAL_SECTION_ORDER = [
  "Requirements",
  "Assumptions",
  "Questions",
  "Issues",
  "UX",
  "Tech",
] as const;

/** Which spec item type each canonical section is intended to hold (§7.3, §8.2). */
export const SECTION_EXPECTED_TYPE: Record<string, SpecItemType | null> = {
  Requirements: "REQ", // also AC (nested)
  Assumptions: "AS",
  Questions: "Q",
  Issues: "ISS",
  UX: null, // free-form notes
  Tech: null, // free-form notes
};

/** Slug grammar (§9.1): kebab-case ASCII. */
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A single resolution-note prefix (§8.1): U+2192 + one space. */
export const RESOLUTION_PREFIX = "→ ";

export function isCoreConceptType(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(CORE_CONCEPT_TYPES, type);
}
