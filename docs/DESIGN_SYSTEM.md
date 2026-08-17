# Cineosync Music — Stage D1 Design System Foundation

## Purpose

This is the implementation contract for the first UI redesign pass. Components should consume these semantic tokens rather than inventing one-off colors, spacing, radii, shadows, or motion values.

## 1. Design principle

**Editorial Luxury × Intelligent Music**

Cineosync should feel curated, sophisticated and calm while visibly adapting to the listener. The design should use typography, artwork, composition and context as the primary expression of intelligence—not excessive badges, gradients or "AI" labels.

## 2. Color tokens

### Core
- `bg.canvas`: #09090B — primary obsidian canvas
- `bg.surface`: #111114 — primary surface
- `bg.surfaceElevated`: #17171B — elevated surface
- `bg.surfaceSubtle`: #0E0E11 — subtle section surface
- `bg.overlay`: rgba(12,12,15,0.78) — overlay foundation

### Text
- `text.primary`: #F5F5F3
- `text.secondary`: #A7A7A3
- `text.tertiary`: #73736F
- `text.inverse`: #0B0B0C

### Borders / glass
- `border.subtle`: rgba(255,255,255,0.08)
- `border.strong`: rgba(255,255,255,0.14)
- `glass.background`: rgba(255,255,255,0.055)
- `glass.backgroundStrong`: rgba(255,255,255,0.085)
- `glass.border`: rgba(255,255,255,0.11)

### Brand accent
The implementation must define a single CSS custom property for the active Cineosync accent so the exact brand hue can evolve without rewriting components.
- `accent.primary`: CSS variable `--cine-accent`
- `accent.soft`: CSS variable `--cine-accent-soft`
- `accent.contrast`: CSS variable `--cine-accent-contrast`

Accent usage: primary actions, active navigation, progress, selected states and small identity moments. Never use the accent as a full-screen background by default.

### Semantic
Use only for communicating state:
- `semantic.success`
- `semantic.warning`
- `semantic.error`
- `semantic.info`

Semantic colors should not become decorative palette colors.

## 3. Typography

Use a two-family model:

### Display / editorial
Use the project's selected editorial display font once confirmed. Intended for:
- For You hero
- major page headings
- feature moments
- identity/profile statements

### UI / body
Use a neutral modern sans-serif for:
- navigation
- controls
- track metadata
- chat
- forms
- dense lists

Fallback stack should remain system-safe.

### Scale
- `display-xl`: clamp(2.75rem, 7vw, 5.5rem)
- `display-lg`: clamp(2.1rem, 5vw, 3.75rem)
- `heading-xl`: 2rem
- `heading-lg`: 1.5rem
- `heading-md`: 1.25rem
- `body-lg`: 1.0625rem
- `body-md`: 0.9375rem
- `body-sm`: 0.8125rem
- `caption`: 0.6875rem

Line heights should favor readable vertical rhythm; editorial headlines may use tighter leading.

## 4. Spacing

Base unit: 4px.

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-10`: 40px
- `space-12`: 48px
- `space-16`: 64px
- `space-20`: 80px
- `space-24`: 96px

Mobile page gutters: 16–20px depending on breakpoint. Desktop content gutters should scale with viewport while maintaining a readable maximum content width.

## 5. Radius

- `radius-sm`: 8px
- `radius-md`: 12px
- `radius-lg`: 16px
- `radius-xl`: 24px
- `radius-pill`: 999px

Do not make every element rounded. Editorial sections may use square/soft geometry where appropriate.

## 6. Depth

Use depth sparingly. Prefer borders + contrast + blur over large shadows.

- `shadow-soft`: 0 8px 32px rgba(0,0,0,0.22)
- `shadow-floating`: 0 16px 48px rgba(0,0,0,0.34)
- `shadow-cockpit`: 0 20px 70px rgba(0,0,0,0.46)

## 7. Glass treatment

Glass is reserved for:
- Music Cockpit
- modal/sheet layers
- floating session controls
- contextual actions

Rules:
- background blur: 16–28px
- low opacity neutral surface
- subtle 1px border
- maintain readable text contrast
- provide a solid fallback when backdrop-filter is unavailable

## 8. Layout

### Mobile
- Safe-area aware bottom navigation
- Cockpit layer must sit above navigation with a reserved content inset
- Minimum interactive target: 44×44px
- Chat and scrollable content must never be hidden behind fixed player/navigation layers
- Avoid horizontal overflow

### Desktop
- Persistent navigation rail
- Central content max width
- Optional contextual rail
- Cockpit can float without blocking primary content

### Editorial composition
Use a mixture of:
- large hero/artwork anchor
- horizontal modules
- dense track lists
- asymmetric feature modules on larger screens

Do not default to a grid of identical cards.

## 9. Component states

Every reusable component should account for:
- default
- hover (pointer devices)
- focus-visible
- pressed
- disabled
- loading
- empty
- error
- selected/active where applicable

Interactive focus must remain visible against obsidian surfaces.

## 10. Motion

Motion is functional and restrained.

- micro interaction: 120–180ms
- standard transition: 180–280ms
- sheet/cockpit transition: 280–420ms

Prefer opacity + transform + subtle scale. Avoid large layout jumps.

Respect `prefers-reduced-motion: reduce` by minimizing or disabling non-essential animation.

## 11. Core component contracts

### Button
Variants: primary, secondary, ghost, destructive.

### TrackRow
Required: artwork, title, artist, duration/context, play action.
Optional: like, overflow, queue position, session indicator.

### ArtworkTile
Variants: square, portrait, landscape, hero.

### Section
Required: title. Optional subtitle/action/content layout.

### RoomCard
Required: room name, host, participant count, public/private status, current track if available, join action.

### Chat
Must support compact mobile layout, message list, composer, connection state and safe-area inset.

### MusicCockpit
States:
- hidden/no track
- compact
- expanded
- loading
- provider blocked/autoplay fallback
- error

Compact must expose Play/Pause, Forward and Like without overlap.

## 12. Accessibility

- Minimum 44px touch targets.
- Keyboard navigation for desktop.
- Visible focus-visible state.
- Text contrast must meet WCAG AA where applicable.
- Do not encode state using color alone.
- Respect reduced motion.
- Provide accessible names for icon-only controls.
- Inputs require labels or accessible equivalents.

## 13. Implementation rule

Build tokens first, then primitives, then patterns, then screens.

Do not duplicate styling inside individual screens when a semantic token or reusable component exists.

## 14. Status

**Stage D1 foundation: APPROVED for implementation.**

Next: implement tokens/primitives, then begin the redesigned app shell without changing domain functionality.
