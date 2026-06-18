// Source pattern: shepherd.js with custom buttons + lifecycle hooks +
// unsupported step fields (classes, scrollTo, canClickTarget). Mirrors a
// dense production tour that exercises every TODO anchor.

import { TourProvider } from '@tour-kit/react';

export function startCheckoutTour() {
  const tour = // TODO: Shepherd Tour constructed — register via <TourProvider tours={[migratedTour]}> in an ancestor and call useTour().start() to begin — see https://usertourkit.com/migration/shepherd#tour-constructor
  // TODO: Step.classes — Tour Kit uses theme tokens; port via <ThemeProvider> — see https://usertourkit.com/migration/shepherd#classes
  // TODO: Step.scrollTo — Tour Kit auto-scrolls; gate manually if you need a custom container — see https://usertourkit.com/migration/shepherd#scroll-to
  // TODO: Step.canClickTarget → configure the overlay spotlight interactive flag manually — see https://usertourkit.com/migration/shepherd#can-click-target
  // TODO: Shepherd Step.buttons — Tour Kit fixed Next/Prev/Skip slots; wire custom button actions via <TourCard /> children — see https://usertourkit.com/migration/shepherd#buttons
  // TODO: Step.advanceOn — wire useTour().next() from your own event handler — see https://usertourkit.com/migration/shepherd#advance-on
  {
    id: 'migrated-tour',

    steps: [{
      id: 'cart',
      target: '#cart',
      placement: 'top',
      content: 'Review your cart.',
    }, {
      id: 'checkout',
      target: '#checkout-btn',
      placement: 'bottom',
      content: 'Click here to check out.',
    }],
  }

  // TODO: Shepherd tour.start() → call useTour().start() from a descendant of <TourProvider> — see https://usertourkit.com/migration/shepherd#start

}
