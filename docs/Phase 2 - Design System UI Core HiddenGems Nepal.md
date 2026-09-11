# HiddenGems Nepal—Phase 2: Design System & UI Core

**Status:** COMPLETE
**Previous Phase:** Phase 1 \--- Project Foundation
**Next Phase:** Phase 3 \--- Supabase Foundation
**Project:** HiddenGems Nepal
**Application:** Mobile-first responsive web application

---

## 1\. Phase Objective

Phase 2 transformed the bare Next.js foundation from Phase 1 into the first branded, theme-aware, reusable UI foundation for HiddenGems Nepal.

The objective was to establish:

- brand identity
- design tokens
- light/dark/system theming
- Tailwind CSS v4 integration
- shadcn/ui foundation
- Base UI \+ Nova preset
- reusable UI primitives
- HiddenGems-specific domain components
- responsive behavior
- a clean foundation for future product screens

This phase did **not** implement the complete HiddenGems application. It established the UI core that future features will use.

# 2\. Phase 1 → Phase 2 Transition

Phase 1 established the technical project foundation:

- **Next.js 16.3.4**
- **TypeScript**
- **ESLint**
- **Tailwind CSS**
- **App Router**
- **Git/GitHub**
- **local development environment**
- **initial architecture directories**

At the beginning of Phase 2, the application was still close to the generated Next.js starter.

Phase 2 changed that foundation into:

Next.js Foundation

        ↓

HiddenGems Design Tokens

        ↓

Theme Engine

        ↓

shadcn/ui \+ Base UI

        ↓

Reusable UI Primitives

        ↓

HiddenGems Domain Components

---

# 3\. Success Criteria

- **Brand colors implemented:** ✅ HSL CSS variables implemented
- **Tailwind v4 integration:** ✅ Integrated with theme
- **Theme Modes:** Light ✅ | Dark ✅ | System ✅
- **Theme Switching:** ✅ Hydration protection & FOUC prevention
- **Component Library:** ✅ shadcn/ui initialized (Base UI \+ Nova preset)
- **Core UI Primitives:** Button ✅ | Card ✅ | Badge ✅ | Input ✅ | Label ✅ | Separator ✅
- **Domain Components:** CategoryChip ✅ | HiddenScoreBadge ✅
- **Verification & Delivery:** Responsive ✅ | Build ✅ | Semantic Git commit ✅ | GitHub push ✅ | Documentation ✅

---

# 4\. Core Technical Decisions

## 4.1 Tailwind CSS v4 \+ CSS Variables

The project uses Tailwind CSS v4 with CSS variables as the central design-token layer.

Instead of hardcoding:

