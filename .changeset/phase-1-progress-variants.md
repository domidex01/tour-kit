---
"@tour-kit/react": minor
---

Extend `<TourProgress>` from 3 to 7 variants. New variants: `narrow` (thin progress bar), `chain` (segmented progress with completed/active/pending status), `numbered` (`"<current> / <total>"` chip), and `none` (renders `null` — useful for compound layouts that opt out). All visible aria-bearing variants expose `role="progressbar"` with `aria-valuenow={current}`, `aria-valuemin={1}`, `aria-valuemax={total}`, and `aria-label="Step N of M"`. Existing `text`, `dots`, and `bar` variants are unchanged.
