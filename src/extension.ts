import * as vscode from "vscode";
import { discoverPlans } from "./planDiscovery";
import { formatPlansStatusText, type PlanItem } from "./planModel";
import { renderPlansWebviewShell } from "./webviewHtml";

type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "refresh" }
  | { type: "openPlan"; filePath: string }
  | { type: "revealInExplorer"; filePath: string }
  | { type: "copyPath"; filePath: string };

let currentPanel: vscode.WebviewPanel | undefined;
let currentPlanPaths = new Set<string>();
let statusBarItem: vscode.StatusBarItem | undefined;
let refreshPanelTimer: ReturnType<typeof setTimeout> | undefined;
let extensionUri: vscode.Uri;

const htmlInitializedPanels = new WeakSet<vscode.WebviewPanel>();
const readyPanels = new WeakSet<vscode.WebviewPanel>();

export function activate(context: vscode.ExtensionContext): void {
  extensionUri = context.extensionUri;
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "plansViewer.openPlans";
  statusBarItem.name = "Plans Viewer";
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand("plansViewer.openPlans", async () => {
      await openPlansViewer(context);
    })
  );

  const watcher = vscode.workspace.createFileSystemWatcher("**/.cursor/plans/*.plan.md");
  watcher.onDidCreate(() => onPlansChanged(false), undefined, context.subscriptions);
  watcher.onDidChange(() => onPlansChanged(true), undefined, context.subscriptions);
  watcher.onDidDelete(() => onPlansChanged(false), undefined, context.subscriptions);
  context.subscriptions.push(watcher);

  vscode.workspace.onDidChangeWorkspaceFolders(() => onPlansChanged(false), undefined, context.subscriptions);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("plansViewer.pageSize") && currentPanel) {
        pushConfigToPanel(currentPanel);
      }
    })
  );

  void updateStatusBar();
}

export function deactivate(): void {
  if (refreshPanelTimer) {
    clearTimeout(refreshPanelTimer);
    refreshPanelTimer = undefined;
  }

  currentPanel = undefined;
  currentPlanPaths = new Set();
  statusBarItem = undefined;
}

function getPageSize(): number {
  const value = vscode.workspace.getConfiguration("plansViewer").get<string>("pageSize", "24");
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

function onPlansChanged(debounce: boolean): void {
  void updateStatusBar();

  if (debounce) {
    if (refreshPanelTimer) {
      clearTimeout(refreshPanelTimer);
    }

    refreshPanelTimer = setTimeout(() => {
      refreshPanelTimer = undefined;
      void refreshOpenPanel();
    }, 300);
    return;
  }

  if (refreshPanelTimer) {
    clearTimeout(refreshPanelTimer);
    refreshPanelTimer = undefined;
  }

  void refreshOpenPanel();
}

async function refreshOpenPanel(): Promise<void> {
  if (currentPanel) {
    await refreshPanel(currentPanel);
  }
}

async function openPlansViewer(context: vscode.ExtensionContext): Promise<void> {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Active);
    await refreshPanel(currentPanel);
    return;
  }

  const panel = vscode.window.createWebviewPanel("plansViewer", "Plans Viewer", vscode.ViewColumn.Active, {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [context.extensionUri]
  });

  currentPanel = panel;

  panel.onDidDispose(
    () => {
      currentPanel = undefined;
      currentPlanPaths = new Set();
    },
    undefined,
    context.subscriptions
  );

  panel.webview.onDidReceiveMessage(
    async (message: WebviewToExtensionMessage) => {
      if (message.type === "ready") {
        readyPanels.add(panel);
        await pushPlansUpdate(panel);
        return;
      }

      if (message.type === "refresh") {
        await refreshPanel(panel);
        return;
      }

      if (message.type === "openPlan" && message.filePath) {
        await openPlanFile(message.filePath);
        return;
      }

      if (message.type === "revealInExplorer" && message.filePath) {
        await revealPlanInExplorer(message.filePath);
        return;
      }

      if (message.type === "copyPath" && message.filePath) {
        await vscode.env.clipboard.writeText(message.filePath);
      }
    },
    undefined,
    context.subscriptions
  );

  await refreshPanel(panel);
}

async function ensurePanelHtml(panel: vscode.WebviewPanel): Promise<void> {
  if (htmlInitializedPanels.has(panel)) {
    return;
  }

  panel.webview.html = renderPlansWebviewShell({
    nonce: getNonce(),
    cspSource: panel.webview.cspSource,
    codiconsUri: panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "codicons", "codicon.css"))
      .toString()
  });
  htmlInitializedPanels.add(panel);
}

function pushPlansToPanel(panel: vscode.WebviewPanel, plans: readonly PlanItem[]): void {
  panel.webview.postMessage({
    type: "updatePlans",
    plans,
    pageSize: getPageSize()
  });
}

function pushConfigToPanel(panel: vscode.WebviewPanel): void {
  panel.webview.postMessage({
    type: "configUpdated",
    pageSize: getPageSize()
  });
}

async function pushPlansUpdate(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const plans = await loadPlans();
    currentPlanPaths = new Set(plans.map((plan) => plan.filePath));
    updateStatusBarWithPlans(plans);
    pushPlansToPanel(panel, plans);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Plans Viewer: ${message}`);
  }
}

async function refreshPanel(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const plans = await loadPlans();
    currentPlanPaths = new Set(plans.map((plan) => plan.filePath));
    updateStatusBarWithPlans(plans);
    await ensurePanelHtml(panel);

    if (readyPanels.has(panel)) {
      pushPlansToPanel(panel, plans);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Plans Viewer: ${message}`);
  }
}

async function updateStatusBar(): Promise<void> {
  if (!statusBarItem) {
    return;
  }

  try {
    updateStatusBarWithPlans(await loadPlans());
  } catch {
    statusBarItem.hide();
  }
}

function updateStatusBarWithPlans(plans: readonly PlanItem[]): void {
  if (!statusBarItem) {
    return;
  }

  if (plans.length === 0) {
    statusBarItem.hide();
    return;
  }

  statusBarItem.text = formatPlansStatusText(plans.length);
  statusBarItem.tooltip = "Open Cursor plans";
  statusBarItem.show();
}

async function loadPlans(): Promise<PlanItem[]> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const fileSystemFolders = folders.filter((folder) => folder.uri.scheme === "file");

  return discoverPlans(
    fileSystemFolders.map((folder) => ({
      name: folder.name,
      rootPath: folder.uri.fsPath
    }))
  );
}

async function openPlanFile(filePath: string): Promise<void> {
  if (!currentPlanPaths.has(filePath)) {
    void vscode.window.showErrorMessage("Plans Viewer: that plan is no longer available. Refresh the viewer and try again.");
    return;
  }

  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Active
  });
}

async function revealPlanInExplorer(filePath: string): Promise<void> {
  if (!currentPlanPaths.has(filePath)) {
    void vscode.window.showErrorMessage("Plans Viewer: that plan is no longer available. Refresh the viewer and try again.");
    return;
  }

  await vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(filePath));
}

function getNonce(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for (let index = 0; index < 32; index += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
