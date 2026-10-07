import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { createAuthApi } from './authApi.ts'
import type { ApiRequest, AuthApi } from './authApi.ts'

const API_PREFIX = '/api/'
/** Enough delay to see loading states and parallel requests in DevTools. */
const DEFAULT_LATENCY_MS = 300

type MockApiPluginOptions = {
  readonly latencyMs?: number
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    if (chunk instanceof Buffer) {
      chunks.push(chunk)
    }
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') {
    return undefined
  }
  try {
    const body: unknown = JSON.parse(text)
    return body
  } catch {
    // The handler answers 400 for a missing body, which is what malformed JSON
    // deserves too.
    return undefined
  }
}

async function toApiRequest(request: IncomingMessage): Promise<ApiRequest> {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const { authorization, cookie } = request.headers
  return {
    method: request.method ?? 'GET',
    path: url.pathname,
    body: await readBody(request),
    ...(authorization === undefined ? {} : { authorization }),
    ...(cookie === undefined ? {} : { cookie }),
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function createMiddleware(
  api: AuthApi,
  latencyMs: number,
): Connect.NextHandleFunction {
  return (request, response: ServerResponse, next) => {
    const url = request.url ?? ''
    if (!url.startsWith(API_PREFIX)) {
      next()
      return
    }
    void (async () => {
      const apiRequest = await toApiRequest(request)
      await wait(latencyMs)
      const result = api.handle(apiRequest)
      response.statusCode = result.status
      response.setHeader('Cache-Control', 'no-store')
      if (result.setCookie !== undefined) {
        response.setHeader('Set-Cookie', result.setCookie)
      }
      if (result.json === undefined) {
        response.end()
        return
      }
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(result.json))
    })().catch(next)
  }
}

/**
 * Serves the mock auth API from the Vite dev and preview servers, so requests
 * are real HTTP calls that show up in the browser's Network tab.
 */
export function mockApiPlugin({
  latencyMs = DEFAULT_LATENCY_MS,
}: MockApiPluginOptions = {}): Plugin {
  const api = createAuthApi()
  const middleware = createMiddleware(api, latencyMs)
  return {
    name: 'mock-auth-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
