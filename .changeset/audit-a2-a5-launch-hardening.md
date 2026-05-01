---
'@tour-kit/announcements': patch
'@tour-kit/ai': patch
'@tour-kit/surveys': patch
---

Launch-hardening audit fixes A2–A5:

- announcements: stabilize the toast auto-dismiss `setInterval` so it no longer re-arms on every parent render (audit A2).
- ai: declare the chat message list with explicit `aria-live="polite"`, `aria-atomic="false"`, `aria-relevant="additions text"`, and `aria-busy` driven by streaming status so screen readers announce streaming tokens reliably (audit A3).
- announcements: render the spotlight overlay as a real `<button>` when `closeOnOverlayClick` is enabled, otherwise an inert `aria-hidden` div — element shape is now statically coherent and Enter/Space activation works through the native button (audit A4).
- surveys: trap focus inside `SurveyPopover`, dismiss with reason `"escape_key"` when Escape is pressed, and restore focus to the anchor on close (audit A5).
