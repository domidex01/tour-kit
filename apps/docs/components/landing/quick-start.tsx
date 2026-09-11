'use client'

import { SectionHead } from '@/components/landing/section-head'
import { highlightCode } from '@/components/landing/syntax-highlight'
import { CopyButton } from '@/components/ui/copy-button'
import { useState } from 'react'

/**
 * Figma 3792:1894 (light) / 3945:1894 (dark).
 *
 * The section gained a second axis in the redesign: the step list on the left
 * picks WHAT you are doing, the tabs in the terminal bar pick WHICH framework
 * you are doing it in. That is the section's whole claim — "the same four
 * steps in React, Vue and Svelte, only the adapter package changes" — so the
 * snippets below are the real APIs of each binding (`@tour-kit/vue` provides
 * `provideTourKit`/`useTour`, `@tour-kit/svelte` provides
 * `provideTourKit`/`getTour`), lifted from examples/vue-app and
 * examples/svelte-app rather than written to look plausible.
 */
const frameworks = [
  { id: 'react', label: 'React', pkg: '@tour-kit/react' },
  { id: 'vue', label: 'Vue', pkg: '@tour-kit/vue' },
  { id: 'svelte', label: 'Svelte', pkg: '@tour-kit/svelte' },
] as const

type FrameworkId = (typeof frameworks)[number]['id']

/**
 * The install transcript carries no byte counts on purpose. The mockup prints
 * a size next to each line, but the only sizes this repo actually measures are
 * the gzip budgets in CLAUDE.md, and they do not agree with the mockup's — so
 * the line keeps the design's shape (package, then its role) and drops the
 * number rather than shipping a figure nothing verifies.
 */
const install = (pkg: string) => `$ pnpm add ${pkg}

+ @tour-kit/core   the engine, identical in every framework
+ ${pkg}   the adapter, the only line that changes

Done.
$`

const steps = [
  {
    title: 'Install',
    description: 'One command, zero config.',
    code: {
      react: install('@tour-kit/react'),
      vue: install('@tour-kit/vue'),
      svelte: install('@tour-kit/svelte'),
    },
  },
  {
    title: 'Wrap your app',
    description: 'Mounted once, at your app root.',
    code: {
      react: `import { TourProvider } from '@tour-kit/react';
import { tours } from './tours';

export default function Layout({ children }) {
  return (
    <TourProvider tours={tours}>
      {children}
    </TourProvider>
  );
}`,
      vue: `<script setup>
import { provideTourKit } from '@tour-kit/vue';
import { tours } from './tours';

provideTourKit({ tours });
</script>

<template>
  <RouterView />
</template>`,
      svelte: `<script>
  import { provideTourKit } from '@tour-kit/svelte';
  import { tours } from '$lib/tours';

  let { children } = $props();

  provideTourKit({ tours });
</script>

{@render children()}`,
    },
  },
  {
    title: 'Define your steps',
    description: 'Declarative steps with target selectors.',
    code: {
      react: `import { Tour, TourStep } from '@tour-kit/react';

export function Onboarding() {
  return (
    <Tour id="welcome">
      <TourStep
        target="#sidebar"
        title="Navigation"
        content="Browse your projects here."
        placement="right"
      />
      <TourStep
        target="#search"
        title="Search"
        content="Find anything instantly."
      />
    </Tour>
  );
}`,
      vue: `export const tours = [
  {
    id: 'welcome',
    steps: [
      {
        target: '#sidebar',
        title: 'Navigation',
        content: 'Browse your projects here.',
        placement: 'right',
      },
      {
        target: '#search',
        title: 'Search',
        content: 'Find anything instantly.',
      },
    ],
  },
];`,
      svelte: `export const tours = [
  {
    id: 'welcome',
    steps: [
      {
        target: '#sidebar',
        title: 'Navigation',
        content: 'Browse your projects here.',
        placement: 'right',
      },
      {
        target: '#search',
        title: 'Search',
        content: 'Find anything instantly.',
      },
    ],
  },
];`,
    },
  },
  {
    title: 'Start the tour',
    description: 'One call, anywhere in your app.',
    code: {
      react: `import { useTour } from '@tour-kit/react';

export function StartButton() {
  const { start } = useTour('welcome');

  return (
    <button onClick={() => start()}>
      Take a tour
    </button>
  );
}`,
      vue: `<script setup>
import { useTour } from '@tour-kit/vue';

const kit = useTour();
</script>

<template>
  <button @click="kit.start('welcome')">
    Take a tour
  </button>
</template>`,
      svelte: `<script>
  import { getTour } from '@tour-kit/svelte';

  const kit = getTour();
</script>

<button onclick={() => kit.start('welcome')}>
  Take a tour
</button>`,
    },
  },
] as const

