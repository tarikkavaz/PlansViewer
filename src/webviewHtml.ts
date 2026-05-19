export interface RenderPlansWebviewShellInput {
  nonce: string;
  cspSource: string;
  codiconsUri: string;
}

/** @deprecated Use renderPlansWebviewShell */
export function renderPlansWebviewHtml(input: RenderPlansWebviewShellInput & { plans?: unknown }): string {
  return renderPlansWebviewShell(input);
}

export function renderPlansWebviewShell(input: RenderPlansWebviewShellInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${input.nonce}' ${input.cspSource}; script-src 'nonce-${input.nonce}'; font-src ${input.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plans Viewer</title>
  <link rel="stylesheet" href="${input.codiconsUri}">
  <style nonce="${input.nonce}">
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .shell { width: min(1180px, 100%); margin: 0 auto; padding: 24px; }
    .topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    h1 { margin: 0 0 6px; font-size: 24px; font-weight: 650; }
    .subtitle { margin: 0; color: var(--vscode-descriptionForeground); line-height: 1.5; }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(200px, 1fr) minmax(150px, 200px) minmax(130px, 170px) auto;
      gap: 10px; align-items: center; margin-bottom: 10px;
    }
    .toolbar-filters {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      margin-bottom: 14px; font-size: 12px; color: var(--vscode-descriptionForeground);
    }
    .project-only {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;
    }
    .project-only input { width: auto; min-height: unset; margin: 0; cursor: pointer; }
    input, select, button {
      min-height: 32px; color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      border-radius: 4px; font: inherit;
    }
    .toolbar-field {
      display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 32px;
      padding: 0 8px; color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      border-radius: 4px;
    }
    .toolbar-field:focus-within { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    .toolbar-field input, .toolbar-field select {
      flex: 1 1 auto; min-width: 0; width: 100%; padding: 5px 0; border: none; background: transparent;
    }
    .toolbar-field input:focus, .toolbar-field select:focus { outline: none; }
    .toolbar-icon { flex: 0 0 auto; color: var(--vscode-descriptionForeground); }
    button {
      display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px;
      color: var(--vscode-button-foreground); background: var(--vscode-button-background);
      border-color: var(--vscode-button-border, transparent); cursor: pointer; white-space: nowrap;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button:disabled { opacity: 0.5; cursor: default; }
    button:focus, .plan-card:focus { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    .meta-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      margin-bottom: 8px; color: var(--vscode-descriptionForeground); font-size: 12px;
    }
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 12px; font-size: 12px; color: var(--vscode-descriptionForeground);
    }
    .pagination[hidden] { display: none; }
    .pagination-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; min-height: 24px; padding: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      border-radius: 4px; cursor: pointer;
    }
    .pagination-btn:hover:not(:disabled) {
      background: var(--vscode-list-hoverBackground);
    }
    .pagination-btn:disabled {
      opacity: 0.35; cursor: default;
    }
    .grid { display: grid; gap: 12px; }
    .grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 900px) {
      .grid.cols-3, .grid.cols-4 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .grid.cols-2, .grid.cols-3, .grid.cols-4 { grid-template-columns: 1fr; }
    }
    .list-view { display: flex; flex-direction: column; gap: 8px; }
    .list-view .plan-card { min-height: unset; flex-direction: row; align-items: center; gap: 16px; }
    .list-view .card-header { flex: 1 1 200px; min-width: 0; }
    .list-view .overview { flex: 2 1 280px; -webkit-line-clamp: 1; }
    .list-view .card-footer { flex: 0 0 auto; margin-top: 0; }
    .plan-card {
      display: flex; flex-direction: column; gap: 10px; min-height: 172px; padding: 14px;
      color: var(--vscode-foreground);
      background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
      border: 1px solid var(--vscode-panel-border); border-radius: 8px; cursor: pointer; text-align: left;
    }
    .plan-card:hover { border-color: var(--vscode-focusBorder); }
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .card-title { margin: 0; font-size: 15px; font-weight: 650; line-height: 1.35; overflow-wrap: anywhere; }
    .badge {
      flex: 0 0 auto; padding: 2px 7px; border-radius: 999px;
      color: var(--vscode-badge-foreground); background: var(--vscode-badge-background);
      font-size: 11px; line-height: 1.5;
    }
    .overview {
      margin: 0; color: var(--vscode-descriptionForeground); line-height: 1.45;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .card-footer {
      display: grid; gap: 4px; margin-top: auto;
      color: var(--vscode-descriptionForeground); font-size: 12px;
    }
    .file-name { color: var(--vscode-textLink-foreground); overflow-wrap: anywhere; }
    .card-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .card-date { flex: 0 1 auto; min-width: 0; }
    .card-todos { flex: 0 0 auto; margin-left: auto; white-space: nowrap; text-align: right; }
    .empty {
      padding: 28px; color: var(--vscode-descriptionForeground);
      border: 1px dashed var(--vscode-panel-border); border-radius: 8px; text-align: center;
    }
    .context-menu {
      position: fixed; z-index: 1000; min-width: 180px; padding: 4px 0;
      background: var(--vscode-menu-background, var(--vscode-editorWidget-background));
      border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
      border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .context-menu[hidden] { display: none; }
    .context-menu button {
      display: flex; align-items: center; gap: 8px; width: 100%; min-height: 28px;
      padding: 4px 12px; border: none; border-radius: 0; background: transparent;
      color: var(--vscode-menu-foreground, var(--vscode-foreground)); text-align: left;
    }
    .context-menu button:hover {
      background: var(--vscode-menu-selectionBackground, var(--vscode-list-hoverBackground));
      color: var(--vscode-menu-selectionForeground, var(--vscode-foreground));
    }
    @media (max-width: 720px) {
      .shell { padding: 16px; }
      .topbar { display: block; }
      .toolbar { grid-template-columns: 1fr; }
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
      <label class="toolbar-field">
        <span class="codicon codicon-search toolbar-icon" aria-hidden="true"></span>
        <input id="search" type="search" placeholder="Fuzzy search by title, overview, or filename" autocomplete="off">
      </label>
      <label class="toolbar-field">
        <span class="codicon codicon-sort-precedence toolbar-icon" aria-hidden="true"></span>
        <select id="sort" aria-label="Sort plans">
          <option value="modifiedDesc">Last modified (newest)</option>
          <option value="modifiedAsc">Last modified (oldest)</option>
          <option value="titleAsc">Title (A-Z)</option>
          <option value="titleDesc">Title (Z-A)</option>
          <option value="fileNameAsc">Filename (A-Z)</option>
          <option value="fileNameDesc">Filename (Z-A)</option>
          <option value="projectFirst">Project plans first (isProject: true)</option>
        </select>
      </label>
      <label class="toolbar-field">
        <span class="codicon codicon-layout toolbar-icon" aria-hidden="true"></span>
        <select id="layout" aria-label="Layout">
          <option value="grid-2">Grid (2 columns)</option>
          <option value="grid-3" selected>Grid (3 columns)</option>
          <option value="grid-4">Grid (4 columns)</option>
          <option value="list">List view</option>
        </select>
      </label>
      <button id="refresh" type="button">
        <span class="codicon codicon-refresh" aria-hidden="true"></span>
        Refresh
      </button>
    </section>
    <div class="toolbar-filters">
      <label class="project-only">
        <input id="projectOnly" type="checkbox">
        <span>Projects only</span>
      </label>
    </div>
    <div class="meta-row">
      <span id="count"></span>
      <span>Click a card to open the plan. Right-click for more actions.</span>
    </div>
    <nav class="pagination" id="pagination" aria-label="Plan pages" hidden>
      <button id="prevPage" type="button" class="pagination-btn" aria-label="Previous page" disabled>
        <span class="codicon codicon-chevron-left" aria-hidden="true"></span>
      </button>
      <span id="pageInfo"></span>
      <button id="nextPage" type="button" class="pagination-btn" aria-label="Next page" disabled>
        <span class="codicon codicon-chevron-right" aria-hidden="true"></span>
      </button>
    </nav>
    <section id="plans" class="grid cols-3" aria-live="polite"></section>
  </main>
  <div id="contextMenu" class="context-menu" role="menu" hidden></div>
  <script nonce="${input.nonce}">
    const vscode = acquireVsCodeApi();
    let plans = [];
    let pageSize = 24;
    let currentPage = 1;
    let searchDebounceTimer;
    const previousState = vscode.getState() || {};
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sort");
    const layoutSelect = document.getElementById("layout");
    const projectOnlyInput = document.getElementById("projectOnly");
    const refreshButton = document.getElementById("refresh");
    const plansContainer = document.getElementById("plans");
    const count = document.getElementById("count");
    const pagination = document.getElementById("pagination");
    const prevPageButton = document.getElementById("prevPage");
    const nextPageButton = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");
    const contextMenu = document.getElementById("contextMenu");
    let contextMenuPlan = null;

    searchInput.value = previousState.query || "";
    sortSelect.value = previousState.sortKey || "modifiedDesc";
    layoutSelect.value = resolveLayout(previousState);
    projectOnlyInput.checked = Boolean(previousState.projectOnly);
    currentPage = previousState.currentPage || 1;

    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => render({ resetPage: true }), 250);
    });
    searchInput.addEventListener("change", () => render({ resetPage: true }));
    sortSelect.addEventListener("change", () => render({ resetPage: true }));
    layoutSelect.addEventListener("change", () => render({ resetPage: true }));
    projectOnlyInput.addEventListener("change", () => render({ resetPage: true }));
    refreshButton.addEventListener("click", () => vscode.postMessage({ type: "refresh" }));
    prevPageButton.addEventListener("click", () => { currentPage -= 1; render(); });
    nextPageButton.addEventListener("click", () => { currentPage += 1; render(); });

    document.addEventListener("click", () => hideContextMenu());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hideContextMenu();
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "updatePlans") {
        plans = message.plans || [];
        if (message.pageSize) pageSize = message.pageSize;
        render();
        return;
      }
      if (message.type === "configUpdated" && message.pageSize) {
        pageSize = message.pageSize;
        render({ resetPage: true });
      }
    });

    vscode.postMessage({ type: "ready" });

    function render(options) {
      const resetPage = options && options.resetPage;
      if (resetPage) currentPage = 1;

      const query = searchInput.value.trim();
      const sortKey = sortSelect.value;
      const layout = layoutSelect.value;
      let filtered = filterPlans(plans, query);
      if (projectOnlyInput.checked) filtered = filtered.filter((plan) => plan.isProject);
      const sorted = sortPlans(filtered, sortKey);
      const paginated = paginate(sorted, currentPage, pageSize);
      currentPage = paginated.page;

      vscode.setState({
        query, sortKey, layout,
        projectOnly: projectOnlyInput.checked,
        currentPage
      });

      count.textContent = formatCount(sorted.length, plans.length, paginated);
      updatePagination(paginated, sorted.length);
      plansContainer.className = layout === "list" ? "list-view" : "grid cols-" + layout.slice(5);
      plansContainer.replaceChildren();

      if (sorted.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = plans.length === 0
          ? "No plans found. Add .plan.md files under .cursor/plans in the workspace."
          : "No plans match the current filters.";
        plansContainer.append(empty);
        return;
      }

      for (const plan of paginated.items) {
        plansContainer.append(createPlanCard(plan));
      }
    }

    function updatePagination(paginated, total) {
      if (total === 0 || paginated.pageCount <= 1) {
        pagination.hidden = true;
        return;
      }
      pagination.hidden = false;
      pageInfo.textContent = "Page " + paginated.page + " of " + paginated.pageCount + " (" + total + " plans)";
      prevPageButton.disabled = paginated.page <= 1;
      nextPageButton.disabled = paginated.page >= paginated.pageCount;
    }

    function paginate(items, page, size) {
      const pageCount = Math.max(1, Math.ceil(items.length / size));
      const safePage = Math.min(Math.max(1, page), pageCount);
      const start = (safePage - 1) * size;
      return { page: safePage, pageCount, items: items.slice(start, start + size) };
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
      const metaRow = document.createElement("div");
      metaRow.className = "card-footer-row";
      const date = document.createElement("span");
      date.className = "card-date";
      date.textContent = formatDate(plan.modifiedAt);
      metaRow.append(date);
      if (plan.todoCount > 0) {
        const todos = document.createElement("span");
        todos.className = "card-todos";
        todos.textContent = plan.todoCount === 1 ? "1 todo" : plan.todoCount + " todos";
        metaRow.append(todos);
      }
      footer.append(file, metaRow);
      card.append(header, overview, footer);

      card.addEventListener("click", () => openPlan(plan.filePath));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPlan(plan.filePath);
        }
      });
      card.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showContextMenu(event, plan);
      });
      return card;
    }

    function showContextMenu(event, plan) {
      contextMenuPlan = plan;
      contextMenu.replaceChildren();
      contextMenu.append(
        createMenuItem("codicon-go-to-file", "Open plan", () => openPlan(plan.filePath)),
        createMenuItem("codicon-folder-opened", "Reveal in Explorer", () => {
          vscode.postMessage({ type: "revealInExplorer", filePath: plan.filePath });
        }),
        createMenuItem("codicon-copy", "Copy path", () => {
          vscode.postMessage({ type: "copyPath", filePath: plan.filePath });
        })
      );
      contextMenu.hidden = false;
      const menuWidth = 180;
      const menuHeight = 100;
      let left = event.clientX;
      let top = event.clientY;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth;
      if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight;
      contextMenu.style.left = left + "px";
      contextMenu.style.top = top + "px";
    }

    function createMenuItem(iconClass, label, action) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.innerHTML = '<span class="codicon ' + iconClass + '" aria-hidden="true"></span>' + label;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        hideContextMenu();
        action();
      });
      return button;
    }

    function hideContextMenu() {
      contextMenu.hidden = true;
      contextMenuPlan = null;
    }

    function openPlan(filePath) {
      vscode.postMessage({ type: "openPlan", filePath });
    }

    function resolveLayout(state) {
      if (state.layout && ["grid-2", "grid-3", "grid-4", "list"].includes(state.layout)) return state.layout;
      if (state.viewMode === "list") return "list";
      return "grid-" + (state.gridColumns || "3");
    }

    function formatCount(filtered, total, paginated) {
      if (total === 0) return "0 plans";
      let text = filtered === total ? total + " plans" : filtered + " of " + total + " plans";
      if (paginated.pageCount > 1) text += " (page " + paginated.page + "/" + paginated.pageCount + ")";
      return text;
    }

    function formatDate(timestamp) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
    }

    function sortPlans(items, sortKey) {
      return [...items].sort((left, right) => {
        switch (sortKey) {
          case "modifiedAsc": return left.modifiedAt - right.modifiedAt || compareText(left.title, right.title);
          case "titleAsc": return compareText(left.title, right.title) || compareText(left.fileName, right.fileName);
          case "titleDesc": return compareText(right.title, left.title) || compareText(left.fileName, right.fileName);
          case "fileNameAsc": return compareText(left.fileName, right.fileName) || compareText(left.title, right.title);
          case "fileNameDesc": return compareText(right.fileName, left.fileName) || compareText(left.title, right.title);
          case "projectFirst": return Number(right.isProject) - Number(left.isProject) || right.modifiedAt - left.modifiedAt;
          default: return right.modifiedAt - left.modifiedAt || compareText(left.title, right.title);
        }
      });
    }

    function filterPlans(items, query) {
      if (!query) return [...items];
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
        const tokenScore = Math.max(...haystacks.map((h) => matchScore(h, token)));
        if (tokenScore <= 0) return 0;
        score += tokenScore;
      }
      return score;
    }

    function tokenize(value) { return normalizeForSearch(value).split(" ").filter(Boolean); }

    function matchScore(source, token) {
      const normalized = normalizeForSearch(source);
      const compactSource = normalized.replace(/\\s+/g, "");
      const compactToken = token.replace(/\\s+/g, "");
      const exactIndex = normalized.indexOf(token);
      if (exactIndex >= 0) return 1000 - exactIndex;
      if (compactToken.length >= 3 && compactSource.includes(compactToken)) return 700;
      if (normalized.split(" ").some((word) => word.startsWith(token))) return 500;
      return 0;
    }

    function normalizeForSearch(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\\s+/g, " ").trim();
    }

    function compareText(left, right) {
      return String(left).localeCompare(String(right), undefined, { sensitivity: "base", numeric: true });
    }
  </script>
</body>
</html>`;
}
