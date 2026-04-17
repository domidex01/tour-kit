# Building Product Tours with shadcn/ui Components

## How to add accessible onboarding flows to your React app without fighting your design system

*Originally published at [usertourkit.com](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)*

shadcn/ui has over 75,000 GitHub stars and is the most popular React UI library for three years running. But it has no product tour component.

Radix UI, the headless layer underneath shadcn/ui, has an open discussion from 2022 requesting a tour primitive. A team member acknowledged the accessibility challenge: the pattern needs to "isolate portions of the rendered page rather than separate modal content." That's a hard problem. It was never built.

Most React product tour libraries (React Joyride, Reactour) ship their own tooltip UI with inline styles. If you use shadcn/ui, you end up fighting CSS specificity to make the tour match your design system. The alternative is hacking together a Popover with a backdrop div, which breaks focus management and accessibility.

Tour Kit takes a different approach. It's a headless product tour library (under 8KB gzipped) that gives you the tour engine — step sequencing, element highlighting, keyboard navigation, focus trapping, screen reader announcements — while you render steps with your existing shadcn/ui components.

The result is a tour that uses your Card, Button, Badge, and Progress components directly. No style overrides. No `!important`. Dark mode works because your CSS variables work.

## The core idea: your components, Tour Kit's logic

Here's the complete tour tooltip, built from shadcn/ui primitives:

```
import { useTour } from '@tourkit/react'
import { Card, CardContent, CardFooter, CardHeader }
  from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function TourTooltip() {
  const { currentStep, next, prev, stop,
    isFirst, isLast, progress } = useTour()

  if (!currentStep) return null

  return (
    <Card className="w-80 shadow-lg"
      role="dialog" aria-label={currentStep.title}>
      <CardHeader>
        <Badge variant="secondary">
          {progress.current} of {progress.total}
        </Badge>
      </CardHeader>
      <CardContent>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.content}</p>
      </CardContent>
      <CardFooter>
        {!isFirst && <Button variant="outline"
          onClick={prev}>Back</Button>}
        <Button onClick={isLast ? stop : next}>
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

Every element is a shadcn/ui primitive. Change your `--primary` CSS variable from blue to purple, and the tour buttons update automatically. No configuration needed.

## Why not just use Radix Popover?

I tried it. Three problems:

1. **No multi-step management.** Popover is a single-element primitive. You'd need to build your own state machine for step ordering, navigation, and completion tracking.

2. **Focus breaks between steps.** Closing one Popover and opening another at a different target drops focus to the body element. Screen readers lose context.

3. **No overlay isolation.** Dimming everything except the highlighted element requires z-index coordination that Popover doesn't handle.

## Accessibility: the gap nobody fills

Smashing Magazine's guide to React product tours, the top-ranking result for "product tour React app," doesn't mention accessibility once. The WAI-ARIA Authoring Practices Guide doesn't have a "tour" pattern.

Tour Kit ships with WCAG 2.1 AA compliance built in: keyboard navigation (Escape, Tab, Arrow keys), focus trapping during active steps, focus restoration when the tour ends, and live region announcements for screen readers.

## The honest tradeoffs

Tour Kit has no visual builder. Steps are defined in TypeScript, so a developer needs to be involved. The community is smaller than React Joyride (5,100+ stars). If your product team needs a no-code drag-and-drop editor, this isn't the right fit.

But if your team writes React and uses shadcn/ui, defining tour steps in code gives you version control, type checking, and code review for free.

## Full tutorial

The complete step-by-step tutorial with all code examples, three tooltip variations, troubleshooting for common shadcn/ui issues, and comparison table: [usertourkit.com/blog/shadcn-ui-product-tour-tutorial](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
