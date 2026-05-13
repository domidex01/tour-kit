// Source pattern: react-joyride legacy JSX form.
// Representative of OSS examples that wire a simple tour straight into a page
// component. MIT-licensed reference: github.com/gilbarbara/react-joyride
// (docs/examples in the react-joyride repo show this exact shape).

import { useState } from 'react'
import { TourProvider } from '@tour-kit/react';

const steps = [
  { target: '.app-header', content: 'Welcome to the app!' },
  { target: '.cta-button', content: 'Click here to get started.' },
]

export function OnboardingTour() {
  const [run, setRun] = useState(true)

  return (
    // TODO: <Joyride run> — Tour Kit is imperative; call useTour().start() from a descendant — see https://tourkit.dev/migration/joyride#run-prop
    // TODO: <Joyride continuous> is the default in Tour Kit (no opt-in needed) — see https://tourkit.dev/migration/joyride#continuous
    // TODO: <Joyride showSkipButton> → render <TourClose /> inside <TourCard /> — see https://tourkit.dev/migration/joyride#show-skip-button
    // TODO: <Joyride callback> splits into onTourEnd / onTourSkip / onStepAdvance — see https://tourkit.dev/migration/joyride#callback
    <TourProvider
      tours={[{
        id: 'migrated-tour',
        steps: steps,
      }]} />
  );
}
