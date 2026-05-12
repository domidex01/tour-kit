# Phase 0 decisions

These three calls are made *now* so Phases 1, 3, 4, and 7a don't re-litigate
them at execution time. Each is one decision + one sentence of justification.

## Chart dependency for AdoptionFunnel
Decision: Chart: native CSS bars (no recharts peer).
Reason: matches the existing AdoptionDashboard style, keeps the adoption
package bundle flat, and avoids registering a new optional peer for a feature
that draws four rectangles.

## Codemod tool for Phase 7a
Decision: Codemod tool: jscodeshift.
Reason: the Task 0.7 spike round-trips a real Joyride fixture through the
TSX parser without whitespace mangling or `[object Object]` artifacts, and
`@types/jscodeshift@^0.12.0` resolves under our strict TS config — no need
to spike ts-morph.

## Diagnostic extension contract
Decision: Diagnostic extension: DiagnosticGate interface in @tour-kit/core,
typed-only. Upper packages register concrete gates via TourProvider props.
Reason: keeps @tour-kit/core at the bottom of the dependency graph so it
never imports from @tour-kit/license, @tour-kit/scheduling, or any other
upper package — that inversion is what makes the gate API safe to extend.
