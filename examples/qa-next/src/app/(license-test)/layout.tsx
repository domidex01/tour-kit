/**
 * Minimal layout for license test pages.
 * Does NOT include the main Providers wrapper (no LicenseProvider),
 * so each test page controls its own license context.
 */
export default function LicenseTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
