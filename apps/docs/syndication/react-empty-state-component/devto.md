---
title: "Build a React empty state component that actually converts first-time users"
published: false
description: "Users who see blank screens are 3-4x more likely to abandon your product. Here's how to build a typed, accessible EmptyState component with guided actions in React."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/react-empty-state-component
cover_image: https://usertourkit.com/og-images/react-empty-state-component.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-empty-state-component)*

# How to create an empty state with guided action in React

Your users just signed up. They land on the dashboard and see... nothing. No data, no projects, no indication of what to do next. Users who encounter blank screens without guidance are 3-4x more likely to abandon the product entirely, according to [conversion research from Atticus Li](https://atticusli.com/blog/posts/empty-states-conversion-tools-design-users-nothing-yet/). Empty states aren't a design afterthought. They're the most underused onboarding surface in your app.

Most React tutorials on empty states stop at conditional rendering: `if (!data.length) return <p>No items</p>`. That's the bare minimum, and it actively hurts retention. What you actually need is a component that detects the empty condition, presents a single guided action, tracks whether the user follows through, and meets accessibility standards.

By the end of this tutorial, you'll have a typed, accessible `EmptyState` component that guides first-time users toward their first meaningful action.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

You'll create a composable React empty state component system with four parts: a container with ARIA attributes for screen reader announcements, an illustration slot, descriptive copy, and a single CTA button that triggers a guided flow. The component uses a TypeScript discriminated union to handle three variants: `first-use` (new user, no data yet), `no-results` (search returned nothing), and `cleared` (user deleted everything).

```tsx
// src/app/projects/page.tsx
<EmptyState variant="first-use">
  <EmptyState.Illustration>
    <ProjectsIllustration />
  </EmptyState.Illustration>
  <EmptyState.Title>Create your first project</EmptyState.Title>
  <EmptyState.Description>
    Projects organize your work into separate spaces with their own
    settings and team members.
  </EmptyState.Description>
  <EmptyState.Action onClick={handleCreateProject}>
    New project
  </EmptyState.Action>
</EmptyState>
```

## Step 1: Define the empty state types

As of April 2026, at least 9 major design systems ship dedicated EmptyState components (Chakra UI, Shopify Polaris, Atlassian, Ant Design, Vercel Geist, shadcn/ui, PatternFly, Duet, and Agnostic UI), but none of them enforce variant types at the compiler level. A TypeScript discriminated union prevents impossible states at compile time and makes each variant's intent explicit.

```tsx
// src/components/empty-state/types.ts
import type { ReactNode } from "react";

type EmptyStateVariant = "first-use" | "no-results" | "cleared";

interface EmptyStateContextValue {
  variant: EmptyStateVariant;
}

interface EmptyStateProps {
  variant: EmptyStateVariant;
  children: ReactNode;
  className?: string;
}

interface EmptyStateActionProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export type {
  EmptyStateVariant,
  EmptyStateContextValue,
  EmptyStateProps,
  EmptyStateActionProps,
};
```

Three variants cover the states users actually encounter. `first-use` is the onboarding surface. `no-results` is a search or filter dead end. `cleared` is a post-deletion state.

## Step 2: Build the compound component

The compound component pattern separates layout control from accessibility logic, giving consumers full rendering flexibility while the component handles ARIA attributes internally. Chakra UI and Shopify Polaris both use this pattern for their EmptyState components.

```tsx
// src/components/empty-state/empty-state.tsx
"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  EmptyStateContextValue,
  EmptyStateProps,
  EmptyStateActionProps,
} from "./types";

const EmptyStateContext = createContext<EmptyStateContextValue | null>(null);

function useEmptyStateContext() {
  const context = useContext(EmptyStateContext);
  if (!context) {
    throw new Error(
      "EmptyState compound components must be used within <EmptyState>"
    );
  }
  return context;
}

function EmptyStateRoot({ variant, children, className }: EmptyStateProps) {
  return (
    <EmptyStateContext value={{ variant }}>
      <div
        role="status"
        aria-live="polite"
        className={className}
        data-variant={variant}
      >
        {children}
      </div>
    </EmptyStateContext>
  );
}

function Illustration({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true">
      {children}
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  useEmptyStateContext();
  return <h2>{children}</h2>;
}

function Description({ children }: { children: ReactNode }) {
  useEmptyStateContext();
  return <p>{children}</p>;
}

function Action({ onClick, children, className }: EmptyStateActionProps) {
  const { variant } = useEmptyStateContext();
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  );
}

const EmptyState = Object.assign(EmptyStateRoot, {
  Illustration,
  Title,
  Description,
  Action,
});

export { EmptyState, useEmptyStateContext };
```

The `role="status"` and `aria-live="polite"` attributes mean screen readers announce the empty state when it appears, without interrupting the user's current task. The illustration gets `aria-hidden="true"` because decorative SVGs shouldn't be read aloud.

## Step 3: Add guided action with conditional rendering

Empty states with a single guided action convert 67% more first-time users into 90-day active users compared to blank screens. Nielsen Norman Group backs this up: "Do not default to totally empty states."

```tsx
// src/app/projects/page.tsx
"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state/empty-state";
import { ProjectsIllustration } from "@/components/illustrations";
import { CreateProjectDialog } from "@/components/create-project-dialog";

interface Project {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  if (projects.length === 0) {
    return (
      <>
        <EmptyState variant="first-use">
          <EmptyState.Illustration>
            <ProjectsIllustration />
          </EmptyState.Illustration>
          <EmptyState.Title>Create your first project</EmptyState.Title>
          <EmptyState.Description>
            Projects organize your work into separate spaces. Most teams
            start with one project and add more as they grow.
          </EmptyState.Description>
          <EmptyState.Action onClick={() => setShowCreate(true)}>
            New project
          </EmptyState.Action>
        </EmptyState>
        <CreateProjectDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={(project) => {
            setProjects((prev) => [...prev, project]);
            setShowCreate(false);
          }}
        />
      </>
    );
  }

  return <ProjectsList projects={projects} />;
}
```

Notice the single CTA. One button. Hick's Law says decision time increases logarithmically with choices. The copy matters too: "Create your first project" uses active language instead of passive "No projects found."

## Step 4: Track empty state interactions

The two metrics that matter: transition rate (% of users going empty to populated in one session, target >60%) and time-to-first-action (seconds between render and CTA click, target <30s).

```tsx
// src/components/empty-state/use-empty-state-tracking.ts
import { useEffect, useRef, useCallback } from "react";
import type { EmptyStateVariant } from "./types";

interface TrackingEvent {
  variant: EmptyStateVariant;
  action: "viewed" | "cta_clicked" | "dismissed";
  timeOnScreen?: number;
}

function useEmptyStateTracking(
  variant: EmptyStateVariant,
  onTrack: (event: TrackingEvent) => void
) {
  const viewedAt = useRef<number>(0);

  useEffect(() => {
    viewedAt.current = Date.now();
    onTrack({ variant, action: "viewed" });
  }, [variant, onTrack]);

  const trackClick = useCallback(() => {
    const timeOnScreen = Date.now() - viewedAt.current;
    onTrack({ variant, action: "cta_clicked", timeOnScreen });
  }, [variant, onTrack]);

  return { trackClick };
}

export { useEmptyStateTracking };
```

## Common issues

### "Empty state flashes before data loads"

Your data fetch is async and the component renders before the response arrives. Fix it with a loading guard:

```tsx
if (isLoading) return <Skeleton />;
if (projects.length === 0) return <EmptyState variant="first-use">...</EmptyState>;
return <ProjectsList projects={projects} />;
```

### "Screen reader doesn't announce the empty state"

Verify the root container has both `role="status"` and `aria-live="polite"`. For initial page loads, `aria-live` only triggers on DOM changes, so ensure the page has a descriptive `<h1>` and the empty state heading uses `<h2>`.

### "The CTA competes with the nav bar's create button"

Remove one. Hide the nav button when the data set is empty, or visually de-emphasize it. Two equal-weight CTAs for the same action confuse users.

## FAQ

### What is a react empty state component?

A React empty state component renders contextual guidance when a section of your app has no data to display. Instead of a blank screen, it presents an illustration, descriptive copy, and a call-to-action guiding users toward their first meaningful action.

### Should empty states have one CTA or multiple?

One. Hick's Law demonstrates that decision time increases logarithmically with the number of choices. Users encountering an empty state for the first time need a single, clear path forward.

### How do you make empty states accessible?

Use `role="status"` and `aria-live="polite"` on the container so screen readers announce the empty state dynamically. Mark decorative illustrations with `aria-hidden="true"`. Ensure the CTA button has descriptive text and manage focus so keyboard users can reach the action.

### Does adding an empty state component affect React performance?

No measurable impact. The render cost of a few DOM elements, text, and an SVG is negligible. The real consideration is avoiding the flash-of-empty-state pattern: render a skeleton during data fetches so the empty state only appears when the data set is genuinely empty.

---

Full article with Tour Kit integration examples and comparison table: [usertourkit.com/blog/react-empty-state-component](https://usertourkit.com/blog/react-empty-state-component)