export function QuickStart() {
  const [active, setActive] = useState(0)
  const [framework, setFramework] = useState<FrameworkId>('react')
  const code = steps[active].code[framework]

  return (
    <section className="px-6 py-28 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead
          title={
            <>
              Ship your first tour
              <br className="hidden sm:block" /> in 2 minutes
            </>
          }
        >
          Install, wrap, define, start. The same four steps in React, Vue and Svelte — only the
          adapter package changes.
        </SectionHead>

        <div className="mt-14 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
          {/* Step list — horizontal on narrow viewports, a rail on desktop. */}
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
            {steps.map((s, i) => {
              const isActive = i === active
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group relative flex w-[248px] shrink-0 items-start gap-4 rounded-xl p-4 text-left transition-colors lg:w-auto lg:rounded-l-none ${
                    isActive ? 'bg-fd-muted' : 'hover:bg-fd-muted/50'
                  }`}
                >
                  {/* The 3px active rail (Figma 3792:1910) — inset 12px from
                      each end of the row rather than full height. */}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-3 bottom-3 left-0 hidden w-[3px] rounded-r-full bg-[var(--tk-cta)] lg:block"
                    />
                  ) : null}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${
                      isActive
                        ? 'bg-[var(--tk-cta)] text-[var(--tk-cta-ink)]'
                        : 'bg-fd-secondary text-fd-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block text-[15px] font-semibold leading-[23px] transition-colors ${
                        isActive ? 'text-fd-foreground' : 'text-fd-muted-foreground'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-fd-muted-foreground">
                      {s.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Terminal card */}
          <div className="overflow-hidden rounded-xl border border-[var(--tk-card-edge)] bg-fd-muted shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--tk-card-edge)] bg-fd-secondary px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                {/* 42x10 in the design: three 10px lights, 6px apart. */}
                <div aria-hidden="true" className="flex shrink-0 gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>

                <div
                  role="tablist"
                  aria-label="Framework"
                  className="flex min-w-0 gap-1.5 overflow-x-auto"
                >
                  {frameworks.map((f) => {
                    const selected = f.id === framework
                    return (
                      <button
                        key={f.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setFramework(f.id)}
                        className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] leading-5 transition-colors ${
                          selected
                            ? 'border border-[color-mix(in_srgb,var(--tk-cta)_45%,transparent)] bg-fd-background text-fd-foreground'
                            : 'border border-transparent text-fd-muted-foreground hover:text-fd-foreground'
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                  <span className="shrink-0 rounded-md border border-dashed border-[var(--tk-card-edge)] px-2.5 py-1 text-[12px] leading-5 text-fd-muted-foreground">
                    + more soon
                  </span>
                </div>
              </div>

              <CopyButton text={code} className="shrink-0 text-fd-muted-foreground" />
            </div>

            <div className="flex min-h-[276px] overflow-x-auto py-4">
              <div
                className="shrink-0 select-none border-r border-[var(--tk-card-edge)] px-4 text-right font-mono text-[13px] leading-[1.8] text-fd-muted-foreground/50"
                aria-hidden="true"
              >
                {code.split('\n').map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are static and never reorder
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="flex-1 px-4 font-mono text-[13px] leading-[1.8]">
                <code>{highlightCode(code)}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
