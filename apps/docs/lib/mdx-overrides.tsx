import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { ComponentPropsWithoutRef, ReactElement } from 'react'

/**
 * Wrap rendered MDX <table> in a horizontal-scroll container so wide tables
 * (e.g., feature comparison matrices) do not blow out the mobile viewport.
 * Mirrors what `overflow-x-auto` does for code blocks.
 */
function ScrollableTable(props: ComponentPropsWithoutRef<'table'>): ReactElement {
  return (
    <div className="not-prose my-6 w-full overflow-x-auto">
      <table {...props} className="w-full border-collapse text-[14px]" />
    </div>
  )
}

/**
 * MDX component map merged with Fumadocs defaults.
 * - `table` → wrapped in a scroll container (mobile-horizontal-scroll fix)
 * - `pre` keeps the Fumadocs default (already overflow-x: auto)
 *
 * Use this anywhere MDX article bodies are rendered so the global SEO audit
 * stops flagging long tables as horizontal-scroll regressions.
 */
export const articleMdxComponents = {
  ...defaultMdxComponents,
  table: ScrollableTable,
}
