export type PlanSortKey =
  | "modifiedDesc"
  | "modifiedAsc"
  | "titleAsc"
  | "titleDesc"
  | "fileNameAsc"
  | "fileNameDesc"
  | "projectFirst";

export interface PlanDocumentInput {
  content: string;
  fileName: string;
  filePath: string;
  workspaceName: string;
  modifiedAt: number;
}

export interface PlanItem {
  id: string;
  title: string;
  overview: string;
  bodyTitle: string;
  fileName: string;
  filePath: string;
  workspaceName: string;
  modifiedAt: number;
  isProject: boolean;
  todoCount: number;
  searchText: string;
}

interface FrontmatterResult {
  frontmatter: Record<string, unknown>;
  frontmatterText: string;
  body: string;
}

export function countTodosInFrontmatter(frontmatterText: string): number {
  const lines = frontmatterText.split(/\r?\n/);
  let inTodos = false;
  let count = 0;

  for (const line of lines) {
    if (/^todos:\s*\[\s*\]?\s*$/.test(line)) {
      return 0;
    }

    if (/^todos:\s*$/.test(line)) {
      inTodos = true;
      continue;
    }

    if (inTodos) {
      if (/^[A-Za-z0-9_-]+:\s*/.test(line)) {
        break;
      }

      if (/^\s+-\s+id:/.test(line)) {
        count += 1;
      }
    }
  }

  return count;
}

export function parsePlanDocument(input: PlanDocumentInput): PlanItem {
  const { frontmatter, frontmatterText, body } = splitFrontmatter(input.content);
  const bodyTitle = findFirstHeading(body);
  const title = readString(frontmatter.name) || bodyTitle || stripPlanExtension(input.fileName);
  const overview = readString(frontmatter.overview) || findFirstParagraph(body);
  const isProject = readBoolean(frontmatter.isProject);
  const todoCount = countTodosInFrontmatter(frontmatterText) || readTodoCount(frontmatter.todos);
  const searchText = normalizeBodyForSearch(body);

  return {
    id: input.filePath,
    title,
    overview,
    bodyTitle,
    fileName: input.fileName,
    filePath: input.filePath,
    workspaceName: input.workspaceName,
    modifiedAt: input.modifiedAt,
    isProject,
    todoCount,
    searchText
  };
}

export function sortPlans(plans: readonly PlanItem[], sortKey: PlanSortKey): PlanItem[] {
  const sorted = [...plans];

  sorted.sort((left, right) => {
    switch (sortKey) {
      case "modifiedAsc":
        return left.modifiedAt - right.modifiedAt || compareText(left.title, right.title);
      case "titleAsc":
        return compareText(left.title, right.title) || compareText(left.fileName, right.fileName);
      case "titleDesc":
        return compareText(right.title, left.title) || compareText(left.fileName, right.fileName);
      case "fileNameAsc":
        return compareText(left.fileName, right.fileName) || compareText(left.title, right.title);
      case "fileNameDesc":
        return compareText(right.fileName, left.fileName) || compareText(left.title, right.title);
      case "projectFirst":
        return Number(right.isProject) - Number(left.isProject) || right.modifiedAt - left.modifiedAt;
      case "modifiedDesc":
      default:
        return right.modifiedAt - left.modifiedAt || compareText(left.title, right.title);
    }
  });

  return sorted;
}

export interface PaginatedResult<T> {
  page: number;
  pageCount: number;
  items: T[];
}

export function paginatePlans<T>(items: readonly T[], page: number, pageSize: number): PaginatedResult<T> {
  if (pageSize <= 0) {
    return { page: 1, pageCount: 1, items: [...items] };
  }

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageCount,
    items: items.slice(start, start + pageSize)
  };
}

export function filterPlans(plans: readonly PlanItem[], query: string): PlanItem[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [...plans];
  }

  return plans
    .map((plan) => ({ plan, score: scorePlan(plan, trimmedQuery) }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || compareText(left.plan.title, right.plan.title))
    .map((result) => result.plan);
}

export function formatModifiedDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function formatPlansStatusText(count: number): string {
  return `$(list-unordered) ${count} ${count === 1 ? "Plan" : "Plans"}`;
}

function splitFrontmatter(content: string): FrontmatterResult {
  const normalized = content.replace(/^\uFEFF/, "");

  if (!normalized.startsWith("---")) {
    return { frontmatter: {}, frontmatterText: "", body: normalized };
  }

  const firstLineEnd = normalized.indexOf("\n");
  const closingStart = normalized.indexOf("\n---", firstLineEnd + 1);

  if (firstLineEnd === -1 || closingStart === -1) {
    return { frontmatter: {}, frontmatterText: "", body: normalized };
  }

  const closingEnd = normalized.indexOf("\n", closingStart + 1);
  const frontmatterText = normalized.slice(firstLineEnd + 1, closingStart);
  const body = closingEnd === -1 ? "" : normalized.slice(closingEnd + 1);

  return {
    frontmatter: parseSimpleYaml(frontmatterText),
    frontmatterText,
    body
  };
}

function parseSimpleYaml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of source.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    result[key] = parseYamlScalar(rawValue);
  }

  return result;
}

function parseYamlScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "[]") {
    return [];
  }

  const singleQuoted = /^'(.*)'$/.exec(trimmed);
  if (singleQuoted) {
    return singleQuoted[1].replace(/''/g, "'");
  }

  const doubleQuoted = /^"(.*)"$/.exec(trimmed);
  if (doubleQuoted) {
    return doubleQuoted[1].replace(/\\"/g, '"');
  }

  return trimmed;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readTodoCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  return 0;
}

function findFirstHeading(body: string): string {
  const match = /^#\s+(.+)$/m.exec(body);
  return match?.[1].trim() ?? "";
}

function findFirstParagraph(body: string): string {
  const cleaned = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"));

  return cleaned[0] ?? "";
}

function stripPlanExtension(fileName: string): string {
  return fileName.replace(/\.plan\.md$/i, "").replace(/[_-]+/g, " ").trim();
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });
}

function scorePlan(plan: PlanItem, query: string): number {
  const haystacks = [plan.title, plan.fileName, plan.overview, plan.bodyTitle, plan.workspaceName, plan.searchText];
  const tokens = tokenize(query);
  let score = 0;

  for (const token of tokens) {
    const tokenScore = Math.max(...haystacks.map((haystack) => matchScore(haystack, token)));

    if (tokenScore <= 0) {
      return 0;
    }

    score += tokenScore;
  }

  return score;
}

function normalizeBodyForSearch(body: string): string {
  return body
    .replace(/[`*_#[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForSearch(value).split(" ").filter(Boolean);
}

function matchScore(source: string, token: string): number {
  const normalized = normalizeForSearch(source);
  const compactSource = normalized.replace(/\s+/g, "");
  const compactToken = token.replace(/\s+/g, "");
  const exactIndex = normalized.indexOf(token);

  if (exactIndex >= 0) {
    return 1000 - exactIndex;
  }

  if (compactToken.length >= 3 && compactSource.includes(compactToken)) {
    return 700;
  }

  if (normalized.split(" ").some((word) => word.startsWith(token))) {
    return 500;
  }

  return 0;
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
