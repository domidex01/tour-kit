# Comparison Landing Page

**URL:** `/compare`
**Goal:** Capture developers evaluating alternatives and convert them to Tour Kit.
**SEO Target:** "appcues alternative", "userflow vs", "react tour library comparison"
**Audience:** Developers actively comparing onboarding tools.

---

## Section 1: Hero

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Tour Kit vs. the rest.                                    |
|                                                                        |
|         An honest comparison. No asterisks, no gotchas.               |
|         See exactly how Tour Kit stacks up against                    |
|         the most popular alternatives.                                |
|                                                                        |
|   [vs Appcues]  [vs Userflow]  [vs Intro.js]  [vs Shepherd]          |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: Master Comparison Table

```
+------------------------------------------------------------------------+
|                                                                        |
|              The full picture.                                        |
|                                                                        |
|   +--------------------------------------------------------------------+
|   |                 | Tour Kit  | Appcues  | Userflow | Intro.js| Shep|
|   |-----------------|-----------|----------|----------|---------|-----|
|   | TYPE            |           |          |          |         |     |
|   | Approach        | Code-first| No-code  | No-code  | Code    | Code|
|   | Framework       | React     | Any(SaaS)| Any(SaaS)| Vanilla | Any |
|   | License         | MIT       | Propriet.| Propriet.| AGPL    | MIT |
|   |                 |           |          |          |         |     |
|   | PRICING         |           |          |          |         |     |
|   | Base            | Free      | $249/mo  | $200/mo  | $9.99*  | Free|
|   | Per-user cost   | $0        | Per MAU  | Per MAU  | $0      | $0  |
|   | Self-hosted     | Yes       | No       | No       | Yes     | Yes |
|   |                 |           |          |          |         |     |
|   | FEATURES        |           |          |          |         |     |
|   | Product tours   | Y         | Y        | Y        | Y       | Y   |
|   | Checklists      | Y         | Y        | Y        | N       | N   |
|   | Hints/Hotspots  | Y         | Y        | Y        | Y       | N   |
|   | Announcements   | Y         | Y        | Y        | N       | N   |
|   | Adoption track  | Y         | Y        | N        | N       | N   |
|   | Analytics       | Y(plugin) | Built-in | Built-in | N       | N   |
|   | Scheduling      | Y         | Y        | Y        | N       | N   |
|   | Media embeds    | Y         | Limited  | Limited  | N       | N   |
|   |                 |           |          |          |         |     |
|   | DEVELOPER EXP   |           |          |          |         |     |
|   | Headless mode   | Y         | N        | N        | N       | N   |
|   | TypeScript      | Full      | Partial  | Partial  | N       | Y   |
|   | Tree-shakeable  | Y         | N/A      | N/A      | N       | Y   |
|   | Bundle size     | <8KB      | N/A(SaaS)| N/A(SaaS)| 29KB    | 41KB|
|   | Router adapters | Y         | N/A      | N/A      | N       | N   |
|   |                 |           |          |          |         |     |
|   | ACCESSIBILITY   |           |          |          |         |     |
|   | WCAG 2.1 AA    | Y         | Partial  | Partial  | N       | Part|
|   | Focus trapping  | Y         | Partial  | Partial  | N       | Y   |
|   | Keyboard nav    | Y         | Partial  | Partial  | Limited | Y   |
|   | Screen reader   | Y         | Partial  | Partial  | N       | Part|
|   +--------------------------------------------------------------------+
|                                                                        |
|   * Intro.js: Free for OSS, $9.99 one-time for commercial             |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- All data must be verifiable. Link to sources.
- "Partial" means some support but not comprehensive
- Update this table regularly as competitors ship features

---

## Section 3: Individual Comparisons (Tabs)

```
+------------------------------------------------------------------------+
|                                                                        |
|   [vs Appcues]  [vs Userflow]  [vs Intro.js]  [vs Shepherd]          |
|                                                                        |
|   VS APPCUES                                                          |
|   +------------------------------------------------------------------+|
|   |                                                                  ||
|   |  Appcues is great if you want:              Tour Kit wins when:  ||
|   |  - No-code builder                          - You need full      ||
|   |  - Non-technical team access                   customization     ||
|   |  - Built-in analytics dashboard              - Budget matters    ||
|   |                                              - You want to own   ||
|   |  But consider Tour Kit if:                     your data         ||
|   |  - $249/mo+ is too much                     - Design system      ||
|   |  - You need design system match                matching matters  ||
|   |  - Data privacy matters                     - A11y is critical   ||
|   |  - You have React developers                                     ||
|   |                                                                  ||
|   |  HONEST TAKE:                                                    ||
|   |  Choose Appcues if your team is non-technical and budget isn't   ||
|   |  a constraint. Choose Tour Kit if you have developers and want   ||
|   |  full control.                                                   ||
|   |                                                                  ||
|   +------------------------------------------------------------------+|
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Be genuinely honest. Acknowledge where competitors are better.
- "Honest take" section builds trust by being fair.
- Each comparison should be a separate tab/section.

---

## Section 4: Migration Guide Teaser

```
+------------------------------------------------------------------------+
|                                                                        |
|              Switching is easier than you think.                       |
|                                                                        |
|   +------------------------------------------------------------------+|
|   |                                                                  ||
|   |  FROM APPCUES:        FROM INTRO.JS:        FROM SHEPHERD:       ||
|   |                                                                  ||
|   |  1. Install Tour Kit  1. Replace imports    1. Replace imports   ||
|   |  2. Map flows to      2. Convert steps      2. Convert tour     ||
|   |     Tour Kit steps       array format          definitions      ||
|   |  3. Remove Appcues    3. Remove Intro.js    3. Remove Shepherd  ||
|   |     script tag           import                import           ||
|   |                                                                  ||
|   |  [Migration Guide ->]                                            ||
|   |                                                                  ||
|   +------------------------------------------------------------------+|
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Ready to switch?                                         |
|                                                                        |
|         $ pnpm add @tour-kit/react                         [copy]    |
|                                                                        |
|         [Get Started]            [Read Migration Guide]               |
|                                                                        |
+------------------------------------------------------------------------+
```
