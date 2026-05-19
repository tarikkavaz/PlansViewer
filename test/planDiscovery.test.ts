import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { discoverPlans } from "../src/planDiscovery";

test("discoverPlans reads root .cursor/plans plan markdown files", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "plans-viewer-"));

  try {
    await mkdir(join(workspaceRoot, ".cursor", "plans"), { recursive: true });
    await mkdir(join(workspaceRoot, "nested", ".cursor", "plans"), { recursive: true });
    await writeFile(
      join(workspaceRoot, ".cursor", "plans", "alpha.plan.md"),
      "---\nname: Alpha Plan\noverview: First plan\nisProject: true\n---\n\n# Alpha\n",
      "utf8"
    );
    await writeFile(
      join(workspaceRoot, ".cursor", "plans", "notes.md"),
      "# Not a plan\n",
      "utf8"
    );
    await writeFile(
      join(workspaceRoot, "nested", ".cursor", "plans", "nested.plan.md"),
      "---\nname: Nested Plan\n---\n",
      "utf8"
    );

    const plans = await discoverPlans([{ name: "demo", rootPath: workspaceRoot }]);

    assert.equal(plans.length, 1);
    assert.equal(plans[0]?.title, "Alpha Plan");
    assert.equal(plans[0]?.workspaceName, "demo");
    assert.equal(plans[0]?.fileName, "alpha.plan.md");
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
