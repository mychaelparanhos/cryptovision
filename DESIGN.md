# Design System — CryptoVision

## Product Context
- **What this is:** SaaS analytics platform for crypto futures markets
- **Who it's for:** Retail futures traders ($5K-$500K AUM, 25-45yo) who operate daily on Binance, Bybit, OKX
- **Space/industry:** Crypto analytics (peers: Coinglass, Buildix, CryptoQuant, Coinalyze)
- **Project type:** Hybrid — marketing landing page + data-dense app dashboard
- **Language:** 100% English, international market

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian meets Luxury/Refined
- **Decoration level:** Intentional — data visualizations are the visual language
- **Mood:** The Bloomberg Terminal you can afford. Institutional credibility with retail accessibility. Precise, confident, not flashy. Data speaks, UI whispers.
- **Reference sites:** TradingView (chart UX), Linear.app (dark mode), Vercel Dashboard (dev tools aesthetic)
- **Anti-patterns:** No illustrations, decorative blobs, wavy SVG dividers, emoji as design elements, purple/violet gradients, 3-column feature grids with icons in circles, centered-everything layouts

## Typography

### Font Stack
- **Display/Hero:** Inter Bold (700) — visual force from size and weight, not extra fonts
- **Body:** Inter Regular (400) / Medium (500)
- **UI/Labels:** Inter Medium (500) / SemiBold (600)
- **Data/Tables:** JetBrains Mono Regular (400) / Medium (500) — tabular figures, right-aligned
- **Code:** JetBrains Mono Regular (400)

### Loading
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale
| Level | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| Display | 48px / 3rem | Bold 700 | Inter | Hero headlines |
| H1 | 36px / 2.25rem | Bold 700 | Inter | Page titles |
| H2 | 30px / 1.875rem | SemiBold 600 | Inter | Section headings |
| H3 | 24px / 1.5rem | SemiBold 600 | Inter | Widget titles, subheadings |
| H4 | 20px / 1.25rem | Medium 500 | Inter | Card headers |
| Body L | 18px / 1.125rem | Regular 400 | Inter | Hero subline, landing copy |
| Body | 16px / 1rem | Regular 400 | Inter | Default body text |
| Body S | 14px / 0.875rem | Regular 400 | Inter | Secondary text, descriptions |
| Caption | 13px / 0.8125rem | Medium 500 | Inter | Labels, metadata, nav items |
| Micro | 12px / 0.75rem | Medium 500 | Inter | Tags, badges, timestamps |
| Tiny | 11px / 0.6875rem | SemiBold 600 | Inter | Section labels (uppercase, 1.5px tracking) |
| Data XL | 24px / 1.5rem | SemiBold 600 | JetBrains Mono | Hero metrics, big numbers |
| Data L | 16px / 1rem | Regular 400 | JetBrains Mono | Funding rates, percentages |
| Data M | 13px / 0.8125rem | Regular 400 | JetBrains Mono | Table cells, timestamps |
| Data S | 12px / 0.75rem | Regular 400 | JetBrains Mono | Sparkline labels, tooltips |

