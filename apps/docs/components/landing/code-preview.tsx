import { CopyButton } from '@/components/ui/copy-button'

const codeExample = `import { Tour, TourStep, useTour } from '@tour-kit/react';

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
      <div id="welcome">Welcome Section</div>
      <div id="features">Features Section</div>
    </Tour>
  );
}`

export function CodePreview() {
  return (
    <section className="border-y border-fd-border bg-fd-muted/30 px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          {/* Left — explanation */}
          <div className="lg:sticky lg:top-24">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
              A few lines of code, <span className="text-[var(--tk-primary)]">a complete tour</span>
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-fd-muted-foreground">
              <p>
                Wrap your app with{' '}
                <code className="rounded-md bg-fd-muted px-1.5 py-0.5 font-mono text-[13px] font-semibold text-fd-foreground">
                  {'<Tour>'}
                </code>
                , declare your steps, and call{' '}
                <code className="rounded-md bg-fd-muted px-1.5 py-0.5 font-mono text-[13px] font-semibold text-fd-foreground">
                  start()
                </code>
                .
              </p>
              <p>
                TourKit handles positioning, focus management, and keyboard navigation. Every
                component is composable — swap out the tooltip, overlay, or navigation without
                fighting the library.
              </p>
            </div>
          </div>

          {/* Right — code */}
          <div className="overflow-hidden rounded-xl border border-fd-border shadow-sm">
            <div className="flex items-center justify-between border-b border-fd-border bg-fd-card px-4 py-2.5">
              <span className="text-xs font-semibold text-fd-muted-foreground">App.tsx</span>
              <CopyButton
                text={codeExample}
                className="text-fd-muted-foreground hover:text-fd-foreground"
              />
            </div>

            <pre className="overflow-x-auto bg-[#1a1b1e] p-5 text-[13px] leading-[1.7]">
              <code className="text-[#d4d4d8]">
                <span className="text-[#c4a7e7]">import</span>
                {' { Tour, TourStep, useTour } '}
                <span className="text-[#c4a7e7]">from</span>
                <span className="text-[#a8cc8c]"> &apos;@tour-kit/react&apos;</span>;{'\n\n'}
                <span className="text-[#c4a7e7]">function</span>
                <span className="text-[#e2cca9]"> App</span>() {'{'}
                {'\n  '}
                <span className="text-[#c4a7e7]">const</span>
                {' { start } = '}
                <span className="text-[#e2cca9]">useTour</span>(
                <span className="text-[#a8cc8c]">&apos;onboarding&apos;</span>);
                {'\n\n  '}
                <span className="text-[#c4a7e7]">return</span> ({'\n    '}
                <span className="text-[#5a5a6e]">{'<'}</span>
                <span className="text-[#89b4fa]">Tour</span>
                <span className="text-[#cba6f7]"> id</span>=
                <span className="text-[#a8cc8c]">&quot;onboarding&quot;</span>
                <span className="text-[#cba6f7]"> onComplete</span>
                {'={()'}
                {' => '}
                <span className="text-[#e2cca9]">console</span>.
                <span className="text-[#e2cca9]">log</span>(
                <span className="text-[#a8cc8c]">&apos;Done!&apos;</span>){'}'}
                <span className="text-[#5a5a6e]">{'>'}</span>
                {'\n      '}
                <span className="text-[#5a5a6e]">{'<'}</span>
                <span className="text-[#89b4fa]">TourStep</span>
                {'\n        '}
                <span className="text-[#cba6f7]">target</span>=
                <span className="text-[#a8cc8c]">&quot;#welcome&quot;</span>
                {'\n        '}
                <span className="text-[#cba6f7]">title</span>=
                <span className="text-[#a8cc8c]">&quot;Welcome!&quot;</span>
                {'\n        '}
                <span className="text-[#cba6f7]">content</span>=
                <span className="text-[#a8cc8c]">&quot;Let&apos;s take a quick tour.&quot;</span>
                {'\n        '}
                <span className="text-[#cba6f7]">placement</span>=
                <span className="text-[#a8cc8c]">&quot;bottom&quot;</span>
                {'\n      '}
                <span className="text-[#5a5a6e]">{'/>'}</span>
                {'\n\n      '}
                <span className="text-[#5a5a6e]">{'<'}</span>
                <span className="text-[#7fb4ca]">button</span>
                <span className="text-[#cba6f7]"> onClick</span>
                {'={()'}
                {' => '}
                <span className="text-[#e2cca9]">start</span>
                {'()'}
                {'}'}
                <span className="text-[#5a5a6e]">{'>'}</span>
                Start Tour
                <span className="text-[#5a5a6e]">{'</'}</span>
                <span className="text-[#7fb4ca]">button</span>
                <span className="text-[#5a5a6e]">{'>'}</span>
                {'\n    '}
                <span className="text-[#5a5a6e]">{'</'}</span>
                <span className="text-[#89b4fa]">Tour</span>
                <span className="text-[#5a5a6e]">{'>'}</span>
                {'\n  );'}
                {'\n}'}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
