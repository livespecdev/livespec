/**
 * Lint rule catalog.
 *
 * Each rule has a stable ID, a severity, the SPEC.md section it enforces, and
 * a one-line description. The `spec` column is what keeps the linter traceable
 * to the standard: a rule with no §N is a bug.
 *
 * ID convention: E = error, W = warning. Numbered by category:
 *   0xx  filesystem / placement / manifest
 *   1xx  frontmatter / structural
 *   3xx  spec items
 *   4xx  features
 *   5xx  linking (frontmatter + in-prose)
 *   6xx  spec <-> code markers
 */

import type { Severity } from "./diagnostics.js";

export interface RuleDefinition {
  id: string;
  severity: Severity;
  /** SPEC.md section(s) this rule enforces. */
  spec: string;
  description: string;
}

export const RULES: Record<string, RuleDefinition> = {
  // --- Filesystem / placement (§3, §6.1, §9.1) ---
  E001: { id: "E001", severity: "error", spec: "§9.1", description: "Invalid slug (must match ^[a-z0-9]+(-[a-z0-9]+)*$)" },
  E002: { id: "E002", severity: "error", spec: "§6.1", description: "Concept file not at {product|ux|tech}/{type}/{slug}.md" },
  E003: { id: "E003", severity: "error", spec: "§6.1", description: "Concept type lives under the wrong top-level directory" },

  // --- Manifest (§4, §12, §13) ---
  E010: { id: "E010", severity: "error", spec: "§4", description: "Missing livespec.yaml at project root" },
  E011: { id: "E011", severity: "error", spec: "§4", description: "livespec.yaml missing required field format_version" },
  E012: { id: "E012", severity: "error", spec: "§4", description: "livespec.yaml missing required field name" },
  E013: { id: "E013", severity: "error", spec: "§4", description: "livespec.yaml failed to parse" },
  W010: { id: "W010", severity: "warning", spec: "§12", description: "Unknown mode value (expected loose or strict)" },
  W011: { id: "W011", severity: "warning", spec: "§13", description: "Project targets a newer format_version than this linter supports" },

  // --- Frontmatter / structural (§5, §6.4, §7.3, §7.4) ---
  E101: { id: "E101", severity: "error", spec: "§5", description: "Unclosed YAML frontmatter (missing closing ---)" },
  E102: { id: "E102", severity: "error", spec: "§5", description: "Frontmatter parse error" },
  E103: { id: "E103", severity: "error", spec: "§5", description: "Missing H1 title" },
  E104: { id: "E104", severity: "error", spec: "§5", description: "Empty frontmatter block (--- immediately followed by ---)" },
  E105: { id: "E105", severity: "error", spec: "§6.4/§7.4", description: "Missing opening summary paragraph" },
  E106: { id: "E106", severity: "error", spec: "§10", description: "Feature frontmatter carries forbidden status field" },

  // --- Spec items (§8) ---
  E301: { id: "E301", severity: "error", spec: "§8.3", description: "Duplicate spec item ID" },
  E302: { id: "E302", severity: "error", spec: "§8.2", description: "AC is not nested under a REQ" },
  E303: { id: "E303", severity: "error", spec: "§8.1", description: "Malformed spec item line (does not match the inline grammar)" },
  E304: { id: "E304", severity: "error", spec: "§8.1", description: "Spec item nested too deep (AC sub-trees are invalid)" },
  E305: { id: "E305", severity: "error", spec: "§8.3", description: "AC ID does not match its parent REQ's number" },
  E306: { id: "E306", severity: "error", spec: "§8.1", description: "Multiple resolution notes on one spec item" },
  W300: { id: "W300", severity: "warning", spec: "§8.2", description: "Unknown spec item type code" },
  W301: { id: "W301", severity: "warning", spec: "§8.1", description: "Resolution note on an open ([ ]) spec item" },
  W302: { id: "W302", severity: "warning", spec: "§8.2", description: "REQ marked [x] while one or more of its ACs are still open" },
  W303: { id: "W303", severity: "warning", spec: "§12.2", description: "[strict] REQ has no acceptance criteria" },

  // --- Features (§7) ---
  E401: { id: "E401", severity: "error", spec: "§7.1", description: "Feature slug collides with a sibling area name" },
  E402: { id: "E402", severity: "error", spec: "§7.1", description: "Feature area nests deeper than one level" },

  // --- Sections / modes (§7.3, §12.2) ---
  W410: { id: "W410", severity: "warning", spec: "§7.3", description: "Empty H2 section (should be omitted)" },
  E411: { id: "E411", severity: "error", spec: "§12.2", description: "[strict] Non-canonical H2 section name" },
  E412: { id: "E412", severity: "error", spec: "§12.2", description: "[strict] Spec item type does not match its containing section" },
  E413: { id: "E413", severity: "error", spec: "§12.2", description: "[strict] Canonical sections out of order" },

  // --- Linking (§7.2, §9) ---
  E501: { id: "E501", severity: "error", spec: "§7.2", description: "links.feature uses both list and object form" },
  W500: { id: "W500", severity: "warning", spec: "§9.2", description: "Dangling link: target slug not found in project" },
  W501: { id: "W501", severity: "warning", spec: "§7.2", description: "Unknown relation under links.feature (expected requires, triggers, extends)" },
  W502: { id: "W502", severity: "warning", spec: "§9.5", description: "Broken in-prose [[ ]] reference (no match)" },
  W503: { id: "W503", severity: "warning", spec: "§9.5", description: "Ambiguous in-prose [[slug]] shorthand (two or more matches)" },

  // --- Spec <-> code markers (§9.4) ---
  E601: { id: "E601", severity: "error", spec: "§9.4", description: "Malformed livespec: marker payload (whitespace inside payload)" },
  E602: { id: "E602", severity: "error", spec: "§9.4", description: "Listed marker ID carries its own feature-slug# prefix" },
  W600: { id: "W600", severity: "warning", spec: "§9.4", description: "Broken livespec: marker (feature file missing)" },
  W601: { id: "W601", severity: "warning", spec: "§9.4", description: "Broken livespec: marker (spec item ID not found in feature)" },
};

export function ruleSpec(ruleId: string): string {
  return RULES[ruleId]?.spec ?? "?";
}
