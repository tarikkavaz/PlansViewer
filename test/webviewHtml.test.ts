import test from "node:test";
import assert from "node:assert/strict";
import { renderPlansWebviewShell } from "../src/webviewHtml";

test("renderPlansWebviewShell embeds controls and incremental refresh protocol", () => {
  const html = renderPlansWebviewShell({
    nonce: "abc123",
    cspSource: "vscode-resource:",
    codiconsUri: "vscode-resource:/media/codicons/codicon.css"
  });

  assert.match(html, /Plans Viewer/);
  assert.match(html, /codicon-search/);
  assert.match(html, /codicon-sort-precedence/);
  assert.match(html, /codicon-layout/);
  assert.match(html, /codicon-refresh/);
  assert.match(html, /id="search"/);
  assert.match(html, /id="sort"/);
  assert.match(html, /id="layout"/);
  assert.match(html, /id="projectOnly"/);
  assert.match(html, /Projects only/);
  assert.match(html, /id="pagination"/);
  assert.match(html, /id="prevPage"/);
  assert.match(html, /id="nextPage"/);
  assert.match(html, /codicon-chevron-left/);
  assert.match(html, /codicon-chevron-right/);
  assert.match(html, /pagination-btn/);
  assert.match(html, /pagination\[hidden\]/);
  assert.match(html, /id="contextMenu"/);
  assert.match(html, /revealInExplorer/);
  assert.match(html, /copyPath/);
  assert.match(html, /type: "ready"/);
  assert.match(html, /updatePlans/);
  assert.match(html, /configUpdated/);
  assert.match(html, /searchDebounceTimer/);
  assert.match(html, /Grid \(2 columns\)/);
  assert.match(html, /List view/);
  assert.match(html, /cols-2/);
  assert.match(html, /list-view/);
  assert.match(html, /max-width: 900px/);
  assert.match(html, /max-width: 560px/);
  assert.match(html, /let plans = \[\]/);
  assert.match(html, /nonce="abc123"/);
  assert.doesNotMatch(html, /plan\.workspaceName \+ " - "/);
  assert.doesNotMatch(html, /<script>[^<]/);
});
