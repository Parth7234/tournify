# Tournify — Design System

## Overview
Tournify is a college sports tournament tracker with two interfaces:
1. **Public Viewer** — spectators see live scores, points tables, knockout brackets
2. **Admin Dashboard** — organizers manage events, teams, sports, live scoring

The design should feel **premium, modern, and sports-focused** — inspired by apps like Cricbuzz, FotMob, and ESPN. It should NOT look like a generic admin template.

---

## Brand

- **Name:** Tournify
- **Tagline:** College Sports, Live & Loud
- **Logo treatment:** Gradient text (indigo → purple), bold weight
- **Tone:** Energetic but clean. Not playful/cartoony. Think premium sports broadcast.

---

## Color Palette

### Dark Theme (Default)
| Token | Value | Usage |
|-------|-------|-------|
| Background Primary | `#0a0a0f` | Page background |
| Background Secondary | `#111118` | Header, sidebar |
| Card Background | `rgba(255,255,255,0.03)` | Cards, panels |
| Card Hover | `rgba(255,255,255,0.05)` | Interactive card hover |
| Border | `rgba(255,255,255,0.06)` | Card borders, dividers |
| Border Hover | `rgba(255,255,255,0.12)` | Hover state borders |
| Text Primary | `#ffffff` | Headlines, scores |
| Text Secondary | `rgba(255,255,255,0.7)` | Body text |
| Text Muted | `rgba(255,255,255,0.4)` | Labels, metadata |
| Accent | `#6366f1` | Primary buttons, active states (Indigo) |
| Accent Light | `#818cf8` | Tags, category labels |
| Accent Glow | `rgba(99,102,241,0.15)` | Active tab backgrounds |
| Success | `#22c55e` | Winner badges, completed status |
| Danger | `#ef4444` | Live indicator, delete buttons |
| Warning | `#f59e0b` | Upcoming matches |

### Light Theme
Same accent colors. Backgrounds invert:
| Token | Value |
|-------|-------|
| Background Primary | `#f5f5f7` |
| Background Secondary | `#ffffff` |
| Card Background | `rgba(0,0,0,0.03)` |
| Border | `rgba(0,0,0,0.08)` |
| Text Primary | `#1a1a2e` |
| Text Secondary | `rgba(0,0,0,0.65)` |

---

## Typography

- **Font Family:** Inter (Google Fonts), fallback: system UI
- **Weights used:** 400 (body), 500 (labels), 600 (subheadings), 700 (headings), 800–900 (scores, hero)
- **Rendering:** `-webkit-font-smoothing: antialiased`

| Element | Size | Weight |
|---------|------|--------|
| Hero title | 42px | 900 |
| Page heading | 28px | 700 |
| Section heading | 22px | 700 |
| Card title | 15–16px | 600 |
| Body text | 14px | 400–500 |
| Labels / metadata | 11–12px | 500–600 |
| Scores (large) | 36–48px | 800–900 |

---

## Spacing & Radius

| Token | Value |
|-------|-------|
| Base radius | 12px |
| Large radius | 16px |
| Extra-large radius | 20px |
| Card padding | 20–24px |
| Section gap | 28–40px |
| Grid gap | 12–16px |

---

## Components

### Scorecard (Match Card)
- Background: card bg with 1px border
- Hover: lift -2px, shadow, border brightens
- Structure: header (sport tag + status badge) → body (team A score VS score team B) → footer (time + winner)
- Live state: red border glow + pulsing red dot badge
- Completed state: green winner badge with trophy emoji

### Points Table
- Full-width table inside a rounded card
- Header row: secondary bg, uppercase 11px labels
- Body rows: hover highlight, bottom border
- Top team row: faint accent background
- Points column: bold, accent-colored, larger font
- Columns: # | Team | P | W | D | L | PTS

### Knockout Bracket
- Horizontal layout: each round is a column
- Round header: accent glow background, uppercase label
- Match boxes: secondary bg, bordered, with two team rows inside
- Team row: name left-aligned, score right-aligned, inside a mini bordered box
- Winner name highlighted in green
- Live matches: red border + pulsing badge
- Mobile: stacks vertically

### Live Badge
- Pill shape: red bg (10% opacity), red border, red text
- Animated red dot: `livePulse` keyframe (scale + opacity)
- Used on scorecards, bracket matches, and match detail

### Winner Badge
- Green text, green bg (10% opacity), pill border
- Trophy emoji prefix: 🏆

### Stat Cards (Admin Dashboard)
- Grid of 6 cards, each with accent color bar
- Structure: emoji icon (32px, in rounded box) → value (28px bold) → label (13px muted)
- Hover: lift, border changes to accent color, shadow

### Navigation
- **Viewer header:** sticky, blurred backdrop, logo left, sport tabs center, theme toggle right
- **Admin sidebar:** fixed left, dark bg, nav items with emoji icons, user info at bottom
- **Theme toggle button:** 36×36px, uses inline SVG sun/moon icons (not text)

### Buttons
- Primary: accent bg (#6366f1), white text, hover darkens
- Secondary: transparent bg, border, hover fills
- Danger: red tones
- Disabled: reduced opacity

### Modals
- Backdrop: dark overlay
- Card: centered, rounded, padded
- Title + form fields + action buttons at bottom

---

## Animations

| Name | Duration | Usage |
|------|----------|-------|
| fadeIn | 0.4s ease | Cards appearing on page |
| slideUp | 0.4s ease | Modals opening |
| livePulse | 1.5s infinite | Red dot on live badges |
| shimmer | 1.5s infinite | Loading skeletons |

All interactive elements use `transition: all 0.2s ease` for hover/focus states.

---

## Iconography

Use **emoji icons** sparingly as visual identifiers — not as decoration:
- Navigation: 📊 📅 👥 🏅 📋 🏆 🎯
- Status: 🔴 (live), ✅ (completed), 📅 (upcoming)
- Winner: 🏆
- Theme toggle: inline SVG (Feather icons: sun + moon)

Do NOT use emoji on every label or button. Keep it to 1 per section header or nav item.

---

## Layout

### Viewer (Public)
- Max-width: 1280px, centered
- Header → main content → footer
- Match cards in responsive grid: `repeat(auto-fill, minmax(340px, 1fr))`
- Sport page: points table/bracket always visible above match tabs

### Admin
- Fixed sidebar (240px) + scrollable main content area
- Pages use consistent header (title + subtitle + primary action button)
- Forms in modals, lists in card rows

---

## Pages to Design

1. **Viewer Home** — hero text, 4 stat counters, live matches grid, upcoming matches grid
2. **Sport Page** — points table OR knockout bracket (based on format), tabbed match list (live/upcoming/completed)
3. **Match Detail** — large scorecard, squad lists side by side, match events timeline
4. **Admin Dashboard** — 6 stat cards, 4 quick action cards
5. **Admin Live Desk** — split layout: match list left (with score controls), event panel right
6. **Admin Login** — centered card with logo, email/password form
7. **Admin CRUD Pages** — list of items + modal for create/edit (events, teams, sports, squads, tournaments)
