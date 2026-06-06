import { checkRateLimit, corsPreflightResponse, withCors } from '@/lib/api-middleware'
import { getCodeExamples, getDocPage, getNavTree, searchDocs } from '@/lib/docs-api'
import { type NextRequest, NextResponse } from 'next/server'

// Remote MCP endpoint (Streamable HTTP transport, stateless JSON mode).
// Mirrors the published stdio server (@tour-kit/docs-mcp, apps/tour-kit-mcp):
// same tool names, schemas, and scoring (via lib/docs-api.ts) so agents get
// identical behavior whether they connect remotely or run `npx tour-kit-docs`.
// Hand-rolled JSON-RPC instead of the SDK transport because the SDK's
// StreamableHTTPServerTransport expects Node req/res, not fetch Request.
// Advertised by the SEP-1649 server card at /.well-known/mcp/server-card.json.

const SERVER_INFO = { name: 'tour-kit-docs', version: '0.1.0' } as const
const LATEST_PROTOCOL = '2025-06-18'
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']

const INSTRUCTIONS =
  'Search and read Tour Kit documentation (headless React onboarding/product tour library). ' +
  'Start with list_sections to see the structure, search_docs to find pages, ' +
  'get_page for full content, and get_code_examples for runnable snippets per package.'

// ── JSON-RPC types ──

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: string | number | null; result: unknown }
  | { jsonrpc: '2.0'; id: string | number | null; error: { code: number; message: string } }

const ErrorCodes = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
} as const

function rpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function rpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

// ── Tool definitions (JSON Schema mirrors of apps/tour-kit-mcp zod schemas) ──

const TOOLS = [
  {
    name: 'search_docs',
    description:
      'Search Tour Kit documentation by keyword. Returns ranked results with title, description, URL, and relevance score.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "useTour hook", "focus trap", "announcement modal")',
        },
        section: {
          type: 'string',
          description: 'Filter by section (e.g., "core", "react", "guides")',
        },
        limit: { type: 'number', description: 'Max results to return (default 10, max 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_page',
    description:
      'Retrieve the full content of a Tour Kit documentation page by its slug. Returns the page title, description, and complete markdown content. Use search_docs first to find the correct slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Page slug (e.g., "core/hooks/use-tour", "getting-started/installation")',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'list_sections',
    description:
      'List all sections of the Tour Kit documentation with page counts. Use this to understand the documentation structure before searching or browsing.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_code_examples',
    description:
      'Extract code examples from Tour Kit documentation for a specific package. Returns code blocks with language tags, source page, and context.',
    inputSchema: {
      type: 'object',
      properties: {
        package: {
          type: 'string',
          description:
            'Package name to get examples for (e.g., "core", "react", "hints", "adoption")',
        },
        language: {
          type: 'string',
          description: 'Filter by language (e.g., "typescript", "tsx", "bash")',
        },
        limit: { type: 'number', description: 'Max examples to return (default 20)' },
      },
      required: ['package'],
    },
  },
]

// ── Tool execution ──

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

function textResult(text: string, isError = false): ToolResult {
  return { content: [{ type: 'text', text }], ...(isError && { isError: true }) }
}

