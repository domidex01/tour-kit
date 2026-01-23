import { Link } from 'react-router-dom'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav
        id="main-nav"
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">
            TourKit Demo
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              to="/features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/adoption"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Adoption
            </Link>
            <Link
              to="/branching"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Branching
            </Link>
            <Link
              to="/base-ui"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Base UI
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </>
  )
}
