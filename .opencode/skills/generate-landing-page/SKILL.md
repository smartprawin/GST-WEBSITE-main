---
name: generate-landing-page
description: Use when the user asks to create, generate, or build a landing page, hero section, marketing page, or single-page website. Handles HTML/CSS landing pages with responsive design, modern styling, and conversion-focused layouts.
---

# Generate Landing Page

Use this skill to generate professional, responsive landing pages.

## Workflow

1. **Gather requirements** — Ask the user about:
   - Purpose/product/service
   - Target audience
   - Key sections (hero, features, testimonials, CTA, etc.)
   - Color scheme or branding preferences
   - Any specific content or copy

2. **Generate the page** — Create a single HTML file with embedded CSS (or separate files if preferred):
   - Use semantic HTML5 elements
   - Mobile-first responsive design
   - Clean, modern styling
   - Smooth scroll behavior
   - Accessible markup (proper headings, alt text, ARIA labels)

3. **Common sections** to include unless told otherwise:
   - Navigation bar
   - Hero section with CTA
   - Features/benefits
   - Social proof (testimonials, logos, stats)
   - Pricing (if applicable)
   - FAQ
   - Footer with contact/links

## Style Guidelines

- Use CSS custom properties for theming
- Prefer system font stacks or Google Fonts
- Ensure sufficient color contrast (WCAG AA)
- Use `rem`/`em` for spacing, `px` for borders
- Add hover/focus states for interactive elements
- Include subtle animations (fade-in, slide-up) where appropriate

## Output

- Default to a single `index.html` file with inline `<style>` and minimal `<script>`
- If the project already has a structure, match the existing conventions
- Place generated files in the project root or a `landing-page/` subdirectory based on context
