# Feature Hints Landing Page

**URL:** `/hints`
**Goal:** Convert developers needing contextual hints, tooltips, and hotspots.
**SEO Target:** "react tooltip hints", "feature discovery hotspot", "contextual hints react"
**Audience:** Product engineers building feature discovery and contextual help.

---

## Section 1: Hero

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Help users discover features                              |
|              without interrupting them.                                |
|                                                                        |
|         Pulsing beacons, contextual tooltips, and smart               |
|         dismissal tracking. Subtle nudges that guide                  |
|         without getting in the way.                                   |
|                                                                        |
|         [Get Started]              [See Demo]                          |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |   +--App UI----------------------------------------------+    |  |
|   |   |                                                      |    |  |
|   |   |   Dashboard     Reports     Settings                 |    |  |
|   |   |                               *                      |    |  |
|   |   |                              (*)  <- pulsing beacon  |    |  |
|   |   |                               *                      |    |  |
|   |   |                                                      |    |  |
|   |   |   +--------+   +--------+   +--------+              |    |  |
|   |   |   | Widget |   | Widget |   | Widget |              |    |  |
|   |   |   |   A    |   |   B    |   |   C  * |              |    |  |
|   |   |   +--------+   +--------+   +------(*)+             |    |  |
|   |   |                                                      |    |  |
|   |   +------------------------------------------------------+    |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: How Hints Work

```
+------------------------------------------------------------------------+
|                                                                        |
|              From beacon to discovery.                                 |
|                                                                        |
|   STATE 1: Idle                STATE 2: Hover/Click                   |
|   +------------------------+  +-----------------------------+         |
|   |                        |  |                             |         |
|   |   [Settings]  (*)      |  |   [Settings]               |         |
|   |               ^        |  |        +------------------+ |         |
|   |               |        |  |        | New! You can now | |         |
|   |     Pulsing dot draws  |  |        | export reports   | |         |
|   |     attention subtly   |  |        | as PDF.          | |         |
|   |                        |  |        |                  | |         |
|   |                        |  |        | [Got it] [Try] | |         |
|   |                        |  |        +------------------+ |         |
|   +------------------------+  +-----------------------------+         |
|                                                                        |
|   STATE 3: Dismissed                                                  |
|   +------------------------+                                          |
|   |                        |                                          |
|   |   [Settings]           |  Beacon disappears after                 |
|   |                        |  dismissal. Persisted so it              |
|   |   Clean. No clutter.   |  won't come back.                       |
|   |                        |                                          |
|   +------------------------+                                          |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 3: Features

```
+------------------------------------------------------------------------+
|                                                                        |
|              Hints that know when to show up                          |
|              and when to go away.                                     |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  PULSING BEACONS                |  |                           | |
|   |                                  |  |  Animated dots that draw  | |
|   |        * . *                     |  |  the eye. Customizable    | |
|   |       . (*) .    <- pulse        |  |  color, size, animation   | |
|   |        * . *       animation     |  |  speed. CSS or custom.    | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  SMART DISMISSAL                |  |                           | |
|   |                                  |  |  Track which hints each   | |
|   |  hint-1: dismissed (2d ago)      |  |  user has seen. Never     | |
|   |  hint-2: active                  |  |  show the same hint       | |
|   |  hint-3: dismissed (1w ago)      |  |  twice. Supports          | |
|   |                                  |  |  localStorage, cookies,   | |
|   |  Storage: localStorage |         |  |  or custom backend.       | |
|   |           cookies | custom       |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  CONDITIONAL DISPLAY             |  |                           | |
|   |                                  |  |  Show hints only when     | |
|   |  if (user.plan === 'pro') {      |  |  conditions are met.      | |
|   |    showHint('advanced-export')   |  |  User segment, feature    | |
|   |  }                               |  |  flag, page context,      | |
|   |                                  |  |  usage count -- any       | |
|   |  if (visits > 3 && !usedExport) {|  |  condition you define.    | |
|   |    showHint('export-feature')    |  |                           | |
|   |  }                               |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 4: Code Example

```
+------------------------------------------------------------------------+
|                                                                        |
|              Add hints in under a minute.                             |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  import { HintProvider, Hint, HintHotspot }                    |  |
|   |    from '@tour-kit/hints'                                      |  |
|   |                                                                |  |
|   |  <HintProvider>                                                |  |
|   |    <div style={{ position: 'relative' }}>                      |  |
|   |      <Button>Settings</Button>                                 |  |
|   |                                                                |  |
|   |      <Hint id="new-settings">                                  |  |
|   |        <HintHotspot />                                         |  |
|   |        <HintContent>                                           |  |
|   |          New settings panel available!                         |  |
|   |        </HintContent>                                          |  |
|   |      </Hint>                                                   |  |
|   |    </div>                                                      |  |
|   |  </HintProvider>                                               |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   [Copy Code]                          [Open in StackBlitz ->]        |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Guide discovery without disruption.                      |
|                                                                        |
|         $ pnpm add @tour-kit/hints                         [copy]    |
|                                                                        |
|         [Read the Docs]            [View Examples]                    |
|                                                                        |
+------------------------------------------------------------------------+
```
