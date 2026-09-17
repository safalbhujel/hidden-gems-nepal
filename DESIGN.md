---
name: HiddenGems Nepal
description: Discover the Nepal that everyone misses.
colors:
  primary: "hsl(28 100% 50%)"
  accent: "hsl(196 100% 50%)"
  neutral-bg: "hsl(60 9% 97%)"
  neutral-fg: "hsl(0 0% 9%)"
  muted-bg: "hsl(60 5% 92%)"
typography:
  display:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontWeight: 700
  headline:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontWeight: 400
rounded:
  md: "0.75rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "hsl(0 0% 100%)"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.md}"
---

# Design System: HiddenGems Nepal

## Overview

**Creative North Star: "The Authentic Trailguide"**

Earthy, tactile, and restrained. It should feel like a well-crafted field journal that lets the photography and user tips shine. The design prioritizes the content over flashy UI, creating a warm, inviting, and trustworthy environment for real discovery.

**Key Characteristics:**
- **Warm & Earthy:** Colors evoke the natural landscapes of Nepal.
- **Restrained:** The UI steps back so user-submitted photography can take the spotlight.
- **Physical & Clear:** Interactions feel tangible and intentional, suitable for on-the-go travelers.

## Colors

The palette balances warm, earthy tones with cool, crisp accents.

### Primary
- **Sunset Orange** (hsl(28 100% 50%)): Used for primary actions, active states, and drawing the eye to the most important element on the screen.

### Secondary
- **Glacial Cyan** (hsl(196 100% 50%)): Used sparingly for highlights, secondary interactive elements, or map markers to contrast against the earthy background.

### Neutral
- **Cream Background** (hsl(60 9% 97%)): The primary canvas. Warmer than pure white to reduce eye strain and provide an earthy feel.
- **Charcoal Text** (hsl(0 0% 9%)): Primary text color. Softer than pure black.
- **Muted Cream** (hsl(60 5% 92%)): Used for subtle boundaries, tags, and secondary backgrounds.

### Named Rules
**The Content-First Rule.** The Sunset Orange and Glacial Cyan are used sparingly. If a screen feels overwhelmingly colorful, tone it down. Color exists to guide, not distract.

## Typography

**Display Font:** System Sans / Inter (var(--font-sans))
**Body Font:** System Sans / Inter (var(--font-sans))

**Character:** Clean, highly legible, and unopinionated to let the photography speak for itself.

### Hierarchy
- **Display** (700): Hero sections and major surface titles.
- **Headline** (600): Section headers and card titles.
- **Body** (400): Main content, reviews, and descriptions.

## Layout

The layout uses a standard fluid container approach for the web, optimized for mobile-first scanning and desktop map exploration. Spacing rhythm relies on consistent Tailwind utility steps.

## Elevation & Depth

Flat-by-default. Depth is only used structurally for floating elements (like popovers and sticky headers), avoiding ambient decorative shadows.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest on the canvas. Shadows are reserved strictly for temporary overlays or sticky interactive elements that must float above content.

## Shapes

Soft, friendly geometry. The standard 12px (0.75rem) border radius keeps the UI feeling approachable and modern without being overly playful.

## Components

Tactile and clear. Controls should feel physical enough to tap easily on a trail, with obvious interactive states.

### Buttons
- **Shape:** Softly rounded (12px / 0.75rem).
- **Primary:** Sunset Orange background with white text.
- **Hover / Focus:** Clear visual change, maintaining the physical feel.
- **Outline / Ghost:** Transparent backgrounds with charcoal text for secondary actions.

### Cards / Containers
- **Corner Style:** 12px (0.75rem) radius.
- **Background:** Pure white (hsl(0 0% 100%)) or Muted Cream to pop against the cream canvas.
- **Shadow Strategy:** Flat. Depth is conveyed via subtle borders (hsl(60 5% 88%)) rather than shadows.

### Inputs / Fields
- **Style:** Subtle border, rounded corners matching the system.
- **Focus:** Sharp Sunset Orange focus ring (ring-3).

## Do's and Don'ts

### Do:
- **Do** use the Cream Background instead of pure white for the main app canvas.
- **Do** rely on the 12px (0.75rem) border radius for all main interactive elements and cards.
- **Do** keep the interface flat and rely on borders for component definition.

### Don't:
- **Don't** use decorative shadows on static cards or images.
- **Don't** overuse Sunset Orange. It should remain a clear indicator of action or primary focus.
- **Don't** use highly stylized display fonts; the typography must remain highly legible for travelers reading on small screens outdoors.
