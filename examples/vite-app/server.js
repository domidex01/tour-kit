import { createOpenAI } from '@ai-sdk/openai'
import { createChatRouteHandler } from '@tour-kit/ai/server'
import { createServer } from 'node:http'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const { POST } = createChatRouteHandler({
  model: openrouter.chat('google/gemini-2.0-flash-001'),
  context: {
    strategy: 'context-stuffing',
    documents: [
      {
        id: 'getting-started',
        content:
          'To get started with Tour Kit, install the package and wrap your app in a TourKitProvider.',
        metadata: { title: 'Getting Started' },
      },
      {
        id: 'features',
        content:
          'Tour Kit supports guided tours, hints, checklists, and AI-powered chat assistance.',
        metadata: { title: 'Features' },
      },
    ],
  },
  instructions: {
    productName: 'Tour Kit Demo',
    tone: 'friendly',
    boundaries: ['Only answer questions about Tour Kit and its features'],
  },
})

const server = createServer(async (req, res) => {
  // CORS headers for Vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url?.startsWith('/api/chat')) {
    // Collect body
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    // Build a Web Request from the Node request
    const url = new URL(req.url, `http://localhost:3001`)
    const webReq = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    const webRes = await POST(webReq)

    res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()))
    if (webRes.body) {
      const reader = webRes.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      }
      await pump()
    } else {
      res.end(await webRes.text())
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(3001, () => {
  console.log('Vite AI chat server running at http://localhost:3001')
})
