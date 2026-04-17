## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a deep-dive on why z-index: 9999 doesn't fix product tour overlays — it's always a stacking context problem, not a z-index problem. Covers React portals, CSS token systems, and using `<dialog>` with `showModal()` to bypass z-index entirely. Also has a table of the specific z-index values from MUI, Chakra, and Ant Design so you know what you're fighting against.

https://usertourkit.com/blog/z-index-product-tour-overlay

Curious if anyone's tried the `<dialog>` top layer approach for overlays in production — would love to hear how it went.
