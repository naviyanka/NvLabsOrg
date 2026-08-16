# Round 2 Sprint Execution Plan

All Round 2 features organized into 3 sprints by effort and dependency.

---

## Sprint 7: Quick Fixes (1-2 days)
*Finish half-built features and quick polish. Highest ROI per hour spent.*

| Order | Plan | Time | What |
|-------|------|------|------|
| 1 | A1 | 1h | Clear Agent Memory — wire disabled button |
| 2 | A2 | 1h | Reset All Settings — wire disabled button |
| 3 | A7 | 1h | Model Override Fix — actually use stored value in TG |
| 4 | A4 | 1h | Dashboard Auto-Refresh — verify reactivity |
| 5 | B5 | 30m | Persist View Mode — localStorage save/restore |
| 6 | B1 | 3h | Onboarding / Empty State — Get Started card |

**Total: ~8 hours**

---

## Sprint 8: Connect & Polish (3-5 days)
*Wire features together and improve UX.*

| Order | Plan | Time | What |
|-------|------|------|------|
| 7 | A3 | 3h | Pipeline Completion Watcher — auto-advance steps |
| 8 | A5 | 2h | File Explorer Lazy Dirs — expand on click |
| 9 | C2 | 3h | GitHub Settings UI — token + remote in Settings |
| 10 | B2 | 2h | Theme Selector in Settings — visual swatches |
| 11 | A6 | 4h | REST API Expansion — 15+ new endpoints |
| 12 | C3 | 4h | Diff Viewer — inline diff in Git Panel |

**Total: ~18 hours (3-4 days)**

---

## Sprint 9: Strategic Features (1-2 weeks)
*Larger new capabilities.*

| Order | Plan | Time | What |
|-------|------|------|------|
| 13 | C1 | 1d | Pipeline Builder UI — visual step editor |
| 14 | B3 | 2h | Agent Context Menu — right-click actions |
| 15 | B4 | 2h | Toast Notifications — slide-up alerts |
| 16 | B6 | 2h | Loading States — skeleton loaders |
| 17 | B7 | 2h | Error Boundaries — crash isolation |
| 18 | B8 | 4h | Mobile Responsive — fix overflow on small screens |

**Total: ~2 days**

---

## Dependency Graph

```
A1, A2, A7, A4, B5  (standalone — no dependencies)
       │
       ▼
B1 (onboarding — after A1/A2 since buttons reference those features)
       │
       ▼
A3 (pipeline watcher — builds on RUN_PIPELINE from Sprint 6)
A5 (lazy dirs — builds on LIST_FILES from Sprint 5)
C2 (github UI — builds on PUSH_BRANCH/CREATE_PR from Sprint 6)
B2 (theme — standalone, just UI wiring)
       │
       ▼
A6 (REST expansion — after other commands are solid)
C3 (diff viewer — after File Explorer works well)
       │
       ▼
C1 (pipeline builder — after pipeline watcher proves the system works)
```

---

## File Index

```
TO-DO/round2-plans/
├── A1-clear-agent-memory.md
├── A2-reset-all-settings.md
├── A3-pipeline-completion-watcher.md
├── A4-dashboard-auto-refresh.md
├── A5-file-explorer-lazy-dirs.md
├── A6-rest-api-expansion.md
├── A7-model-override-fix.md
├── B1-onboarding-empty-state.md
├── B2-theme-in-settings.md
├── B5-persist-view-mode.md
├── C1-pipeline-builder-ui.md
├── C2-github-settings-ui.md
└── C3-diff-viewer.md
```