function requireString(args: Record<string, unknown>, key: string): string | null {
  const value = args[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function clampNumber(value: unknown, fallback: number, max: number): number {
  return typeof value === 'number' ? Math.min(Math.max(1, value), max) : fallback
}

function runSearchDocs(args: Record<string, unknown>): ToolResult {
  const query = requireString(args, 'query')
  if (!query) return textResult('Missing required argument: query', true)
  const section = typeof args.section === 'string' ? args.section : undefined
  const limit = clampNumber(args.limit, 10, 50)
  const results = searchDocs(query, { section, limit })
  if (results.length === 0) {
    return textResult(
      `No results found for "${query}"${section ? ` in section "${section}"` : ''}. Try broader search terms or remove the section filter.`
    )
  }
  const formatted = results.map((r, i) => ({
    rank: i + 1,
    title: r.title,
    description: r.description,
    slug: r.slug,
    url: `https://usertourkit.com${r.url}`,
    section: r.section,
    score: r.score,
  }))
  return textResult(JSON.stringify(formatted, null, 2))
}

function runGetPage(args: Record<string, unknown>): ToolResult {
  const slug = requireString(args, 'slug')
  if (!slug) return textResult('Missing required argument: slug', true)
  const page = getDocPage(slug.split('/').filter(Boolean))
  if (!page) {
    return textResult(
      `Page not found: "${slug}". Use search_docs to find the correct slug, or list_sections to browse available sections.`
    )
  }
  const output = [
    `# ${page.title}`,
    '',
    page.description ? `> ${page.description}` : '',
    '',
    `**URL:** https://usertourkit.com${page.url}`,
    '',
    '---',
    '',
    page.body,
  ].join('\n')
  return textResult(output)
}

function runGetCodeExamples(args: Record<string, unknown>): ToolResult {
  const pkg = requireString(args, 'package')
  if (!pkg) return textResult('Missing required argument: package', true)
  const language = typeof args.language === 'string' ? args.language : undefined
  const limit = clampNumber(args.limit, 20, 100)
  let examples = getCodeExamples(pkg)
  if (examples.length === 0) {
    return textResult(
      `No documentation found for package "${pkg}". Use list_sections to see available packages.`
    )
  }
  if (language) examples = examples.filter((e) => e.language === language)
  return textResult(JSON.stringify(examples.slice(0, limit), null, 2))
}

function callTool(name: string, args: Record<string, unknown>): ToolResult {
  switch (name) {
    case 'search_docs':
      return runSearchDocs(args)
    case 'get_page':
      return runGetPage(args)
    case 'list_sections':
      return textResult(JSON.stringify(getNavTree(), null, 2))
    case 'get_code_examples':
      return runGetCodeExamples(args)
    default:
      return textResult(`Unknown tool: ${name}`, true)
  }
}

// ── JSON-RPC dispatch ──

function handleRequest(message: JsonRpcRequest): JsonRpcResponse {
  const id = message.id ?? null

  switch (message.method) {
    case 'initialize': {
      const requested = message.params?.protocolVersion
      const protocolVersion =
        typeof requested === 'string' && SUPPORTED_PROTOCOLS.includes(requested)
          ? requested
          : LATEST_PROTOCOL
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      })
    }

    case 'ping':
      return rpcResult(id, {})

    case 'tools/list':
      return rpcResult(id, { tools: TOOLS })

    case 'tools/call': {
      const name = message.params?.name
      if (typeof name !== 'string') {
        return rpcError(id, ErrorCodes.invalidParams, 'Missing tool name')
      }
      const args = (message.params?.arguments ?? {}) as Record<string, unknown>
      return rpcResult(id, callTool(name, args))
    }

    default:
      return rpcError(id, ErrorCodes.methodNotFound, `Method not found: ${message.method}`)
  }
}

// ── HTTP transport (stateless: no sessions, no SSE stream) ──

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const origin = request.headers.get('origin')

  let message: unknown
  try {
    message = await request.json()
  } catch {
    return withCors(
      NextResponse.json(rpcError(null, ErrorCodes.parseError, 'Parse error'), { status: 400 }),
      origin
    )
  }

  // JSON-RPC batching was removed in protocol 2025-06-18.
  if (Array.isArray(message) || typeof message !== 'object' || message === null) {
    return withCors(
      NextResponse.json(rpcError(null, ErrorCodes.invalidRequest, 'Invalid request'), {
        status: 400,
      }),
      origin
    )
  }

  const rpc = message as JsonRpcRequest
  if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return withCors(
      NextResponse.json(rpcError(null, ErrorCodes.invalidRequest, 'Invalid request'), {
        status: 400,
      }),
      origin
    )
  }

  // Notifications (no id) get 202 Accepted with no body.
  if (rpc.id === undefined || rpc.id === null) {
    return withCors(new NextResponse(null, { status: 202 }), origin)
  }

  return withCors(NextResponse.json(handleRequest(rpc)), origin)
}

// Stateless server: no SSE stream to open, no session to delete.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST, OPTIONS' } })
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST, OPTIONS' } })
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get('origin'))
}
