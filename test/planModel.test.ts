import test from "node:test";
import assert from "node:assert/strict";
import {
  countTodosInFrontmatter,
  paginatePlans,
  parsePlanDocument,
  sortPlans,
  filterPlans,
  formatPlansStatusText
} from "../src/planModel";

const content = `---
name: Appearance page and nav
overview: Rename the UI Showcase page to Appearance and move its route.
todos: []
isProject: false
---

# Appearance Page and Navigation Changes

- **[App.tsx](frontend/src/App.tsx)**: Change route from path="/ui" to path="/appearance".
`;

test("parsePlanDocument reads frontmatter and body heading", () => {
  const parsed = parsePlanDocument({
    content,
    fileName: "refactoring_the_code_f756c204.plan.md",
    filePath: "/repo/.cursor/plans/refactoring_the_code_f756c204.plan.md",
    workspaceName: "repo",
    modifiedAt: 1_700_000_000_000
  });

  assert.equal(parsed.title, "Appearance page and nav");
  assert.equal(parsed.overview, "Rename the UI Showcase page to Appearance and move its route.");
  assert.equal(parsed.isProject, false);
  assert.equal(parsed.fileName, "refactoring_the_code_f756c204.plan.md");
  assert.equal(parsed.bodyTitle, "Appearance Page and Navigation Changes");
  assert.equal(parsed.todoCount, 0);
  assert.match(parsed.searchText, /App\.tsx/);
});

test("parsePlanDocument falls back to heading and filename when frontmatter is missing", () => {
  const parsed = parsePlanDocument({
    content: "# Fallback Title\n\nSome details.",
    fileName: "fallback.plan.md",
    filePath: "/repo/.cursor/plans/fallback.plan.md",
    workspaceName: "repo",
    modifiedAt: 1
  });

  assert.equal(parsed.title, "Fallback Title");
  assert.equal(parsed.overview, "Some details.");
});

test("sortPlans supports date, title, filename, and project-first ordering", () => {
  const base = {
    overview: "",
    bodyTitle: "",
    workspaceName: "repo"
  };
  const plans = [
    {
      ...base,
      id: "b",
      title: "Beta",
      fileName: "zeta.plan.md",
      filePath: "/b",
      modifiedAt: 20,
      isProject: false,
      todoCount: 0,
      searchText: ""
    },
    {
      ...base,
      id: "a",
      title: "Alpha",
      fileName: "alpha.plan.md",
      filePath: "/a",
      modifiedAt: 10,
      isProject: true,
      todoCount: 0,
      searchText: ""
    }
  ];

  assert.deepEqual(sortPlans(plans, "modifiedDesc").map((plan) => plan.id), ["b", "a"]);
  assert.deepEqual(sortPlans(plans, "titleAsc").map((plan) => plan.id), ["a", "b"]);
  assert.deepEqual(sortPlans(plans, "fileNameAsc").map((plan) => plan.id), ["a", "b"]);
  assert.deepEqual(sortPlans(plans, "projectFirst").map((plan) => plan.id), ["a", "b"]);
});

test("filterPlans performs fuzzy matching across title, filename, and overview", () => {
  const plans = [
    {
      id: "appearance",
      title: "Appearance page and nav",
      overview: "Move route to appearance",
      bodyTitle: "Appearance Page",
      fileName: "appearance_page.plan.md",
      filePath: "/appearance",
      workspaceName: "repo",
      modifiedAt: 1,
      isProject: false,
      todoCount: 0,
      searchText: ""
    },
    {
      id: "billing",
      title: "Billing workflow",
      overview: "Stripe checkout polish",
      bodyTitle: "Billing",
      fileName: "billing_workflow.plan.md",
      filePath: "/billing",
      workspaceName: "repo",
      modifiedAt: 2,
      isProject: false,
      todoCount: 0,
      searchText: ""
    }
  ];

  assert.deepEqual(filterPlans(plans, "ap nav").map((plan) => plan.id), ["appearance"]);
  assert.deepEqual(filterPlans(plans, "stripe").map((plan) => plan.id), ["billing"]);
});

