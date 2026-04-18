export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-fd-primary focus:px-4 focus:py-2 focus:text-fd-primary-foreground focus:outline-2 focus:outline-offset-2"
    >
      Skip to main content
    </a>
  )
}
