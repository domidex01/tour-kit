import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UILibraryProvider, useUILibrary } from '../ui-library-context'

// Test component that displays the current library
function LibraryDisplay() {
  const library = useUILibrary()
  return <div data-testid="library">{library}</div>
}

describe('UILibraryContext', () => {
  describe('UILibraryProvider', () => {
    it('provides default library as radix-ui', () => {
      render(
        <UILibraryProvider>
          <LibraryDisplay />
        </UILibraryProvider>
      )

      expect(screen.getByTestId('library')).toHaveTextContent('radix-ui')
    })

    it('provides radix-ui when explicitly set', () => {
      render(
        <UILibraryProvider library="radix-ui">
          <LibraryDisplay />
        </UILibraryProvider>
      )

      expect(screen.getByTestId('library')).toHaveTextContent('radix-ui')
    })

    it('provides base-ui when set', () => {
      render(
        <UILibraryProvider library="base-ui">
          <LibraryDisplay />
        </UILibraryProvider>
      )

      expect(screen.getByTestId('library')).toHaveTextContent('base-ui')
    })

    it('renders children correctly', () => {
      render(
        <UILibraryProvider>
          <div data-testid="child">Child content</div>
        </UILibraryProvider>
      )

      expect(screen.getByTestId('child')).toHaveTextContent('Child content')
    })

    it('supports nested providers with different values', () => {
      function NestedComponent() {
        return (
          <UILibraryProvider library="base-ui">
            <LibraryDisplay />
          </UILibraryProvider>
        )
      }

      render(
        <UILibraryProvider library="radix-ui">
          <div>
            <div data-testid="outer">
              <LibraryDisplay />
            </div>
            <div data-testid="inner">
              <NestedComponent />
            </div>
          </div>
        </UILibraryProvider>
      )

      const libraries = screen.getAllByTestId('library')
      expect(libraries[0]).toHaveTextContent('radix-ui')
      expect(libraries[1]).toHaveTextContent('base-ui')
    })
  })

  describe('useUILibrary', () => {
    it('returns radix-ui when used outside provider (default context value)', () => {
      render(<LibraryDisplay />)

      expect(screen.getByTestId('library')).toHaveTextContent('radix-ui')
    })

    it('returns the value from nearest provider', () => {
      render(
        <UILibraryProvider library="base-ui">
          <LibraryDisplay />
        </UILibraryProvider>
      )

      expect(screen.getByTestId('library')).toHaveTextContent('base-ui')
    })
  })
})