### Number Formatting Rules
- All numbers use JetBrains Mono with `font-variant-numeric: tabular-nums`
- Numbers are right-aligned in tables
- Positive values: green (#22C55E), prefix with `+`
- Negative values: red (#EF4444), prefix with `-`
- Neutral: primary text color (#FAFAFA)
- Anomalous values (extreme funding): amber (#F59E0B)
- Flash animation on change: 0.2s background highlight then fade
  - Up: `rgba(34, 197, 94, 0.12)` background flash
  - Down: `rgba(239, 68, 68, 0.12)` background flash
  - Respects `prefers-reduced-motion`

## Color

### Approach
Restrained. Amber is rare and meaningful (CTAs, alerts, anomalies). Blue is informational. 90% of the UI is zinc neutrals. Color lives in the data (green/red for price movement), not in the chrome.

### Dark Mode (only mode, no light mode toggle)

#### Surfaces & Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#09090B` | Page background (zinc-950) |
| `--surface` | `#18181B` | Cards, widgets, sidebar (zinc-900) |
| `--surface-hover` | `#1F1F23` | Card hover state |
| `--border` | `#27272A` | Default borders (zinc-800) |
| `--border-hover` | `#3F3F46` | Hover/focus borders (zinc-700) |
| `--text-primary` | `#FAFAFA` | Headlines, primary text (zinc-50) |
| `--text-secondary` | `#A1A1AA` | Body text, descriptions (zinc-400) |
| `--text-muted` | `#71717A` | Metadata, timestamps, labels (zinc-500) |

#### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-amber` | `#F59E0B` | Primary CTA, active states, anomaly highlight |
| `--accent-amber-hover` | `#D97706` | CTA hover |
| `--accent-amber-glow` | `rgba(245, 158, 11, 0.15)` | Glow effect on CTAs, focus rings |
| `--accent-amber-subtle` | `rgba(245, 158, 11, 0.08)` | Active nav items, badge backgrounds |
| `--accent-blue` | `#3B82F6` | Links, informational badges, secondary accent |
| `--accent-blue-hover` | `#2563EB` | Link hover |

#### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--positive` | `#22C55E` | Price up, longs, success |
| `--positive-bg` | `rgba(34, 197, 94, 0.12)` | Success badge/alert background |
| `--negative` | `#EF4444` | Price down, shorts, error |
| `--negative-bg` | `rgba(239, 68, 68, 0.12)` | Error badge/alert background |
| `--warning` | `#F59E0B` | Caution, elevated metrics |
| `--info` | `#3B82F6` | Informational notices |

#### Exchange Colors
| Exchange | Color | Hex |
|----------|-------|-----|
| Binance | Yellow | `#F0B90B` |
| Bybit | Orange | `#F7A600` |
| OKX | White | `#FFFFFF` (on dark) |

### Color Usage Rules
- Amber is ONLY used for: primary CTAs, active navigation, anomaly highlights, focus rings
- Blue is ONLY used for: links, informational badges, secondary CTAs
- Green/Red are ONLY used for: price movement, long/short indicators, success/error states
- Do NOT use amber for decoration or ambient color (except subtle glow on hero)
- Exchange colors are ONLY used in exchange badges and chart overlays
- Never mix exchange colors with semantic colors

## Spacing

### Base Unit
4px base. Comfortable density — widgets breathe but don't waste space.

### Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Inline spacing, icon gaps |
| `--space-2` | 8px | Component internal padding (compact) |
| `--space-3` | 12px | Component internal padding (default) |
| `--space-4` | 16px | Widget padding, section gaps |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section padding, grid gaps |
| `--space-8` | 32px | Section margins |
| `--space-10` | 40px | Large section spacing |
| `--space-12` | 48px | Page section padding |
| `--space-16` | 64px | Landing page section padding |
| `--space-20` | 80px | Major section breaks |

### Density Guidelines
- **Dashboard widgets:** 16px padding, 12px gap between elements inside
- **Data tables:** 10px vertical padding per row, 12px horizontal per cell
- **Cards:** 20-24px padding
- **Landing page sections:** 64px vertical padding
- **Sidebar nav items:** 8px vertical, 10px horizontal padding

## Layout

### Approach
Grid-disciplined for the app (dashboard, settings, API keys). Creative-editorial for the landing page (asymmetric feature section). Hybrid overall.

### Grid
| Breakpoint | Columns | Gutter | Margin |
|-----------|---------|--------|--------|
| 375px (mobile) | 4 | 16px | 16px |
| 768px (tablet) | 8 | 20px | 24px |
| 1024px (desktop) | 12 | 24px | 24px |
| 1440px (wide) | 12 | 24px | auto (max-width: 1440px) |

### Max Content Width
- Landing page: 1200px
- Dashboard: full viewport (sidebar + main)
- Settings/API Keys: 800px centered

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Inputs, small elements |
| `--radius-sm` | 6px | Badges, tags, nav items |
| `--radius-md` | 8px | Buttons, cards (default) |
| `--radius-lg` | 12px | Widget cards, modals |
| `--radius-full` | 9999px | Avatars, status dots |

### Shadows
None as default (flat dark UI). Exceptions:
- Amber glow on primary CTAs: `0 0 20px rgba(245, 158, 11, 0.15)`
- Tooltip/popover shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
- Dropdown shadow: `0 4px 20px rgba(0, 0, 0, 0.3)`

## Motion

### Approach
Minimal-functional. Precision, not playfulness. Every animation serves comprehension or feedback. Nothing bouncy, nothing decorative.

### Duration Scale
| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-micro` | 50-100ms | Toggles, checkboxes, focus rings |
| `--duration-short` | 150ms | Button hover, border color changes |
| `--duration-medium` | 250ms | Modal open/close, drawer slide, tab switch |
| `--duration-long` | 400ms | Page transitions, complex state changes |

### Easing
| Context | Easing | CSS |
|---------|--------|-----|
| Enter (appear) | ease-out | `cubic-bezier(0, 0, 0.2, 1)` |
| Exit (disappear) | ease-in | `cubic-bezier(0.4, 0, 1, 1)` |
| Move (reposition) | ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` |

### Specific Animations
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Number value change | Background flash (green/red), then fade | 200ms + 600ms fade | ease-out |
| Card hover | translateY(-2px), border-color change | 150ms | ease-out |
| Button hover | translateY(-1px), background darken | 100ms | ease-out |
| Modal open | fade-in + scale(0.95 to 1) | 250ms | ease-out |
| Modal close | fade-out + scale(1 to 0.95) | 200ms | ease-in |
| Toast appear | slide-up + fade-in | 250ms | ease-out |
| Toast dismiss | fade-out | 150ms | ease-in |
| Sidebar collapse | width transition | 250ms | ease-in-out |
| Skeleton pulse | background shimmer | 1500ms | linear, infinite |

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Components

### Buttons
| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `--accent-amber` | `--bg` | none | Main CTAs: "Start Free", "Upgrade", "Create Alert" |
| Secondary | transparent | `--text-primary` | `--border` | Secondary actions: "View Screener", "Cancel" |
| Ghost | transparent | `--text-secondary` | none | Tertiary: "Learn more", nav links, toggles |
| Danger | `rgba(239,68,68,0.1)` | `--negative` | `rgba(239,68,68,0.2)` | Destructive: "Revoke Key", "Delete Alert" |

Sizes: `sm` (6px 12px, 13px), `md` (8px 16px, 14px), `lg` (12px 24px, 16px)

### Badges
| Variant | Usage |
|---------|-------|
| Positive | Price up: `▲ +2.34%` |
| Negative | Price down: `▼ -1.82%` |
| Amber | Anomaly/warning: `⚡ Elevated` |
| Info | Informational: `ℹ Delayed 15min` |
| Exchange | Source tag: `Binance`, `Bybit`, `OKX` (colored borders) |

### Exchange Toggle (Segmented Control)
Global filter in dashboard header. Segmented control with exchange logos/colors.
- Items: `All` | `BNB` (dot #F0B90B) | `Bybit` (dot #F7A600) | `OKX` (dot #FFFFFF)
- Active state: amber background, dark text
- Selecting filters ALL widgets simultaneously
- Pro+ users: per-widget override via 3-dot menu

### Widget Cards
- Background: `--surface`
- Border: `--border`, hover: `--border-hover`
- Radius: `--radius-lg` (12px)
- Header: 12px 16px padding, border-bottom, title (13px SemiBold, text-secondary)
- Body: 16px padding

### Data Tables
- Header: 11px uppercase, 0.5px letter-spacing, text-muted
- Rows: 10px 12px padding, border-bottom 0.4 opacity
- Hover: `rgba(255,255,255,0.02)` background
- Numbers: right-aligned, JetBrains Mono, color-coded

### Form Inputs
- Background: `--bg`
- Border: `--border`, focus: `--accent-amber` + 3px amber glow
- Padding: 8px 12px
- Placeholder: `--text-muted`
- Labels: 13px Medium, text-secondary, 6px margin-bottom

### Alerts/Banners
| Type | Border | Background | Icon |
|------|--------|------------|------|
| Warning (WS disconnect) | amber 0.2 | amber 0.08 | ⟳ |
| Error (connection lost) | red 0.2 | red 0.12 | ✕ |
| Success | green 0.2 | green 0.12 | ✓ |
| Info (partial data) | blue 0.2 | blue 0.08 | ℹ |

### Education Tooltips
- Trigger: `?` icon (16px circle, zinc-500/0.3 bg) next to metric labels
- Popover: max-width 280px, dark surface (#2a2a2e), border zinc-700
- Content: 1-2 sentences metric explanation + 1 sentence position impact
- Shadow: `0 8px 32px rgba(0,0,0,0.4)`
- Dismiss: click outside

### Skeleton Loading
- Background: shimmer animation on `--surface`
- Shimmer: linear gradient sweep (surface > slightly lighter > surface)
- Duration: 1500ms, infinite
- Shape: match the element being loaded (rounded rects, no circles)
- Never use spinners

### Toasts
- Position: bottom-right, 24px from edges
- Background: `--surface` with border
- Auto-dismiss: 5s for success, persistent for errors
- Animation: slide-up + fade-in (250ms)

### Status Indicators
- Online: green dot (8px) with glow shadow
- Degraded: amber dot with glow
- Offline: red dot with glow

## Chart Styling

### Library
- Financial charts (price, OI, heatmap): TradingView Lightweight Charts
- Simple charts (usage, bar): Recharts
- Heatmap: Canvas-rendered custom component

### Chart Colors
- Primary line: `--accent-amber` (#F59E0B)
- Secondary line: `--accent-blue` (#3B82F6)
- Grid lines: `rgba(39, 39, 42, 0.5)` (border at 50% opacity)
- Axis labels: `--text-muted` (JetBrains Mono, 11px)
- Crosshair: `--text-secondary`
- Volume bars up: `rgba(34, 197, 94, 0.3)`
- Volume bars down: `rgba(239, 68, 68, 0.3)`

### Multi-Exchange Overlay Colors
- Binance line: `#F0B90B`
- Bybit line: `#F7A600`
- OKX line: `#FFFFFF` at 70% opacity
- Consolidated/Average: `--accent-amber`

### Heatmap Color Scale
- Cold (no liquidations): transparent / `rgba(59, 130, 246, 0.05)` (faint blue)
- Warm (moderate): `rgba(245, 158, 11, 0.3)` (amber)
- Hot (high density): `rgba(245, 158, 11, 0.8)` to `#FFFFFF` (amber to white)

## Navigation

### Sidebar (Dashboard)
- Width: 200px (desktop), collapsed on mobile (hamburger)
- Background: `rgba(24, 24, 27, 0.4)` (semi-transparent surface)
- Border-right: `--border`
- Content order: Logo > Nav items > Watchlist (collapsible) > Plan badge + Upgrade link
- Nav item: 8px 10px padding, radius-sm, text-secondary
- Active nav item: amber-subtle background, amber text
- Hover: `rgba(255,255,255,0.03)` background, text-primary

### Top Navigation (Landing Page)
- Sticky, backdrop-filter blur(12px)
- Background: `rgba(9, 9, 11, 0.8)`
- Border-bottom: `--border`
- Items: Logo (left) | Features | Pricing | Screener | Docs (center) | Login (right)

### Mobile Navigation
- Hamburger icon (top-left)
- Opens as full-height drawer (left side)
- Overlay: `rgba(0, 0, 0, 0.5)`
- Close: tap outside or swipe left

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| 375px (mobile) | Single column. Sidebar becomes hamburger drawer. Heatmap simplifies to Liquidation Summary bar. Widgets stack. Watchlist via bottom sheet. Touch targets: 44px min. |
| 768px (tablet) | 2-column grid. Sidebar collapsible but expandable. Full heatmap. |
| 1024px (desktop) | Full layout with sidebar open. |
| 1440px (wide) | More space for heatmap and charts. Max content width. |

## Accessibility

| Requirement | Specification |
|------------|---------------|
| Color contrast | 4.5:1 minimum for body text (WCAG AA) |
| Touch targets | 44px minimum (Apple HIG / WCAG 2.1) |
| Focus indicators | 2px amber ring, visible on dark background |
| Keyboard nav | Tab through widgets, Enter to expand, Escape close modals |
| Screen readers | ARIA landmarks: sidebar=navigation, main=main, widgets=complementary |
| Live regions | `aria-live="polite"` for data updates, `"assertive"` for alerts |
| Command palette | Cmd+K / Ctrl+K for quick search and navigation |
| Reduced motion | Respect `prefers-reduced-motion` media query |

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Dark mode only, no light toggle | Crypto-native audience expects dark. Consistent experience landing-to-app. |
| 2026-04-14 | Inter + JetBrains Mono | Inter: proven UI font. JBM: tabular figures for financial data, institutional credibility. |
| 2026-04-14 | Amber as primary accent (not blue) | Differentiator: every competitor uses blue. Amber = urgency, gold, energy. Crypto-native. |
| 2026-04-14 | Data-as-decoration (no illustrations) | Product is data. Features section shows real data viz, not abstract icons. Anti-slop. |
| 2026-04-14 | Restrained color approach | 90% zincs. Color means something (price movement, status). Prevents visual noise. |
| 2026-04-14 | Minimal-functional motion | Precision, not playfulness. Traders need clarity, not animation. |
| 2026-04-14 | Comfortable density (not compact) | Curated mode default: 5 widgets that breathe > 20 widgets crammed. |
| 2026-04-15 | Created by /design-consultation | Based on competitive research (TradingView, Linear, Buildix) and design review tokens. |
