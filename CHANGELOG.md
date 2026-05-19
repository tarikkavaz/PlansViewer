# Changelog

## 1.0.1

### Added

- Grid and list layout selector with 2, 3, or 4 column grid options.
- Toolbar codicons for search, sort, layout, and refresh.
- Keyboard shortcut to open Plans Viewer (`Ctrl+Alt+P` / `Cmd+Alt+P`).
- Debounced fuzzy search.
- “Projects only” filter for plans with `isProject: true`.
- Pagination with icon previous/next controls (shown only when needed).
- `plansViewer.pageSize` setting (`12`, `24`, `48`, or `96` cards per page; default `24`).
- Responsive grid that reduces columns on narrow panels.
- Card context menu: Open plan, Reveal in Explorer, Copy path.
- Auto-refresh when plan files are created, changed, or deleted.
- Incremental webview updates that preserve scroll position and toolbar state.

### Changed

- Card footer shows filename on the first line; date (left) and todo count (right) on the second line.
- Todo count is hidden when there are no todos.
- Multi-line Cursor `todos` frontmatter is parsed correctly (fixes “0 todos” on plans with tasks).

### Fixed

- Todo counts now reflect Cursor’s multi-line `todos:` blocks in plan frontmatter.

## 1.0.0

- Initial release.
- Searchable editor webview for Cursor `.cursor/plans/*.plan.md` files.
- Card view with plan title, overview, project badge, todo count, filename, workspace, and modified date.
- Sorting by modified date, title, filename, and `isProject: true`.
- Click-to-open support for plan markdown files.
- Status bar item showing the current plan count.
