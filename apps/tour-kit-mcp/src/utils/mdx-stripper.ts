/**
 * Strip MDX-specific syntax from content, producing clean markdown.
 * Preserves: headings, paragraphs, lists, code blocks (fenced), links, bold/italic.
 * Removes: import/export statements, JSX components, MDX expressions.
 */
export function stripMdx(mdxContent: string): string {
  let result = mdxContent

  // Step 1: Protect fenced code blocks from being modified
  const codeBlocks: string[] = []
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // Step 2: Remove import statements
  result = result.replace(/^import\s+.*$/gm, '')

  // Step 3: Remove export statements (but keep export default content)
  result = result.replace(/^export\s+(?!default\s).*$/gm, '')
  result = result.replace(/^export\s+default\s+/gm, '')

  // Step 4: Remove self-closing JSX tags (e.g., <Component prop="value" />)
  result = result.replace(/<[A-Z][a-zA-Z]*\s*[^>]*\/>/g, '')

  // Step 5: Remove JSX block elements (opening + closing tags with content)
  // Handle nested by running multiple passes
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
  }

  // Step 6: Remove MDX expressions {/* comments */} and {expressions}
  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  result = result.replace(/\{[^}]*\}/g, '')

  // Step 7: Remove frontmatter (if present)
  result = result.replace(/^---[\s\S]*?---\n*/m, '')

  // Step 8: Restore code blocks
  result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[Number.parseInt(index, 10)]
  })

  // Step 9: Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}
