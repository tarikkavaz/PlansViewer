# Plans Viewer

Plans Viewer opens Cursor project plans from `.cursor/plans/*.plan.md` in a searchable VS Code/Cursor editor tab.

## Features

- Opens plans in an editor webview, not a sidebar.
- Reads `.cursor/plans/*.plan.md` from each workspace root.
- Shows plan frontmatter metadata in cards.
- Searches plan name, overview, filename, heading, and markdown body content.
- Sorts by modified date, title, filename, or `isProject: true` first.
- Opens the underlying markdown plan when a card is clicked.

## Usage

1. Open a workspace that contains `.cursor/plans/*.plan.md` files.
2. Run `Plans Viewer: Open Plans` from the command palette.
3. Search, sort, and click a card to open the plan file.

## Development

```bash
pnpm install
pnpm run compile
```

Run in Cursor against a project:

```bash
cursor --extensionDevelopmentPath="/path/to/PlansViewer" "/path/to/project"
```

Package locally:

```bash
pnpm run package
```
