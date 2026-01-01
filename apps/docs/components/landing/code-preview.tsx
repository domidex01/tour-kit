import { CopyButton } from '@/components/ui/copy-button';

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
}`;

export function CodePreview() {
  return (
    <section className='px-4 py-24'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>Simple to Use</h2>
          <p className='text-lg text-fd-muted-foreground'>
            Get started with just a few lines of code.
          </p>
        </div>

        <div className='relative overflow-hidden rounded-xl border border-fd-border bg-[#1e1e1e]'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-fd-border/10 bg-[#2d2d2d] px-4 py-2'>
            <div className='flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-[#ff5f56]' />
              <div className='h-3 w-3 rounded-full bg-[#ffbd2e]' />
              <div className='h-3 w-3 rounded-full bg-[#27c93f]' />
            </div>
            <span className='text-xs text-gray-400'>App.tsx</span>
            <CopyButton
              text={codeExample}
              className='text-gray-400 hover:text-white'
            />
          </div>

          {/* Code */}
          <pre className='overflow-x-auto p-4 text-sm leading-relaxed'>
            <code className='text-gray-300'>
              <span className='text-[#c586c0]'>import</span>
              {' { Tour, TourStep, useTour } '}
              <span className='text-[#c586c0]'>from</span>
              <span className='text-[#ce9178]'> '@tour-kit/react'</span>;{
                '\n\n'
              }
              <span className='text-[#c586c0]'>function</span>
              <span className='text-[#dcdcaa]'> App</span>() {'{'}
              {'\n  '}
              <span className='text-[#c586c0]'>const</span>
              {' { start } = '}
              <span className='text-[#dcdcaa]'>useTour</span>(
              <span className='text-[#ce9178]'>'onboarding'</span>);
              {'\n  \n  '}
              <span className='text-[#c586c0]'>return</span> ({'\n    '}
              <span className='text-gray-500'>{'<'}</span>
              <span className='text-[#4ec9b0]'>Tour</span>
              <span className='text-[#9cdcfe]'> id</span>=<span className='text-[#ce9178]'>
                "onboarding"
              </span>
              <span className='text-gray-500'>{'>'}</span>
              {'\n      '}
              <span className='text-gray-500'>{'<'}</span>
              <span className='text-[#4ec9b0]'>TourStep</span>
              {'\n        '}
              <span className='text-[#9cdcfe]'>target</span>=<span className='text-[#ce9178]'>
                "#welcome"
              </span>
              {'\n        '}
              <span className='text-[#9cdcfe]'>title</span>=<span className='text-[#ce9178]'>
                "Welcome!"
              </span>
              {'\n        '}
              <span className='text-[#9cdcfe]'>content</span>=<span className='text-[#ce9178]'>
                "Let's take a quick tour."
              </span>
              {'\n        '}
              <span className='text-[#9cdcfe]'>placement</span>=<span className='text-[#ce9178]'>
                "bottom"
              </span>
              {'\n      '}
              <span className='text-gray-500'>{'/>'}</span>
              {'\n      '}
              <span className='text-gray-500'>{'<'}</span>
              <span className='text-[#569cd6]'>button</span>
              <span className='text-[#9cdcfe]'> onClick</span>
              {'={() => '}
              <span className='text-[#dcdcaa]'>start</span>
              {'()}'}
              <span className='text-gray-500'>{'>'}</span>
              Start Tour
              <span className='text-gray-500'>{'</'}</span>
              <span className='text-[#569cd6]'>button</span>
              <span className='text-gray-500'>{'>'}</span>
              {'\n    '}
              <span className='text-gray-500'>{'</'}</span>
              <span className='text-[#4ec9b0]'>Tour</span>
              <span className='text-gray-500'>{'>'}</span>
              {'\n  );'}
              {'\n}'}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
