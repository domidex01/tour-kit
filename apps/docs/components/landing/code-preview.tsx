'use client'

import { CopyButton } from '@/components/ui/copy-button'
import { useState } from 'react'

const tabs = [
  {
    id: 'basic',
    label: 'Basic Tour',
    filename: 'App.tsx',
    code: `import { Tour, TourStep, useTour } from '@tour-kit/react';

function App() {
  const { start } = useTour('onboarding');

  return (
    <Tour id="onboarding" onComplete={() => console.log('Done!')}>
      <TourStep
        target="#welcome"
        title="Welcome!"
        content="Let's take a quick tour."
        placement="bottom"
      />
      <TourStep
        target="#features"
        title="Features"
        content="Here are our main features."
        placement="right"
      />

      <button onClick={() => start()}>Start Tour</button>
    </Tour>
  );
}`,
    highlighted: [
      { text: 'import', type: 'keyword' as const },
      { text: ' { Tour, TourStep, useTour } ', type: 'plain' as const },
      { text: 'from', type: 'keyword' as const },
      { text: " '@tour-kit/react'", type: 'string' as const },
      { text: ';\n\n', type: 'plain' as const },
      { text: 'function', type: 'keyword' as const },
      { text: ' App', type: 'function' as const },
      { text: '() {\n  ', type: 'plain' as const },
      { text: 'const', type: 'keyword' as const },
      { text: ' { start } = ', type: 'plain' as const },
      { text: 'useTour', type: 'function' as const },
      { text: '(', type: 'plain' as const },
      { text: "'onboarding'", type: 'string' as const },
      { text: ');\n\n  ', type: 'plain' as const },
      { text: 'return', type: 'keyword' as const },
      { text: ' (\n    ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'Tour', type: 'component' as const },
      { text: ' id', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"onboarding"', type: 'string' as const },
      { text: ' onComplete', type: 'attr' as const },
      { text: '={() => ', type: 'plain' as const },
      { text: 'console', type: 'function' as const },
      { text: '.', type: 'plain' as const },
      { text: 'log', type: 'function' as const },
      { text: '(', type: 'plain' as const },
      { text: "'Done!'", type: 'string' as const },
      { text: ')}', type: 'plain' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'TourStep', type: 'component' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'target', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"#welcome"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'title', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"Welcome!"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'content', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"Let\'s take a quick tour."', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'placement', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"bottom"', type: 'string' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '/>', type: 'bracket' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'TourStep', type: 'component' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'target', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"#features"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'title', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"Features"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'content', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"Here are our main features."', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'placement', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"right"', type: 'string' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '/>', type: 'bracket' as const },
      { text: '\n\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'button', type: 'tag' as const },
      { text: ' onClick', type: 'attr' as const },
      { text: '={() => ', type: 'plain' as const },
      { text: 'start', type: 'function' as const },
      { text: '()}', type: 'plain' as const },
      { text: '>', type: 'bracket' as const },
      { text: 'Start Tour', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'button', type: 'tag' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n    ', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'Tour', type: 'component' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n  );\n}', type: 'plain' as const },
    ],
  },
  {
    id: 'headless',
    label: 'Headless Mode',
    filename: 'CustomTour.tsx',
    code: `import { useTour } from '@tour-kit/core';

function CustomTour() {
  const tour = useTour('setup', {
    steps: [
      { target: '#sidebar', title: 'Navigation' },
      { target: '#search', title: 'Search' },
    ],
  });

  if (!tour.isActive) return null;

  const step = tour.currentStep;
  return (
    <div style={tour.tooltipProps.style}>
      <h3>{step.title}</h3>
      <button onClick={tour.next}>Continue</button>
    </div>
  );
}`,
    highlighted: [
      { text: 'import', type: 'keyword' as const },
      { text: ' { useTour } ', type: 'plain' as const },
      { text: 'from', type: 'keyword' as const },
      { text: " '@tour-kit/core'", type: 'string' as const },
      { text: ';\n\n', type: 'plain' as const },
      { text: 'function', type: 'keyword' as const },
      { text: ' CustomTour', type: 'function' as const },
      { text: '() {\n  ', type: 'plain' as const },
      { text: 'const', type: 'keyword' as const },
      { text: ' tour = ', type: 'plain' as const },
      { text: 'useTour', type: 'function' as const },
      { text: '(', type: 'plain' as const },
      { text: "'setup'", type: 'string' as const },
      { text: ', {\n    steps: [\n      { ', type: 'plain' as const },
      { text: 'target', type: 'attr' as const },
      { text: ': ', type: 'plain' as const },
      { text: "'#sidebar'", type: 'string' as const },
      { text: ', ', type: 'plain' as const },
      { text: 'title', type: 'attr' as const },
      { text: ': ', type: 'plain' as const },
      { text: "'Navigation'", type: 'string' as const },
      { text: ' },\n      { ', type: 'plain' as const },
      { text: 'target', type: 'attr' as const },
      { text: ': ', type: 'plain' as const },
      { text: "'#search'", type: 'string' as const },
      { text: ', ', type: 'plain' as const },
      { text: 'title', type: 'attr' as const },
      { text: ': ', type: 'plain' as const },
      { text: "'Search'", type: 'string' as const },
      { text: ' },\n    ],\n  });\n\n  ', type: 'plain' as const },
      { text: 'if', type: 'keyword' as const },
      { text: ' (!tour.isActive) ', type: 'plain' as const },
      { text: 'return', type: 'keyword' as const },
      { text: ' ', type: 'plain' as const },
      { text: 'null', type: 'keyword' as const },
      { text: ';\n\n  ', type: 'plain' as const },
      { text: 'const', type: 'keyword' as const },
      { text: ' step = tour.currentStep;\n  ', type: 'plain' as const },
      { text: 'return', type: 'keyword' as const },
      { text: ' (\n    ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'div', type: 'tag' as const },
      { text: ' style', type: 'attr' as const },
      { text: '={tour.tooltipProps.style}', type: 'plain' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'h3', type: 'tag' as const },
      { text: '>', type: 'bracket' as const },
      { text: '{step.title}', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'h3', type: 'tag' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'button', type: 'tag' as const },
      { text: ' onClick', type: 'attr' as const },
      { text: '={tour.next}', type: 'plain' as const },
      { text: '>', type: 'bracket' as const },
      { text: 'Continue', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'button', type: 'tag' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n    ', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'div', type: 'tag' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n  );\n}', type: 'plain' as const },
    ],
  },
  {
    id: 'styling',
    label: 'Custom Styling',
    filename: 'StyledTour.tsx',
    code: `import { Tour, TourStep } from '@tour-kit/react';
import './tour.css';

function StyledTour() {
  return (
    <Tour
      id="styled"
      className="my-tour"
      overlayClassName="my-overlay"
    >
      <TourStep
        target="#hero"
        title="New feature!"
        content="Check out what we just shipped."
        className="rounded-2xl shadow-2xl"
        placement="bottom"
        spotlightPadding={8}
        spotlightRadius={12}
      />
    </Tour>
  );
}`,
    highlighted: [
      { text: 'import', type: 'keyword' as const },
      { text: ' { Tour, TourStep } ', type: 'plain' as const },
      { text: 'from', type: 'keyword' as const },
      { text: " '@tour-kit/react'", type: 'string' as const },
      { text: ';\n', type: 'plain' as const },
      { text: 'import', type: 'keyword' as const },
      { text: ' ', type: 'plain' as const },
      { text: "'./tour.css'", type: 'string' as const },
      { text: ';\n\n', type: 'plain' as const },
      { text: 'function', type: 'keyword' as const },
      { text: ' StyledTour', type: 'function' as const },
      { text: '() {\n  ', type: 'plain' as const },
      { text: 'return', type: 'keyword' as const },
      { text: ' (\n    ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'Tour', type: 'component' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: 'id', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"styled"', type: 'string' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: 'className', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"my-tour"', type: 'string' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: 'overlayClassName', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"my-overlay"', type: 'string' as const },
      { text: '\n    ', type: 'plain' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n      ', type: 'plain' as const },
      { text: '<', type: 'bracket' as const },
      { text: 'TourStep', type: 'component' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'target', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"#hero"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'title', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"New feature!"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'content', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"Check out what we just shipped."', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'className', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"rounded-2xl shadow-2xl"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'placement', type: 'attr' as const },
      { text: '=', type: 'plain' as const },
      { text: '"bottom"', type: 'string' as const },
      { text: '\n        ', type: 'plain' as const },
      { text: 'spotlightPadding', type: 'attr' as const },
      { text: '={', type: 'plain' as const },
      { text: '8', type: 'number' as const },
      { text: '}\n        ', type: 'plain' as const },
      { text: 'spotlightRadius', type: 'attr' as const },
      { text: '={', type: 'plain' as const },
      { text: '12', type: 'number' as const },
      { text: '}\n      ', type: 'plain' as const },
      { text: '/>', type: 'bracket' as const },
      { text: '\n    ', type: 'plain' as const },
      { text: '</', type: 'bracket' as const },
      { text: 'Tour', type: 'component' as const },
      { text: '>', type: 'bracket' as const },
      { text: '\n  );\n}', type: 'plain' as const },
    ],
  },
]

const tokenColors: Record<string, string> = {
  keyword: 'text-[#c4a7e7]',
  string: 'text-[#a8cc8c]',
  function: 'text-[#e2cca9]',
  component: 'text-[#89b4fa]',
  tag: 'text-[#7fb4ca]',
  attr: 'text-[#cba6f7]',
  bracket: 'text-[#5a5a6e]',
  number: 'text-[#f5a97f]',
  plain: 'text-[#d4d4d8]',
}

function LineNumbers({ count }: { count: number }) {
  return (
    <div
      className="select-none border-r border-white/[0.06] pl-4 pr-4 text-right font-mono text-[13px] leading-[1.8] text-white/15"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are static and never reorder
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  )
}

export function CodePreview() {
  const [activeTab, setActiveTab] = useState('basic')
  const activeExample = tabs.find((t) => t.id === activeTab) ?? tabs[0]
  const lineCount = activeExample.code.split('\n').length

  return (
    <section className="relative px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-12 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            A few lines of code. <span className="text-[#0197f6]">A complete tour.</span>
          </h2>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Wrap your app with{' '}
            <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[13px] font-semibold text-fd-foreground">
              {'<Tour>'}
            </code>
            , declare your steps, call{' '}
            <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[13px] font-semibold text-fd-foreground">
              start()
            </code>
            .
          </p>
        </div>

        {/* Full-width tabbed code block — edge-to-edge on mobile */}
        <div className="-mx-6 overflow-hidden border-y border-white/[0.08] shadow-2xl shadow-black/25 sm:mx-0 sm:rounded-xl sm:border sm:ring-1 sm:ring-white/[0.04]">
          {/* Title bar with traffic lights */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#16171a] px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[11px] text-white/30">{activeExample.filename}</span>
            <div className="flex-1" />
            <CopyButton text={activeExample.code} className="text-white/20 hover:text-white/60" />
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 border-b border-white/[0.06] bg-[#111215] px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 font-mono text-[12px] font-medium transition-colors ${
                  activeTab === tab.id ? 'text-white/80' : 'text-white/25 hover:text-white/45'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#0197f6]" />
                )}
              </button>
            ))}
          </div>

          {/* Code content with line numbers */}
          <div className="flex overflow-x-auto bg-[#0d0e11] py-4">
            <LineNumbers count={lineCount} />
            <pre className="flex-1 pr-6 font-mono text-[13px] leading-[1.8]">
              <code>
                {activeExample.highlighted.map((token, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens are static per tab and never reorder
                  <span key={i} className={tokenColors[token.type]}>
                    {token.text}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
