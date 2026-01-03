/**
 * Router adapter interface for multi-page tours.
 * Implement this for your routing library.
 *
 * Supported routers:
 * - Next.js App Router (next/navigation)
 * - Next.js Pages Router (next/router)
 * - React Router v6/v7 (react-router / react-router-dom)
 */
export interface RouterAdapter {
  /**
   * Get current route/pathname
   * @returns Current pathname (e.g., '/dashboard')
   */
  getCurrentRoute(): string

  /**
   * Navigate to a route.
   *
   * Return types vary by implementation:
   * - Next.js App Router: void
   * - Next.js Pages Router: Promise<boolean>
   * - React Router: void
   */
  navigate(route: string): undefined | Promise<boolean | undefined>

  /**
   * Check if current route matches a pattern
   * @param pattern - Route pattern to match
   * @param mode - Matching mode (default: 'exact')
   */
  matchRoute(pattern: string, mode?: 'exact' | 'startsWith' | 'contains'): boolean

  /**
   * Subscribe to route changes.
   * Callback is invoked when the route changes.
   * @returns Cleanup function to unsubscribe
   */
  onRouteChange(callback: (route: string) => void): () => void
}

/**
 * Multi-page persistence configuration.
 * Extends base PersistenceConfig with route-specific options.
 */
export interface MultiPagePersistenceConfig {
  /** Enable persistence */
  enabled: boolean
  /** Storage type */
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  /** Storage key prefix */
  key?: string
  /** Sync across browser tabs (localStorage only) */
  syncTabs?: boolean
  /** Expiry time in milliseconds (default: 24 hours) */
  expiryMs?: number
}
