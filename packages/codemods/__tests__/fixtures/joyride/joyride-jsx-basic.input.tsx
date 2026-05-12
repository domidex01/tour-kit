// Source pattern: react-joyride legacy JSX form.
// Representative of OSS examples that wire a simple tour straight into a page
// component. MIT-licensed reference: github.com/gilbarbara/react-joyride
// (docs/examples in the react-joyride repo show this exact shape).

import { useState } from 'react'
import Joyride from 'react-joyride'

const steps = [
  { target: '.app-header', content: 'Welcome to the app!' },
  { target: '.cta-button', content: 'Click here to get started.' },
]

export function OnboardingTour() {
  const [run, setRun] = useState(true)

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          setRun(false)
        }
      }}
    />
  )
}