test("filterPlans searches markdown body content", () => {
  const parsed = parsePlanDocument({
    content,
    fileName: "appearance_page.plan.md",
    filePath: "/repo/.cursor/plans/appearance_page.plan.md",
    workspaceName: "repo",
    modifiedAt: 1
  });

  assert.deepEqual(filterPlans([parsed], "App.tsx").map((plan) => plan.id), [parsed.id]);
});

test("filterPlans excludes plans without matching words", () => {
  const plans = [
    parsePlanDocument({
      content,
      fileName: "appearance_page.plan.md",
      filePath: "/repo/.cursor/plans/appearance_page.plan.md",
      workspaceName: "repo",
      modifiedAt: 1
    }),
    parsePlanDocument({
      content: "---\nname: Billing workflow\noverview: Stripe checkout polish\n---\n\n# Billing\n\nUpdate payment flows.",
      fileName: "billing_workflow.plan.md",
      filePath: "/repo/.cursor/plans/billing_workflow.plan.md",
      workspaceName: "repo",
      modifiedAt: 2
    })
  ];

  assert.deepEqual(filterPlans(plans, "App.tsx").map((plan) => plan.fileName), ["appearance_page.plan.md"]);
  assert.deepEqual(filterPlans(plans, "definitelymissing").map((plan) => plan.fileName), []);
  assert.deepEqual(filterPlans(plans, "bow").map((plan) => plan.fileName), []);
});

test("formatPlansStatusText renders singular and plural status bar labels", () => {
  assert.equal(formatPlansStatusText(1), "$(list-unordered) 1 Plan");
  assert.equal(formatPlansStatusText(33), "$(list-unordered) 33 Plans");
});

const multiLineTodosContent = `---
name: Board performance fixes
overview: Reduce main-thread and network load on large kanban boards.
todos:
  - id: phase1-debounce-socket
    content: Debounce board invalidateQueries
    status: completed
  - id: phase1-debounce-search-memo
    content: Debounce searchTerm
    status: completed
  - id: phase2-slim-api
    content: Slim getBoard ticket include
    status: completed
  - id: phase2-frontend-types
    content: Update Ticket type
    status: completed
  - id: phase3-cache-patch
    content: Add boardCache utils
    status: completed
  - id: phase4-virtualize
    content: Add react-virtual
    status: completed
  - id: verify-large-board
    content: Manual QA on large board
    status: completed
isProject: false
---

# Board performance improvement plan
`;

test("countTodosInFrontmatter counts Cursor multi-line todo entries", () => {
  const frontmatterText = multiLineTodosContent.slice(
    multiLineTodosContent.indexOf("\n", 4) + 1,
    multiLineTodosContent.indexOf("\n---", 4)
  );

  assert.equal(countTodosInFrontmatter(frontmatterText), 7);
});

test("parsePlanDocument reads multi-line todos from frontmatter", () => {
  const parsed = parsePlanDocument({
    content: multiLineTodosContent,
    fileName: "board_performance_fixes.plan.md",
    filePath: "/repo/.cursor/plans/board_performance_fixes.plan.md",
    workspaceName: "repo",
    modifiedAt: 1_700_000_000_000
  });

  assert.equal(parsed.todoCount, 7);
});

test("paginatePlans returns correct pages and clamps page number", () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);

  assert.deepEqual(paginatePlans(items, 1, 12), {
    page: 1,
    pageCount: 3,
    items: items.slice(0, 12)
  });

  assert.deepEqual(paginatePlans(items, 3, 12), {
    page: 3,
    pageCount: 3,
    items: items.slice(24, 36)
  });

  assert.deepEqual(paginatePlans(items, 99, 12), {
    page: 3,
    pageCount: 3,
    items: items.slice(24, 36)
  });

  assert.deepEqual(paginatePlans([], 1, 24), {
    page: 1,
    pageCount: 1,
    items: []
  });
});

test("parsePlanDocument returns zero todos when todos key is missing", () => {
  const parsed = parsePlanDocument({
    content: "---\nname: Simple plan\noverview: No todos here.\n---\n\n# Simple\n",
    fileName: "simple.plan.md",
    filePath: "/repo/.cursor/plans/simple.plan.md",
    workspaceName: "repo",
    modifiedAt: 1
  });

  assert.equal(parsed.todoCount, 0);
});
