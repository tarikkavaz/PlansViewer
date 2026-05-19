import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parsePlanDocument, type PlanItem } from "./planModel";

export interface WorkspaceRoot {
  name: string;
  rootPath: string;
}

export async function discoverPlans(workspaces: readonly WorkspaceRoot[]): Promise<PlanItem[]> {
  const planGroups = await Promise.all(workspaces.map((workspace) => discoverWorkspacePlans(workspace)));
  return planGroups.flat();
}

async function discoverWorkspacePlans(workspace: WorkspaceRoot): Promise<PlanItem[]> {
  const plansDirectory = join(workspace.rootPath, ".cursor", "plans");
  let entries: string[];

  try {
    entries = await readdir(plansDirectory);
  } catch {
    return [];
  }

  const planFiles = entries.filter((entry) => entry.endsWith(".plan.md"));
  const plans = await Promise.all(
    planFiles.map(async (fileName) => {
      const filePath = join(plansDirectory, fileName);
      const [content, stats] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);

      return parsePlanDocument({
        content,
        fileName,
        filePath,
        workspaceName: workspace.name,
        modifiedAt: stats.mtimeMs
      });
    })
  );

  return plans;
}
