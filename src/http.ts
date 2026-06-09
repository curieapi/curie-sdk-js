// src/http.ts
import {
  AuthenticationError, ModelNotFoundError, InferenceError,
  RateLimitError, ValidationError, CurieError,
} from './exceptions'

const DEFAULT_RETRIES = 2
const RETRY_DELAY_MS = 1000

export class HttpClient {
  private headers: Record<string, string>

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeout: number,
    private readonly maxRetries: number = DEFAULT_RETRIES,
  ) {
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'curie-js/0.1.0',
    }
  }

  async post(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeout)

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        return await this.handleResponse(response)

      } catch (err) {
        if (err instanceof CurieError) throw err

        if ((err as Error).name === 'AbortError') {
          throw new CurieError(`Request timed out after ${this.timeout}ms`)
        }

        lastError = err as Error

        if (attempt < this.maxRetries) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
        }
      } finally {
        // Always clear timeout to prevent memory leaks, even on error or retry
        clearTimeout(timer)
      }
    }

    throw lastError ?? new CurieError('Request failed')
  }

  private async handleResponse(response: Response): Promise<Record<string, unknown>> {
    if (response.ok) {
      return response.json()
    }

    let data: Record<string, unknown> = {}
    try { data = await response.json() } catch { /* ignore */ }

    const errorMsg = (data.error as string) ?? 'Unknown error'
    const errorCode = (data.code as string) ?? ''
    const jobId = data.job_id as string | undefined

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMsg)
      case 404:
        if (errorCode === 'MODEL_NOT_FOUND') {
          const available = (data.available_models as string[]) ?? []
          const model = errorMsg.match(/"([^"]+)"/)?.[1] ?? 'unknown'
          throw new ModelNotFoundError(model, available)
        }
        throw new CurieError(errorMsg)
      case 422:
        throw new ValidationError(errorMsg)
      case 429:
        throw new RateLimitError(errorMsg)
      case 500:
        throw new InferenceError(errorMsg, jobId)
      default:
        throw new CurieError(`HTTP ${response.status}: ${errorMsg}`)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