**bg-\[\#FF8500\]**

components can use semantic tokens such as:

**bg-primary**

**text-foreground**

**border-border**

The architecture is:

CSS Variables

    ↓

**@theme**

    ↓

Tailwind utilities

    ↓

shadcn components

    ↓

HiddenGems components

This keeps the visual system centralized and makes future redesigns easier.

Current shadcn documentation supports Tailwind v4 and CSS-variable-driven semantic theme tokens.

&nbsp;

---

# 5\. HSL Color Architecture

Phase 2 uses HSL values for its design tokens.

Example:

**\#FF8500**

→

**28 100% 50%**

This supports utility patterns such as:

**bg-primary**

**bg-primary/10**

**bg-primary/20**

**text-primary**

**border-primary**

The main benefit is that component styling can reference semantic tokens rather than scattered raw colors.

> Note: newer shadcn-generated themes increasingly use OKLCH, but this project intentionally retains the HSL representation selected during Phase 2\. The important architectural decision is the semantic CSS-variable layer.

---

# 6\. HiddenGems Brand Identity

## Primary Brand Color

\#FF8500

HSL:

28 100% 50%

The orange represents:

- discovery
- warmth
- energy
- adventure
- exploration

&nbsp;

It is used for:

&nbsp;

- CTAs
- active states
- highlights
- category emphasis
- important actions

---

# 7\. Design Tokens

---

&nbsp;

| Token                   | Light                             | Dark                           | Usage                |
| :---------------------- | :-------------------------------- | :----------------------------- | :------------------- |
| **\--background** | **60 9% 97% (\#F8F8F6)**    | **0 0% 9% (\#171717)**   | Page background      |
| **\--foreground** | **0 0% 9% (\#171717)**      | **60 9% 97% (\#F8F8F6)** | Main text            |
| **\--primary**    | **28 100% 50% (\#FF8500)**  | **28 100% 55%**          | CTA/highlight        |
| **\--accent**     | **196 100% 50% (\#00AFFF)** | **196 100% 55%**         | Info/map/link states |
| **\--muted**      | **60 5% 92%**               | **0 0% 18%**             | Secondary surfaces   |
| **\--border**     | **60 5% 90%**               | **0 0% 18%**             | Borders/inputs       |
| **\--radius**     | **0.75rem**                 | **0.75rem**              | Base radius          |

# 8\. Typography

Primary font direction:

Inter

Configured through:

next/font/google

The intended typography style is:

- modern
- clean
- highly readable
- compact for metadata
- strong for headings
- appropriate for a consumer discovery platform

Feature settings include:

rlig

calt

Typography can still be refined during the full product UI phase.

---

# 9\. Shape Language

Base radius:

0.75rem

Equivalent:

12px

Used as the starting language for:

- cards
- buttons
- inputs
- badges
- surfaces

The visual target is rounded and friendly without becoming excessively playful.

---

# 10\. Theming Engine

The project uses:

**next-themes**

with:

**attribute="class"**

Supported modes:

Light

Dark

System

Default:

**defaultTheme="system"**

**enableSystem**

This lets users inherit their operating-system preference.

Architecture:

Root Layout

    ↓

ThemeProvider

    ↓

next-themes

    ↓

**\<html class="dark"\> or light**

---

# 11\. FOUC and Hydration Safety

The theme system is designed to prevent a visible flash of the wrong theme.

The root layout uses:

**suppressHydrationWarning**

because the theme provider may modify the HTML class before React hydration completes.

Target behavior:

Open app

  ↓

Detect theme

  ↓

Apply correct class

&nbsp;

Render/hydrate

rather than:

Open app

  ↓

Wrong theme appears

  ↓

Theme changes

No hydration warnings were observed during verification.

---

# 12\. shadcn/ui Foundation

shadcn/ui was initialized as the source-code-owned component foundation.

The project selected:

**Base UI**

\+

**Nova preset**

The components are part of the project source rather than an opaque UI package.

This provides control over:

- markup
- variants
- Tailwind styling
- accessibility
- behavior
- future customization

Current shadcn documentation supports Base UI as the default foundation for new projects and supports Tailwind v4/CSS-variable theming.

---

# 13\. Why Base UI \+ Nova

## Base UI

Selected as the component foundation.

Base UI is now the default library for new shadcn projects, while Radix remains supported.

## Nova

Selected as the initial visual preset because it is close to the desired:

- rounded-card aesthetic
- modern consumer UI
- subtle surfaces
- clean spacing
- startup-style visual language

Nova is only a starting point.

It is **not** the final HiddenGems visual identity.

---

# 14\. shadcn Configuration

Created:

**components.json**

The configuration connects shadcn to:

- the project's CSS file
- Tailwind v4
- CSS variables
- TypeScript
- component aliases
- the selected style/preset

For Tailwind v4, the Tailwind config path remains empty because configuration is primarily CSS-first.

---

# 15\. lib/utils.ts

Created:

**lib/utils.ts**

Purpose:

- shared utility location
- **cn()** helper
- conditional class merging

Conceptually:

base classes

\+

conditional classes

\+

custom className

↓

**cn()**

↓

final classes

This keeps component class handling consistent.

---

# 16\. Core UI Components

The following shadcn components were added:

**components/ui/**

**├── button.tsx**

**├── card.tsx**

**├── badge.tsx**

**├── input.tsx**

**├── label.tsx**

**└── separator.tsx**

## Button

Foundation for:

- Sign In
- Sign Up
- Save
- Submit
- Continue
- confirmation actions
- admin actions

## Card

Foundation for:

- PlaceCard
- profile sections
- content containers
- submission sections

## Badge

Foundation for:

- category
- status
- rating
- verification
- Hidden Score

## Input

Foundation for:

- authentication
- search
- forms
- filters
- profile editing

## Label

Foundation for accessible forms.

## Separator

Foundation for visual grouping and Place Detail sections.

---

# 17\. Custom Domain Components

Phase 2 introduced the first product-specific components:

**components/places/category-chip.tsx**

**components/places/hidden-score-badge.tsx**

Architecture:

Generic shadcn primitive

        ↓

HiddenGems domain component

        ↓

Future feature component

        ↓

&nbsp;

Application page

---

# 18\. CategoryChip

## Purpose

Represents a HiddenGems place category.

Potential categories:

- Sacred Sites
- Secret Trails
- Local Food
- Waterfalls
- Viewpoints
- Villages
- Short Hikes
- Sunset Spots

## Visual direction

Based on Badge:

rounded-full

bg-primary/10

text-primary

hover:bg-primary/20

This gives categories a lightweight orange treatment.

## Planned use cases

Home

Explore

Place Detail

Place cards

Filter areas

If used interactively, it should use an appropriate interactive element and accessible state rather than treating a purely visual badge as a button.

---

# 19\. HiddenScoreBadge

## Purpose

Displays the conceptual Hidden Score of a place.

The badge is a presentation component.

The actual Hidden Score algorithm is **not finalized** in Phase 2\.

## Accepted range

0–100

Input is defensively clamped:

**Math.max(0, Math.min(100, score))**

Examples:

\-20 → 0

120 → 100

50 → 50

This protects the UI from invalid external values.

---

# 20\. Hidden Score Tiers

&nbsp;

| Score Range | Label          |
| :---------- | :------------- |
| 80 – 100   | Deeply Hidden  |
| 60 – 79    | Very Hidden    |
| 40 – 59    | Hidden         |
| 20 – 39    | Somewhat Known |
| 0 – 19     | Well Known     |

These are display tiers only.

The final algorithm will be defined later based on real product/data requirements.

---

# 21\. HiddenScoreBadge Responsive Behavior

Mobile:

\[ 87 \]

Larger screens:

\[ 87  Deeply Hidden \]

The descriptive label is hidden at the mobile breakpoint using:

**sm:hidden**

The score itself remains visible.

---

# 22\. Tabular Numbers

The score uses:

**tabular-nums**

This keeps numeric characters aligned and reduces small layout shifts when values change.

---

# 23\. Repository Changes

## Created

components/theme-provider.tsx

components.json

lib/utils.ts

components/ui/button.tsx

components/ui/card.tsx

components/ui/badge.tsx

components/ui/input.tsx

components/ui/label.tsx

components/ui/separator.tsx

components/places/category-chip.tsx

components/places/hidden-score-badge.tsx

## Modified

app/globals.css

app/layout.tsx

app/page.tsx

---

# 24\. Current Repository Structure

**hidden-gems-nepal/**

│

**├── app/**

**│   ├── favicon.ico**

**│   ├── globals.css**

**│   ├── layout.tsx**

**│   └── page.tsx**

│

**├── components/**

**│   ├── layout/**

**│   ├── navigation/**

**│   ├── places/**

**│   │   ├── category-chip.tsx**

**│   │   └── hidden-score-badge.tsx**

│   │

**│   ├── ui/**

**│   │   ├── badge.tsx**

**│   │   ├── button.tsx**

**│   │   ├── card.tsx**

**│   │   ├── input.tsx**

**│   │   ├── label.tsx**

&nbsp;

**│   │   └── separator.tsx**

│   │

**│   └── theme-provider.tsx**

│

**├── lib/**

**│   ├── constants/**

**│   ├── types/**

**│   └── utils.ts**

│

**├── public/**

**│   ├── icons/**

**│   └── images/**

&nbsp;

**├── .gitignore**

**├── AGENTS.md**

**├── CLAUDE.md**

**├── README.md**

├── README.md

**├── components.json**

├── components.json

&nbsp;

**├── eslint.config.mjs**

**├── next.config.ts**

**├── next.config.ts**

**├── package-lock.json**

**├── package.json**

**├── postcss.config.mjs**

**└── tsconfig.json**

Generated/local directories such as node\_modules/ and .next/ exist locally but are not application source.

---

# 25\. Folder Status

## app/

**Status:** 🟡 Foundation \+ temporary verification

Current files:

favicon.ico

globals.css

layout.tsx

page.tsx

Final application routes have not been implemented.

## components/layout/

**Status:** 📁 Prepared

No final layout components yet.

Future use:

- page shells
- shared containers
- footer
- application layout

## components/navigation/

**Status:** 📁 Prepared

No final navigation yet.

Future use:

- desktop navigation
- mobile navigation
- profile actions
- search/navigation

## components/places/

**Status:** 🟢 Started

Current:

category-chip.tsx

hidden-score-badge.tsx

Future examples:

PlaceCard

PlaceGrid

PlaceHero

PlaceGallery

PlaceRating

PlaceMeta

PlaceSaveButton

PlaceLocation

ReviewCard

## components/ui/

**Status:** 🟢 Core foundation started

Current:

button

card

badge

input

label

separator

Additional components will be added only when required.

## lib/constants/

**Status:** 📁 Prepared

Domain constants are not finalized yet.

## lib/types/

**Status:** 📁 Prepared

The project intentionally avoids creating a large speculative type system before the database model is defined.

## lib/utils.ts

**Status:** 🟢 Implemented

Contains the shared class-name utility.

## public/images/

**Status:** 📁 Prepared

Static image assets can live here. User-generated destination images are expected to use Supabase Storage later.

## public/icons/

**Status:** 📁 Prepared

Reserved for static/custom icons and brand assets.

---

# 26\. Temporary Verification Page

app/page.tsx was temporarily modified for Phase 2 verification.

It is **not** the final HiddenGems homepage.

Its purpose was:

Component creation

    ↓

&nbsp;

Visual render

    ↓

Theme test

    ↓

&nbsp;

Responsive test

    ↓

&nbsp;

Build test

It will be replaced when actual product routes are implemented.

---

# 27\. Verification and Testing

## Build

Command:

**npm run build**

Result:

SUCCESS

No CSS/Tailwind build errors were encountered.

Recorded completion time:

\~598ms

## Light mode

Verified:

- primary color
- backgrounds
- foreground
- borders
- badges
- component spacing

## Dark mode

Verified with the dark HTML class.

Expected CSS-token adaptation worked.

## Responsive behavior

Browser resizing confirmed that:

HiddenScoreBadge

hides its descriptive label on mobile while keeping the score visible.

## Hydration

No console hydration warnings were observed during initial load or theme switching.

---

# 28\. Git Commit

Phase 2 was committed with:

feat(design-system): complete Phase 2 UI foundation

Commit scope included:

Tailwind v4 design tokens

theme provider

light/dark/system support

shadcn/ui

Base UI

Nova preset

core primitives

CategoryChip

HiddenScoreBadge

verification

The changes were pushed to the GitHub remote.

---

# 29\. What Phase 2 Did NOT Build

Phase 2 is a design-system phase, not the full product implementation.

Not implemented yet:

## Backend

❌ Supabase

❌ PostgreSQL schema

❌ migrations

❌ RLS

❌ Auth

❌ Storage

## Product screens

❌ final Home

&nbsp;

❌ final Place Detail

❌ final Submit Gem

❌ final Profile

❌ Admin

## Functional systems

❌ real search

❌ filters

❌ save/bookmark

❌ reviews

❌ ratings

&nbsp;

❌ moderation

❌ image uploads

❌ Mapbox

## Algorithms

❌ final Hidden Score algorithm

❌ trending algorithm

❌ contributor ranking

---

# 30\. Stitch Relationship

The Google Stitch concept remains a **visual reference**, not the final specification.

The intended process is:

Stitch visual reference

        \+

HiddenGems product requirements

        \+

real UX flows

        \+

database architecture

        \+

responsive requirements

        \+

accessibility

        ↓

Final UI

The visual reference established the direction for:

- orange/cream identity
- destination photography
- rounded cards
- discovery grids
- category chips
- contribution screens
- profile/community concepts
- Place Detail information hierarchy

But functionality and architecture remain the source of truth.

---

# 31\. Design-System Architecture

The current hierarchy is:

LEVEL 1 — DESIGN TOKENS

Colors

Typography

&nbsp;

&nbsp;

Theme

        ↓

LEVEL 2 — UI PRIMITIVES

Button

Card

&nbsp;

Badge

Input

Label

Separator

        ↓

LEVEL 3 — DOMAIN COMPONENTS

CategoryChip

&nbsp;

HiddenScoreBadge

        ↓

LEVEL 4 — FEATURE COMPONENTS

Future

        ↓

LEVEL 5 — APPLICATION PAGES

Future

This prevents the project from creating dozens of speculative components before their requirements are known.

---

# 32\. Accessibility Direction

Future components must continue to consider:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- contrast
- touch-friendly controls
- screen-reader semantics
- responsive behavior

Accessibility should be built into reusable components rather than added at the end.

---

# 33\. Responsive Strategy

HiddenGems Nepal is a:

> **Responsive web application with a mobile-first design strategy.**

It is not currently a native Android/iOS application.

Target:

Mobile

  ↓

Tablet

  ↓

&nbsp;

Desktop

The UI should adapt naturally rather than becoming two unrelated applications.

---

# 34\. Performance Direction

Prefer:

Server Components

\+

client components only where interaction requires them

Likely client-side areas include:

- theme switching
- interactive filters
- save actions
- review forms
- image uploads
- maps
- interactive navigation

Static content should remain server-renderable whenever practical.

---

# 35\. Security Direction

Phase 2 is mostly UI, but UI validation is not security.

Future Supabase implementation must enforce:

- authentication
- authorization
- Row Level Security
- secure storage policies
- validated inputs
- safe user-generated content
- secure uploads

For example:

UI validation ≠ backend validation

The HiddenScoreBadge clamps its value defensively, but the backend must also validate real data.

---

# 36\. Testing Philosophy Going Forward

Important product components should eventually be checked across:

Desktop

Mobile

Light

Dark

Loading

Empty

Error

Disabled

Interactive

Keyboard

&nbsp;

Accessibility

Not every component requires every state, but critical components should not be verified only on the happy path.

---

# 37\. Known Limitations

### Final typography

Inter is the current direction but may be refined during full UI implementation.

### Hidden Score

The UI is ready, but the actual scoring algorithm is not finalized.

### Navigation

Navigation folders exist, but final navigation depends on route architecture.

### Data-dependent UI

Components depending on Supabase data will be refined after the database model exists.

### Product pages

The verification page is temporary.

---

# 38\. Phase 2 Final State

- **Next.js Foundation:** ✅
- **TypeScript:** ✅
- **Tailwind CSS v4 & Design Tokens:** ✅
- **Brand Colors & Theming (Light/Dark/System):** ✅
- **Theme Provider & Hydration Safety:** ✅
- **shadcn/ui \+ Base UI \+ Nova Preset:** ✅
- **Core Primitives (Button, Card, Badge, Input, Label, Separator):** ✅
- **Custom Components (CategoryChip, HiddenScoreBadge):** ✅
- **Verification (Responsive & Build):** ✅
- **Source Control (Git Commit & GitHub Push):** ✅

---

# 39\. Phase 2 Closure

## PHASE 2 \--- DESIGN SYSTEM & UI CORE: COMPLETE ✅

The project now has a stable visual and reusable component foundation.

The application is no longer only a generated Next.js starter.

It now has:

- HiddenGems brand tokens
- theme infrastructure
- light/dark/system support
- reusable UI primitives
- HiddenGems-specific domain components
- responsive foundations
- a base for future data-driven screens

&nbsp;

---

# 40\. Next Phase \--- Phase 3: Supabase Foundation

The next phase moves from visual foundation to backend/platform foundation.

Expected areas:

Supabase Project

        ↓

Environment Variables

        ↓

Supabase Client Architecture

        ↓

&nbsp;

Authentication

        ↓

Database

        ↓

Storage

        ↓

Row Level Security

        ↓

Core Data Model

The exact implementation order should be reviewed before execution.

---

# 41\. Recommended Phase 3 Scope

## Supabase

- create/configure project
- configure environment variables
- configure client architecture

## Authentication

Initial target:

- email/password
- session handling
- protected areas
- profile foundation

Google authentication can be introduced when appropriate.

## Database

Likely initial entities:

profiles

categories

places

place\_images

reviews

saved\_places

submissions

&nbsp;

These should be finalized before migrations are created.

## Storage

Likely initial bucket:

place-images

with secure policies.

## Security

- RLS
- ownership rules
- authenticated-user policies
- moderator/admin permissions

---

# 42\. Development Rule for Phase 3

Do not build the entire backend in one giant change.

Preferred workflow:

**Understand requirement**

        ↓

**Design smallest correct piece**

        ↓

**Implement**

        ↓

**Verify**

        ↓

**Commit**

        ↓

**Continue**

This keeps the repository stable and makes problems easier to isolate.

---

# 43\. Final Phase Timeline

PHASE 1

Project Foundation

        │

        │ COMPLETE

        ▼

PHASE 2

Design System & UI Core

&nbsp;

&nbsp;

        │ COMPLETE

        ▼

PHASE 3

Supabase Foundation

&nbsp;

&nbsp;

        │ NEXT

        ▼

PHASE 4

Core Product Implementation

&nbsp;

&nbsp;

PHASE 5

&nbsp;

Validation & Real User Testing

        │

        ▼

PHASE 6

&nbsp;

Production Polish & Expansion

---

# 44\. Final Audit

&nbsp;

| Area                                        | Result / Target Phase |
| :------------------------------------------ | :-------------------- |
| Brand identity, Design tokens, Theme engine | ✅ Complete           |
| Light/Dark/System modes, Tailwind v4        | ✅ Complete           |
| shadcn/ui, Base UI, Nova preset             | ✅ Complete           |
| Core primitives & Domain components         | ✅ Complete           |
| Responsive & Build verification, Git push   | ✅ Complete           |
| Supabase Auth, Database, Storage            | ⏭️ Phase 3          |
| Full product UI & MVP features              | ⏭️ Phase 4+         |

# 45\. Completion Statement

**HiddenGems Nepal Phase 2—Design System & UI Core is complete.**

The project now has a reusable foundation built around:

Next.js

\+

TypeScript

\+

Tailwind CSS v4

\+

CSS Design Tokens

\+

next-themes

\+

shadcn/ui

\+

Base UI

\+

Nova preset

\+

Custom HiddenGems components

The next milestone is:

> **Phase 3 \--- Supabase Foundation**

This is where HiddenGems Nepal begins moving from a branded UI foundation toward a real data-backed application.

---

## Official Technical References

- Next.js documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
- shadcn/ui Tailwind v4 documentation: [https://ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)
- shadcn/ui theming documentation: [https://ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming)
- shadcn/ui CLI documentation: [https://ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli)
- shadcn/ui components configuration: [https://ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json)

&nbsp;
