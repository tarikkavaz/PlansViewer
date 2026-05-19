import test from "node:test";
import assert from "node:assert/strict";
import { renderPlansWebviewHtml } from "../src/webviewHtml";
import type { PlanItem } from "../src/planModel";

test("renderPlansWebviewHtml embeds plan data and editor controls", () => {
  const plans: PlanItem[] = [
    {
      id: "/repo/.cursor/plans/appearance.plan.md",
      title: "Appearance page and nav",
      overview: "Move route to appearance",
      bodyTitle: "Appearance",
      fileName: "appearance.plan.md",
      filePath: "/repo/.cursor/plans/appearance.plan.md",
      workspaceName: "repo",
      modifiedAt: 1_700_000_000_000,
      isProject: false,
      todoCount: 3,
      searchText: "Header.tsx Profile.tsx App.tsx"
    }
  ];

  const html = renderPlansWebviewHtml({
    plans,
    nonce: "abc123",
    cspSource: "vscode-resource:"
  });

  assert.match(html, /Plans Viewer/);
  assert.match(html, /id="search"/);
  assert.match(html, /id="sort"/);
  assert.match(html, /Last modified \(newest\)/);
  assert.match(html, /Appearance page and nav/);
  assert.match(html, /todoCount/);
  assert.match(html, /openPlan/);
  assert.match(html, /nonce="abc123"/);
  assert.doesNotMatch(html, /<script>[^<]/);
});
