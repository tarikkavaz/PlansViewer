# Plans Viewer

Plans Viewer opens Cursor project plans from `.cursor/plans/*.plan.md` in a searchable VS Code/Cursor editor tab.

## Features

- Opens plans in an editor webview, not a sidebar.
- Reads `.cursor/plans/*.plan.md` from each workspace root.
- Shows each plan as a card with title, overview, project badge, todo count, filename, workspace, and modified date.
- Searches plan name, overview, filename, first heading, workspace name, and markdown body content.
- Sorts by modified date, title, filename, or `isProject: true` first.
- Opens the underlying markdown plan when a card is clicked.
- Adds a clickable status bar item on the right side showing the current plan count, such as `33 Plans`.
- Refreshes the status bar count when plan files are created, changed, or deleted.

## Usage

1. Open a workspace that contains `.cursor/plans/*.plan.md` files.
2. Run `Plans Viewer: Open Plans` from the command palette.
3. Search, sort, and click a card to open the plan file.

You can also click the status bar item, for example `33 Plans`, to open the Plans Viewer editor tab.

## Plan Format

Plans Viewer expects Cursor plan files under:

```text
.cursor/plans/*.plan.md
```

Example:

```md
---
name: Appearance page and nav
overview: Rename the UI Showcase page to Appearance and move its route.
todos: []
isProject: false
---

# Appearance Page and Navigation Changes

- Update routes and navigation.
```

Supported frontmatter fields:

- `name`: used as the card title.
- `overview`: used as the card summary.
- `todos`: counted when represented as a simple array.
- `isProject`: when `true`, the plan can be sorted before non-project plans.

## Development

```bash
pnpm install
pnpm run compile
```

Run tests:

```bash
pnpm run test
```

Watch TypeScript changes:

```bash
pnpm run watch
```

Run in Cursor against a project:

```bash
cursor --extensionDevelopmentPath="/path/to/PlansViewer" "/path/to/project"
```

For example:

```bash
cursor --extensionDevelopmentPath="/Users/yourname/Work/PlansViewer" "/Users/yourname/Work/Some-Project"
```

After code changes, run `Developer: Reload Window` in the Cursor development window.

## Build and Package

Package locally:

```bash
pnpm run package
```

This runs tests, compiles the extension, and creates a `.vsix` package.

Manual release build:

```bash
pnpm run test
pnpm exec vsce package --no-dependencies
```

Use the manual path when you want to run verification and packaging as separate steps. `--no-dependencies` is safe for the current extension because it has no runtime dependencies.

Install the generated VSIX in Cursor:

```bash
cursor --install-extension plans-viewer-1.0.0.vsix
```

Install the generated VSIX in VS Code:

```bash
code --install-extension plans-viewer-1.0.0.vsix
```
