# Design Guidelines: REPLITE-AGENT Platform

## Design Approach

**Selected Approach:** Design System-Based (Utility-Focused Developer Tool)

**Primary References:**
- VS Code: Panel management, terminal styling, file tree patterns
- Linear: Clean typography, modern developer tool aesthetics, task management UI
- GitHub Primer: Familiar developer patterns, code diff displays, PR interfaces
- Notion: Flexible workspace layouts, inline editing patterns

**Core Principles:**
1. Information density over visual decoration
2. Keyboard-first interactions with clear visual feedback
3. Consistent panel behaviors across all views
4. Zero-latency perception for real-time streams
5. Security actions require explicit visual confirmation

---

## Typography System

**Font Families:**
- **UI Text:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`)
- **Code/Terminal:** JetBrains Mono or Fira Code (monospace with ligatures)
- **Headings:** Same as UI text, weight differentiation only

**Scale (Tailwind units):**
- Panel titles: `text-sm font-semibold uppercase tracking-wide`
- Primary content: `text-sm`
- Secondary labels: `text-xs`
- Code/Terminal: `text-xs font-mono`
- Large headings (modal titles): `text-lg font-semibold`

**Hierarchy Rules:**
- Use font weight (`font-medium`, `font-semibold`) over size for emphasis
- Code always uses monospace at `text-xs` for density
- Labels use `uppercase tracking-wide` sparingly for section headers

---

## Layout & Spacing

**Spacing Primitives:** Limit to Tailwind units **2, 3, 4, 6, 8** for consistency

**Application Layout:**
```
┌─────────────────────────────────────────┐
│ Top Bar (h-12): Logo, Session, User    │ ← p-3, gap-4
├───────┬─────────────────────────────────┤
│ Side  │ Main Workspace                  │
│ Nav   │ ┌─────────────────┬───────────┐ │
│ 56px  │ │ Editor/Terminal │ Right     │ │
│       │ │ Primary Panel   │ Sidebar   │ │
│ h-full│ │                 │ (Chat/    │ │
│       │ │ flex-1          │ Tasks)    │ │
│       │ │                 │ w-96      │ │
│       │ └─────────────────┴───────────┘ │
│       │ Bottom Panel (h-64): Logs/Term  │
└───────┴─────────────────────────────────┘
```

**Panel Anatomy:**
- Panel header: `h-10 px-4 py-2` with title and action buttons
- Panel body: `p-4` for content, `p-0` for lists/code
- Resize handles: `w-1 hover:w-2` draggable dividers
- All panels have subtle borders for definition

**Responsive Breakpoints:**
- Mobile: Single panel view, tabs for switching
- Tablet: 2-column (hide right sidebar, keep bottom panel)
- Desktop: Full 3-region layout

---

## Component Library

### Navigation & Structure

**Top Bar:**
- Fixed height `h-12`, contains logo (h-6), breadcrumb navigation, session indicator, user menu
- Items spaced with `gap-4`, right-aligned utilities with `gap-2`

**Side Navigation:**
- Fixed width `w-14`, icon-only buttons in vertical stack
- Each icon button: `h-12 w-12 rounded-lg` with subtle hover state
- Active state: distinct visual treatment (not just opacity)
- Icons: Heroicons at 20px (H-5 W-5)

**Panel Headers:**
- Sticky position, `h-10`, title on left, actions (icon buttons) on right
- Icon buttons: `h-6 w-6 p-1` for compact density
- Dropdown menus attach below header

### Editor & Code Display

**Code Editor Integration:**
- Embed Monaco Editor or CodeMirror with custom theme
- Line numbers in gutter: `w-12 text-right pr-3`
- Syntax highlighting with developer-friendly palette
- Minimap optional, toggle in header

**File Tree:**
- Nested list with `pl-4` per level (max 6 levels visible)
- File/folder items: `h-7 px-2 rounded` hover states
- Icons: 16px file-type glyphs, chevrons for folders
- Current file: distinct highlight

**Diff Viewer:**
- Side-by-side or unified diff toggle
- Added lines: subtle background tint, `+` prefix
- Removed lines: different tint, `-` prefix
- Unchanged context: 3 lines above/below changes
- Action buttons per hunk: Accept/Reject (h-6 px-2)

### Terminal & Logs

**Terminal Panel:**
- Full-width, monospace `text-xs`
- Prompt: distinct styling (bold or different opacity)
- ANSI color support mandatory
- Scrollback buffer: max-height with overflow-y-auto
- Input: fixed bottom row with command history (↑↓)

**Log Streaming:**
- Each log line: `py-0.5 px-2 border-l-2` with timestamp prefix
- Severity indicators: border-left color codes (info/warn/error)
- Auto-scroll to bottom unless user scrolls up
- Search/filter bar: `h-8` above log area

### Chat & Task Management

**Chat Interface:**
- Message bubbles: max-width prose, left/right aligned (user/agent)
- User messages: `ml-12 rounded-2xl px-4 py-2`
- Agent messages: `mr-12 rounded-2xl px-4 py-2` with avatar
- Code blocks in messages: `text-xs font-mono bg-[slight-tint] p-2 rounded`
- Input: fixed bottom, `min-h-12` growing textarea with send button

**Task List:**
- Each task: `h-auto py-3 px-4 border-b` expandable accordion
- Task header: Status icon (8px dot), title `text-sm font-medium`, timestamp `text-xs`
- Expanded view shows JSON plan steps as nested list with `pl-6` per level
- Running task: animated progress indicator (subtle pulse)

### Forms & Inputs

**Text Inputs:**
- Standard height: `h-9 px-3 text-sm rounded-lg border`
- Focus: distinct border treatment (no glow effects)
- Labels: `text-xs font-medium mb-1`

**Buttons:**
- Primary action: `h-9 px-4 text-sm font-medium rounded-lg`
- Secondary: same size, different visual treatment
- Danger/Destructive: clear visual warning (border or text treatment)
- Icon-only: `h-8 w-8 rounded-lg` with padding-0

**Approval Flows:**
- Approval modal: max-w-2xl, shows action preview
- Two-button layout: Cancel (secondary) + Approve (primary danger)
- Detailed change summary: list with `space-y-2`
- "Don't ask again" checkbox at bottom

### GitHub Integration UI

**Repository Browser:**
- Breadcrumb navigation: `text-sm` with `/` separators
- Branch selector: dropdown with search, current branch in header
- File list: same as file tree component

**Pull Request Creation:**
- Form layout: `space-y-4`, full-width inputs
- Title: `h-10 px-3`, Description: `min-h-32` textarea
- Changed files preview: expandable diff viewer
- Action buttons: bottom-right, `gap-2`

### Storage Provider Management

**Provider List:**
- Cards in grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Each card: `p-4 rounded-lg border`, icon + name + status indicator
- Connect button: `h-8 w-full` at card bottom

**Artifact Browser:**
- Table layout for artifacts: columns for Name, Size, Date, Actions
- Row height: `h-10`, sortable column headers
- Action buttons (download/delete): icon-only, `h-6 w-6`

---

## Real-time Streaming Indicators

**Connection Status:**
- Top-right indicator: 8px circle, animated pulse when active
- Tooltip on hover shows connection type (WebSocket/SSE)

**Live Updates:**
- New log lines: subtle slide-in animation (100ms)
- Terminal output: instant append, no animation
- Task progress: step counter updates with brief highlight (fade 300ms)

**Loading States:**
- Skeleton screens for panel content: `animate-pulse` on repeated `h-4 bg-[tint] rounded` bars
- Spinner: 16px animated SVG, use sparingly

---

## Security & Critical Actions

**Dangerous Operation Warning:**
- Inline alert above action: `p-3 rounded border-l-4` with warning icon
- Text: `text-sm`, bold action name + consequences
- Dual confirmation: checkbox "I understand" + button

**Credentials Display:**
- Masked by default: `****` with "Reveal" button (eye icon)
- Copy button: icon-only, shows "Copied" tooltip on click
- Never show in logs: replace with `[REDACTED]`

**Dry-Run Mode Toggle:**
- Global toggle in top bar: switch component `h-5 w-9`
- When ON: all panels show subtle banner "Dry-run mode active"

---

## Animation Philosophy

**Minimal Animations:**
- Panel resize: smooth 150ms ease-out
- Dropdown menus: 100ms opacity + translate-y
- Modals: 200ms scale + opacity
- NO animations on log streaming or terminal output
- NO hover animations on buttons (trust default states)

---

## Accessibility

**Keyboard Navigation:**
- All panels: focusable with Tab, activated with Enter
- Terminal: Ctrl+L to focus, Esc to blur
- File tree: Arrow keys to navigate, Enter to open
- Modal dialogs: focus trap, Esc to close

**Screen Reader:**
- Panel landmarks: `role="region"` with `aria-label`
- Live regions for streaming logs: `aria-live="polite"`
- Action buttons: explicit `aria-label` when icon-only

**Focus Indicators:**
- Visible focus ring: 2px solid, offset 2px from element
- Never `outline-none` without custom focus state

---

This design creates a **professional, efficient developer workspace** that prioritizes information density, real-time feedback, and security awareness while maintaining visual clarity through consistent spacing, typography, and component patterns.