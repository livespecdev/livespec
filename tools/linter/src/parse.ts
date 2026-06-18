/**
 * LiveSpec parsing primitives.
 *
 * Pure, dependency-light parsers used by the linter. None of these throw on
 * malformed input: they return structured results (including error flags) so
 * the linter can collect diagnostics in a single pass.
 */

import { parse as parseYaml } from "yaml";
import { RESOLUTION_PREFIX } from "./taxonomy.js";

// ============================================
// Frontmatter (§5)
// ============================================

export interface ParsedFrontmatter {
  /** True when the file opens with a `---` delimiter. */
  hasFrontmatter: boolean;
  /** True when the opening `---` has no closing `---`. */
  unclosed: boolean;
  /** True when the block is present but empty (`---` immediately `---`). */
  empty: boolean;
  /** Parsed YAML object, or null when absent / unparseable. */
  data: Record<string, unknown> | null;
  /** YAML parse error message, if any. */
  parseError: string | null;
  /** Body content after the frontmatter block (or the whole file if none). */
  body: string;
  /** 1-based line on which the body starts (for line attribution). */
  bodyStartLine: number;
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {
    hasFrontmatter: false,
    unclosed: false,
    empty: false,
    data: null,
    parseError: null,
    body: content,
    bodyStartLine: 1,
  };

  // A leading `---` is always a frontmatter delimiter (§5), never an <hr>.
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") {
    return result;
  }

  result.hasFrontmatter = true;

  // Find the closing delimiter.
  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx === -1) {
    result.unclosed = true;
    return result;
  }

  const yamlText = lines.slice(1, closingIdx).join("\n");
  result.empty = yamlText.trim() === "";
  result.body = lines.slice(closingIdx + 1).join("\n");
  result.bodyStartLine = closingIdx + 2;

  if (!result.empty) {
    try {
      const data = parseYaml(yamlText);
      if (data !== null && typeof data === "object" && !Array.isArray(data)) {
        result.data = data as Record<string, unknown>;
      } else if (data !== null) {
        result.parseError = "Frontmatter is not a mapping";
      }
    } catch (e) {
      result.parseError = e instanceof Error ? e.message : String(e);
    }
  }

  return result;
}

// ============================================
// Title + summary (§6.4, §7.3, §7.4)
// ============================================

export interface ParsedTitle {
  title: string | null;
  line: number | null;
}

/** First H1 in the body. `bodyStartLine` maps back to file line numbers. */
export function parseTitle(body: string, bodyStartLine = 1): ParsedTitle {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^# (.+?)\s*$/);
    if (m) return { title: m[1].trim(), line: bodyStartLine + i };
  }
  return { title: null, line: null };
}

/**
 * Whether a non-empty opening summary paragraph exists immediately after the
 * H1 (§6.4, §7.4). We require at least one non-blank prose line between the
 * H1 and the next H2/structural break.
 */
export function hasSummaryParagraph(body: string): boolean {
  const lines = body.split("\n");
  let i = 0;
  // skip to H1
  while (i < lines.length && !/^# /.test(lines[i])) i++;
  if (i >= lines.length) return false;
  i++; // past the H1
  // skip blank lines
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return false;
  const first = lines[i].trim();
  // The first content after the H1 must be prose, not a heading or list.
  if (first.startsWith("#")) return false;
  if (/^[-*+] /.test(first)) return false;
  return first.length > 0;
}

// ============================================
// H2 sections (§7.3)
// ============================================

export interface ParsedSection {
  name: string;
  /** 1-based file line of the `## ` heading. */
  line: number;
  /** Body lines belonging to the section (until the next H2 or EOF). */
  contentLines: string[];
  /** True if the section has no non-blank content. */
  empty: boolean;
}

export function parseSections(body: string, bodyStartLine = 1): ParsedSection[] {
  const lines = body.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## (.+?)\s*$/);
    if (m) {
      if (current) {
        current.empty = current.contentLines.every((l) => l.trim() === "");
        sections.push(current);
      }
      current = { name: m[1].trim(), line: bodyStartLine + i, contentLines: [], empty: true };
    } else if (current) {
      current.contentLines.push(lines[i]);
    }
  }
  if (current) {
    current.empty = current.contentLines.every((l) => l.trim() === "");
    sections.push(current);
  }
  return sections;
}

// ============================================
// Spec items (§8)
// ============================================

export interface ParsedSpecItem {
  /** Raw type code as written (e.g. "REQ", or an unknown code). */
  typeCode: string;
  /** ID number text after the type (e.g. "1" or "2.1"). */
  idNum: string;
  /** Full display ID, e.g. "REQ-1" or "AC-2.1". */
  id: string;
  checkbox: " " | "x" | "-";
  /** Leading-space count of the list marker. */
  indent: number;
  /** 1-based file line. */
  line: number;
  /** Resolution-note (`→ `) continuation lines belonging to this item. */
  resolutionNotes: number;
  /** The display ID of the parent REQ for an AC, else null. */
  parentReqId: string | null;
  /** The parent REQ number for an AC (the N in AC-N.M derived from nesting). */
  parentReqNum: number | null;
}

export interface ParsedSpecItems {
  items: ParsedSpecItem[];
  /** Lines that look like a spec item attempt but fail the grammar. */
  malformed: { line: number; text: string }[];
}

// Strict inline grammar (§8.1): "- [ ] TYPE-ID: body"
const SPEC_ITEM_RE = /^([ \t]*)- \[([ x-])\] ([A-Za-z]+)-([0-9]+(?:\.[0-9]+)*): (.+)$/;
// A line that intends to be a spec item (used to flag malformed ones).
const SPEC_ITEM_INTENT_RE = /^[ \t]*- \[.?\]\s*[A-Za-z]+-[0-9]/;
// Any list item (used to bound continuation scanning).
const LIST_ITEM_RE = /^[ \t]*- /;

