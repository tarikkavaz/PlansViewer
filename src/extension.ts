import * as vscode from "vscode";
import { discoverPlans } from "./planDiscovery";
import type { PlanItem } from "./planModel";
import { renderPlansWebviewHtml } from "./webviewHtml";

interface PlansViewerMessage {
  type: "openPlan" | "refresh";
  filePath?: string;
}

let currentPanel: vscode.WebviewPanel | undefined;
let currentPlanPaths = new Set<string>();

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("plansViewer.openPlans", async () => {
      await openPlansViewer(context);
    })
  );
}

export function deactivate(): void {
  currentPanel = undefined;
  currentPlanPaths = new Set();
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
    async (message: PlansViewerMessage) => {
      if (message.type === "refresh") {
        await refreshPanel(panel);
        return;
      }

      if (message.type === "openPlan" && message.filePath) {
        await openPlanFile(message.filePath);
      }
    },
    undefined,
    context.subscriptions
  );

  await refreshPanel(panel);
}

async function refreshPanel(panel: vscode.WebviewPanel): Promise<void> {
  try {
    const plans = await loadPlans();
    currentPlanPaths = new Set(plans.map((plan) => plan.filePath));
    panel.webview.html = renderPlansWebviewHtml({
      plans,
      nonce: getNonce(),
      cspSource: panel.webview.cspSource
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Plans Viewer: ${message}`);
  }
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

function getNonce(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for (let index = 0; index < 32; index += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
