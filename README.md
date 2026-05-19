# Plans Viewer

Plans Viewer opens Cursor project plans from `.cursor/plans/*.plan.md` in a searchable VS Code/Cursor editor tab.

## Features

- Opens plans in an editor webview (not a sidebar).
- Reads `.cursor/plans/*.plan.md` from each workspace root.
- Card layout with title, overview, project badge, filename, modified date, and todo count.
- **Grid or list layout** with 2, 3, or 4 column grid options.
- **Toolbar icons** (search, sort, layout, refresh) using VS Code codicons.
- **Fuzzy search** across title, overview, filename, heading, workspace name, and body (debounced).
- **Projects only** filter for plans with `isProject: true`.
- **Pagination** with chevron controls (shown only when results exceed the page size) and configurable page size (12, 24, 48, or 96 cards per page).
- **Responsive grid** that reduces columns on narrow panels.
- **Auto-refresh** when plan files are created, changed, or deleted (incremental update, preserves scroll and filters).
- **Context menu** on cards: Open plan, Reveal in Explorer, Copy path.
- Status bar item showing plan count (e.g. `33 Plans`).

## Usage

1. Open a workspace that contains `.cursor/plans/*.plan.md` files.
2. Run **Plans Viewer: Open Plans** from the command palette, click the status bar item, or use the keyboard shortcut:
   - Windows/Linux: `Ctrl+Alt+P`
   - macOS: `Cmd+Alt+P`
3. Search, sort, filter, and click a card to open the plan file. Right-click a card for more actions.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `plansViewer.pageSize` | Cards per page (`12`, `24`, `48`, or `96`) | `24` |

Open **Settings** and search for “Plans Viewer” to change page size.

## Plan Format

Plans live under:

```text
.cursor/plans/*.plan.md
```

Example:

```md
---
name: Appearance page and nav
overview: Rename the UI Showcase page to Appearance and move its route.
todos:
  - id: step-one
    content: Update routes
    status: pending
isProject: false
---

# Appearance Page and Navigation Changes

- Update routes and navigation.
```

Supported frontmatter fields:

- `name` — card title
- `overview` — card summary
- `todos` — multi-line list with `- id:` entries (counted on the card footer)
- `isProject` — when `true`, shows a Project badge and works with the “Projects only” filter

Card footer layout:

```text
filename.plan.md
19 May 2026, 13:17          3 todos
```

Todo count is hidden when zero.

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

After code changes, run **Developer: Reload Window** in the development host.

## Build and Package

```bash
pnpm run package
```

This runs tests, compiles, and creates a `.vsix` package.

Install the VSIX:

```bash
cursor --install-extension plans-viewer-1.0.1.vsix
```

See [CHANGELOG.md](CHANGELOG.md) for release notes.
