---
name: distinctive-frontend-design
description: "Use when building, reviewing, or redesigning frontend interfaces that need a bold visual identity, polished UX, responsive layout, accessible interactions, modern React/Next.js implementation, or a non-generic UI direction."
argument-hint: "Design and build a distinctive frontend experience"
---

# Distinctive Frontend Design

## What This Skill Does
- Turns rough frontend requirements into a deliberate visual direction.
- Guides implementation toward interfaces that feel crafted, not template-driven.
- Keeps the work grounded in usability, responsiveness, and accessibility.

## When To Use
- Starting a new UI, page, dashboard, landing page, or component set.
- Refactoring an interface that feels generic, flat, or inconsistent.
- Reviewing frontend work for visual quality, interaction polish, and product clarity.

## Workflow
1. Read the product goal and decide what feeling the interface should create.
2. Define a visual language before coding:
   - typography style
   - color direction
   - spacing rhythm
   - surface, border, and shadow treatment
   - motion style
3. Choose one strong design direction and commit to it instead of mixing patterns.
4. Build a clear information hierarchy with purposeful layout, not default boilerplate.
5. Add motion only where it explains state or improves emphasis.
6. Make the UI responsive from the start for mobile, tablet, and desktop.
7. Check accessibility:
   - semantic structure
   - keyboard support
   - contrast
   - focus states
   - readable density
8. Review the result against the anti-pattern list below and remove anything that looks generic.

## Decision Rules
- If the UI feels safe or interchangeable, push the concept further with a clearer type system, stronger contrast, or a more memorable layout.
- If the screen is data-heavy, prioritize hierarchy, density control, and fast scanning over decorative effects.
- If the screen is user-facing and brandable, use one signature element consistently instead of many small stylistic tricks.
- If a pattern improves clarity but adds clutter, keep the simpler version.

## Design Principles
- Prefer expressive typography over default system-heavy layouts when the product allows it.
- Use a defined palette with meaningful contrast, not generic purple-on-white combinations.
- Build depth with surfaces, gradients, texture, and composition instead of flat repetition.
- Keep interactions intentional: hover, focus, loading, empty, and success states should feel designed.
- Make spacing and alignment feel exact; small inconsistencies read as low quality.

## Anti-Patterns To Avoid
- Generic card grids with no visual hierarchy.
- Overusing shadows, borders, or blur just to create novelty.
- Animating everything instead of a few meaningful moments.
- Copying a UI kit without adapting it to the product.
- Ignoring mobile constraints until the end.
- Adding visual complexity that makes the interface harder to understand.

## Completion Check
- The screen has a clear visual identity.
- The layout works on small and large screens.
- The UI reads quickly and feels deliberate.
- Accessibility basics are in place.
- The final result does not look like a default starter template.

## Optional References
- If the project needs design rules or reusable tokens, add them in a nearby reference file and link to it from here.