export function parseSpecItems(body: string, bodyStartLine = 1): ParsedSpecItems {
  const lines = body.split("\n");
  const items: ParsedSpecItem[] = [];
  const malformed: { line: number; text: string }[] = [];

  // Track the most recent REQ so ACs can be attached structurally (§8.2).
  let currentReq: ParsedSpecItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const m = raw.match(SPEC_ITEM_RE);

    if (!m) {
      if (SPEC_ITEM_INTENT_RE.test(raw)) {
        malformed.push({ line: bodyStartLine + i, text: raw.trim() });
      }
      continue;
    }

    const indent = m[1].replace(/\t/g, "  ").length;
    const checkbox = m[2] as " " | "x" | "-";
    const typeCode = m[3];
    const idNum = m[4];
    const item: ParsedSpecItem = {
      typeCode,
      idNum,
      id: `${typeCode}-${idNum}`,
      checkbox,
      indent,
      line: bodyStartLine + i,
      resolutionNotes: 0,
      parentReqId: null,
      parentReqNum: null,
    };

    // Count resolution-note continuation lines owned by this item.
    for (let j = i + 1; j < lines.length; j++) {
      const cont = lines[j];
      if (cont.trim() === "") continue;
      const contIndent = cont.replace(/\t/g, "  ").match(/^ */)![0].length;
      if (contIndent <= indent) break; // dedent ends the item body
      if (LIST_ITEM_RE.test(cont)) break; // a nested/sibling list item ends prose
      if (cont.trim().startsWith(RESOLUTION_PREFIX)) item.resolutionNotes++;
    }

    if (typeCode === "AC") {
      if (currentReq && indent > currentReq.indent) {
        item.parentReqId = currentReq.id;
        item.parentReqNum = parseInt(currentReq.idNum, 10);
      }
      // Orphaned ACs are left with parentReqId === null for the linter to flag.
    } else if (typeCode === "REQ" && indent === 0) {
      currentReq = item;
    } else if (indent === 0) {
      // A new top-level non-REQ item closes the current REQ context.
      currentReq = null;
    }

    items.push(item);
  }

  return { items, malformed };
}

// ============================================
// In-prose references (§9.5)
// ============================================

export interface InProseRef {
  /** "feature" or a concept type slug for typed refs; null for shorthand. */
  type: string | null;
  slug: string;
  line: number;
  /** Raw `[[...]]` payload. */
  raw: string;
}

const INPROSE_RE = /\[\[([^\]\s][^\]]*?)\]\]/g;

export function parseInProseRefs(body: string, bodyStartLine = 1): InProseRef[] {
  const lines = body.split("\n");
  const refs: InProseRef[] = [];
  for (let i = 0; i < lines.length; i++) {
    let m: RegExpExecArray | null;
    INPROSE_RE.lastIndex = 0;
    while ((m = INPROSE_RE.exec(lines[i])) !== null) {
      const payload = m[1];
      const colon = payload.indexOf(":");
      if (colon >= 0) {
        refs.push({
          type: payload.slice(0, colon),
          slug: payload.slice(colon + 1),
          line: bodyStartLine + i,
          raw: m[0],
        });
      } else {
        refs.push({ type: null, slug: payload, line: bodyStartLine + i, raw: m[0] });
      }
    }
  }
  return refs;
}

// ============================================
// Spec <-> code markers (§9.4)
// ============================================

export interface ParsedMarker {
  featureSlug: string;
  ids: string[];
  line: number;
  /** Whitespace appeared inside the payload (E601). */
  malformedWhitespace: boolean;
  /** A listed ID carried its own `feature-slug#` prefix (E602). */
  idCarriesPrefix: boolean;
  /** Payload could not be split into slug#id at all. */
  unparseable: boolean;
}

// Capture everything after `livespec:` up to end of line; comment terminators
// are stripped before the whitespace check so they don't read as payload ws.
const MARKER_RE = /livespec:[ \t]+(.+)$/;
const ID_RE = /^[A-Za-z]+-[0-9]+(?:\.[0-9]+)*$/;

export function parseMarkers(text: string): ParsedMarker[] {
  const lines = text.split("\n");
  const markers: ParsedMarker[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MARKER_RE);
    if (!m) continue;

    let tail = m[1];
    // Strip trailing block-comment terminators (`-->`, `*/`) and surrounding ws.
    tail = tail.replace(/\s*(-->|\*\/|\*\}|#\})\s*$/, "");
    tail = tail.trimEnd();

    const malformedWhitespace = /\s/.test(tail);
    // Use the first whitespace-delimited token as the intended payload.
    const payload = tail.split(/\s+/)[0] ?? "";

    const hash = payload.indexOf("#");
    if (hash < 0) {
      markers.push({
        featureSlug: payload,
        ids: [],
        line: i + 1,
        malformedWhitespace,
        idCarriesPrefix: false,
        unparseable: true,
      });
      continue;
    }

    const featureSlug = payload.slice(0, hash);
    const idList = payload.slice(hash + 1).split(",");
    let idCarriesPrefix = false;
    const ids: string[] = [];
    for (const rawId of idList) {
      if (rawId.includes("#")) {
        idCarriesPrefix = true;
        ids.push(rawId.slice(rawId.indexOf("#") + 1));
      } else {
        ids.push(rawId);
      }
    }

    markers.push({
      featureSlug,
      ids,
      line: i + 1,
      malformedWhitespace,
      idCarriesPrefix,
      unparseable: featureSlug === "" || ids.some((id) => !ID_RE.test(id)),
    });
  }

  return markers;
}
