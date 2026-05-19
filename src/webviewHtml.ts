import type { PlanItem } from "./planModel";

export interface RenderPlansWebviewHtmlInput {
  plans: readonly PlanItem[];
  nonce: string;
  cspSource: string;
}

export function renderPlansWebviewHtml(input: RenderPlansWebviewHtmlInput): string {
  const plansJson = serializeForScript(input.plans);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${input.nonce}' ${input.cspSource}; script-src 'nonce-${input.nonce}'; font-src ${input.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plans Viewer</title>
  <style nonce="${input.nonce}">
    :root {
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    .shell {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 24px;
    }

    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 24px;
      font-weight: 650;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
    }

    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) minmax(180px, 260px) auto;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
    }

    input,
    select,
    button {
      min-height: 32px;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      border-radius: 4px;
      font: inherit;
    }

    input,
    select {
      width: 100%;
      padding: 5px 9px;
    }

    input:focus,
    select:focus,
    button:focus,
    .plan-card:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    button {
      padding: 5px 10px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border-color: var(--vscode-button-border, transparent);
      cursor: pointer;
      white-space: nowrap;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .plan-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 172px;
      padding: 14px;
      color: var(--vscode-foreground);
      background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
    }

    .plan-card:hover {
      border-color: var(--vscode-focusBorder);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .card-title {
      margin: 0;
      font-size: 15px;
      font-weight: 650;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .badge {
      flex: 0 0 auto;
      padding: 2px 7px;
      border-radius: 999px;
      color: var(--vscode-badge-foreground);
      background: var(--vscode-badge-background);
      font-size: 11px;
      line-height: 1.5;
    }

    .overview {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: grid;
      gap: 4px;
      margin-top: auto;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .file-name {
      color: var(--vscode-textLink-foreground);
      overflow-wrap: anywhere;
    }

    .empty {
      padding: 28px;
      color: var(--vscode-descriptionForeground);
      border: 1px dashed var(--vscode-panel-border);
      border-radius: 8px;
      text-align: center;
    }

    @media (max-width: 720px) {
      .shell {
        padding: 16px;
      }

      .topbar {
        display: block;
      }

      .toolbar {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div>
        <h1>Plans Viewer</h1>
        <p class="subtitle">Browse Cursor plans from workspace <code>.cursor/plans</code> folders.</p>
      </div>
    </header>

    <section class="toolbar" aria-label="Plan filters">
      <input id="search" type="search" placeholder="Fuzzy search by title, overview, or filename" autocomplete="off">
      <select id="sort" aria-label="Sort plans">
        <option value="modifiedDesc">Last modified (newest)</option>
        <option value="modifiedAsc">Last modified (oldest)</option>
        <option value="titleAsc">Title (A-Z)</option>
        <option value="titleDesc">Title (Z-A)</option>
        <option value="fileNameAsc">Filename (A-Z)</option>
        <option value="fileNameDesc">Filename (Z-A)</option>
        <option value="projectFirst">Project plans first (isProject: true)</option>
      </select>
      <button id="refresh" type="button">Refresh</button>
    </section>

    <div class="meta-row">
      <span id="count"></span>
      <span>Click a card to open the plan.</span>
    </div>

    <section id="plans" class="grid" aria-live="polite"></section>
  </main>

  <script nonce="${input.nonce}">
    const vscode = acquireVsCodeApi();
    const plans = ${plansJson};
    const previousState = vscode.getState() || {};
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sort");
    const refreshButton = document.getElementById("refresh");
    const plansContainer = document.getElementById("plans");
    const count = document.getElementById("count");

    searchInput.value = previousState.query || "";
    sortSelect.value = previousState.sortKey || "modifiedDesc";

    searchInput.addEventListener("input", render);
    sortSelect.addEventListener("change", render);
    refreshButton.addEventListener("click", () => vscode.postMessage({ type: "refresh" }));

    render();

    function render() {
      const query = searchInput.value.trim();
      const sortKey = sortSelect.value;
      const visiblePlans = sortPlans(filterPlans(plans, query), sortKey);

      vscode.setState({ query, sortKey });
      count.textContent = formatCount(visiblePlans.length, plans.length);
      plansContainer.replaceChildren();

      if (visiblePlans.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = plans.length === 0
          ? "No plans found. Add .plan.md files under .cursor/plans in the workspace."
          : "No plans match the current search.";
        plansContainer.append(empty);
        return;
      }

      for (const plan of visiblePlans) {
        plansContainer.append(createPlanCard(plan));
      }
    }

    function createPlanCard(plan) {
      const card = document.createElement("article");
      card.className = "plan-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Open " + plan.title);

      const header = document.createElement("div");
      header.className = "card-header";

      const title = document.createElement("h2");
      title.className = "card-title";
      title.textContent = plan.title;
      header.append(title);

      if (plan.isProject) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "Project";
        header.append(badge);
      }

      const overview = document.createElement("p");
      overview.className = "overview";
      overview.textContent = plan.overview || "No overview provided.";

      const footer = document.createElement("footer");
      footer.className = "card-footer";

      const file = document.createElement("span");
      file.className = "file-name";
      file.textContent = plan.fileName;

      const meta = document.createElement("span");
      const todoLabel = plan.todoCount === 1 ? "1 todo" : plan.todoCount + " todos";
      meta.textContent = plan.workspaceName + " - " + todoLabel + " - " + formatDate(plan.modifiedAt);

      footer.append(file, meta);
      card.append(header, overview, footer);

      card.addEventListener("click", () => openPlan(plan.filePath));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPlan(plan.filePath);
        }
      });

      return card;
    }

    function openPlan(filePath) {
      vscode.postMessage({ type: "openPlan", filePath });
    }

    function formatCount(visible, total) {
      if (total === 0) {
        return "0 plans";
      }

      return visible === total ? total + " plans" : visible + " of " + total + " plans";
    }

    function formatDate(timestamp) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(timestamp));
    }

    function sortPlans(items, sortKey) {
      return [...items].sort((left, right) => {
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
    }

    function filterPlans(items, query) {
      if (!query) {
        return [...items];
      }

      return items
        .map((plan) => ({ plan, score: scorePlan(plan, query) }))
        .filter((result) => result.score > 0)
        .sort((left, right) => right.score - left.score || compareText(left.plan.title, right.plan.title))
        .map((result) => result.plan);
    }

    function scorePlan(plan, query) {
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

    function tokenize(value) {
      return normalizeForSearch(value).split(" ").filter(Boolean);
    }

    function matchScore(source, token) {
      const normalized = normalizeForSearch(source);
      const compactSource = normalized.replace(/\\s+/g, "");
      const compactToken = token.replace(/\\s+/g, "");
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

    function normalizeForSearch(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    function compareText(left, right) {
      return String(left).localeCompare(String(right), undefined, { sensitivity: "base", numeric: true });
    }
  </script>
</body>
</html>`;
}

function serializeForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
