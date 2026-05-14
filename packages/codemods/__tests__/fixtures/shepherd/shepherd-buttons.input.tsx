// Source pattern: shepherd.js with custom buttons + lifecycle hooks +
// unsupported step fields (classes, scrollTo, canClickTarget). Mirrors a
// dense production tour that exercises every TODO anchor.

import Shepherd from 'shepherd.js'

export function startCheckoutTour() {
  const tour = new Shepherd.Tour({ useModalOverlay: true })
  tour.addStep({
    id: 'cart',
    attachTo: { element: '#cart', on: 'top' },
    text: 'Review your cart.',
    classes: 'shepherd-cart',
    scrollTo: true,
    canClickTarget: false,
    buttons: [
      { text: 'Skip', action: () => tour.cancel() },
      { text: 'Next', action: () => tour.next() },
    ],
  })
  tour.addStep({
    id: 'checkout',
    attachTo: { element: '#checkout-btn', on: 'bottom' },
    text: 'Click here to check out.',
    advanceOn: { selector: '#checkout-btn', event: 'click' },
  })
  tour.start()
}
