

# Professional Visual Effects Upgrade

## Current State
The landing page has a clean layout but feels flat and static. The only visual effect is a basic fade-in on scroll (opacity transition). There's no depth, motion hierarchy, or visual polish that separates a professional SaaS page from a template.

## Proposed Visual Effects

### 1. Staggered Scroll Reveal Animations
Instead of entire sections fading in at once, individual elements (headings, cards, list items) will animate in one after another with a slight delay, creating a cascading "waterfall" effect.

- **Hero**: Badge slides down, headline types/fades in, subtitle fades up with delay, buttons scale in
- **Problem cards**: Each card fades up with a 100ms stagger (card 1, then card 2, etc.)
- **System steps**: Each step slides in from the left sequentially
- **Monthly deliverables**: Cards pop in with a stagger
- **Pricing tiers**: Cards slide up with stagger, highlighted card slightly delayed for emphasis

### 2. Parallax Depth on Hero Dashboard
The DashboardMockup component will have a subtle CSS parallax effect -- it scrolls slightly slower than the page content above it, creating a sense of depth and making the hero feel layered and premium.

### 3. Glassmorphism on Sticky Header
When scrolled, the header already blurs, but we'll enhance it with a subtle frosted-glass border-bottom glow and a barely-visible gradient line in the brand yellow color.

### 4. Hover Microinteractions on Cards
- **Problem cards**: Subtle lift (translateY -4px) + shadow expansion + left border accent in yellow
- **System step cards**: Border color transition to yellow + icon pulse
- **Pricing cards**: Gentle scale-up (1.02) + shadow deepening
- **Deliverable cards**: Icon rotates slightly + background tint shift

### 5. Animated Gradient Accent Line
A thin animated gradient line (yellow to transparent) that sits beneath section headings, drawing the eye and adding brand polish.

### 6. Dashboard Mockup Enhancements
- Subtle floating animation (gentle up-down bob) on the dashboard to make it feel alive
- The green pulse dot already exists -- we'll add a slow shimmer effect across the dashboard surface
- Bar chart bars animate in (grow from bottom) when the dashboard scrolls into view

### 7. CTA Button Effects
- Primary buttons get a subtle shine/sweep animation (a light streak moves across the button surface periodically)
- Hover state adds a glow shadow in brand yellow
- Click state has a satisfying press-down scale

### 8. Smooth Section Transitions
Add subtle background color transitions between sections using gradient overlaps instead of hard edges, making the page feel like one continuous flow.

---

## Technical Approach

### Files to modify:
- **`tailwind.config.ts`** -- Add new keyframes: `float`, `shimmer`, `shine-sweep`, `grow-up`, `slide-in-left`, `fade-up`; add animation utilities; add hover utility classes
- **`src/index.css`** -- Add CSS for gradient section dividers, glassmorphism header enhancement, animated accent lines
- **`src/hooks/useScrollAnimation.tsx`** -- Extend to support stagger delays (accept a `delay` parameter and expose it)
- **`src/components/HeroSection.tsx`** -- Add staggered child animations with sequential delays
- **`src/components/ProblemSection.tsx`** -- Add staggered card reveals
- **`src/components/SystemSection.tsx`** -- Add sequential step slide-in animations
- **`src/components/MonthlySection.tsx`** -- Add staggered card pop-in
- **`src/components/WhoIsForSection.tsx`** -- Add staggered list item reveals
- **`src/components/PricingSection.tsx`** -- Add staggered tier card animations + enhanced hover states
- **`src/components/ComparisonSection.tsx`** -- Add row-by-row reveal animation
- **`src/components/FinalCTA.tsx`** -- Add entrance animation with scale emphasis
- **`src/components/StickyHeader.tsx`** -- Add gradient bottom border glow on scroll
- **`src/components/DashboardMockup.tsx`** -- Add floating animation + bar chart grow-in effect

### No new dependencies
All effects use CSS animations, Tailwind keyframes, and the existing IntersectionObserver hook -- keeping the bundle lean.

