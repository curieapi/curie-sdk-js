// src/client.ts
import { HttpClient } from './http'
import { AuthenticationError } from './exceptions'
import {
  FoldResult, DesignResult, EmbeddingResult,
  parseFoldResult, parseDesignResult, parseEmbeddingResult,
} from './types'

const DEFAULT_BASE_URL = 'https://api.curie.sh'
const DEFAULT_TIMEOUT = 120_000
const DEFAULT_MAX_RETRIES = 2

export interface CurieOptions {
  apiKey?: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
}

export class Curie {
  private http: HttpClient

  /**
   * Create a new Curie client.
   *
   * @example
   * ```ts
   * import Curie from 'curie-ai'
   *
   * const client = new Curie({ apiKey: 'sk-...' })
   * // Or set CURIE_API_KEY env var and omit apiKey
   * ```
   */
  constructor(options: CurieOptions = {}) {
    const apiKey = options.apiKey
      ?? (typeof process !== 'undefined' ? process.env.CURIE_API_KEY : undefined)

    if (!apiKey) {
      throw new AuthenticationError(
        'No API key provided. Pass apiKey or set the CURIE_API_KEY environment variable.'
      )
    }

    this.http = new HttpClient(
      apiKey,
      options.baseUrl ?? DEFAULT_BASE_URL,
      options.timeout ?? DEFAULT_TIMEOUT,
      options.maxRetries ?? DEFAULT_MAX_RETRIES,
    )
  }

  /**
   * Predict the 3D structure of a protein sequence.
   *
   * @example
   * ```ts
   * const result = await client.fold('MKTIIALSYIFCLVFA...')
   * console.log(`Confidence: ${result.confidence.toFixed(1)}%`)
   * // result.pdb contains the full PDB structure
   * ```
   */
  async fold(
    sequence: string,
    options: { model?: string } = {}
  ): Promise<FoldResult> {
    const data = await this.http.post('/v1/run', {
      model: options.model ?? 'esm/esmfold-v1',
      sequence,
    })
    return parseFoldResult(data)
  }

  /**
   * Generate protein language model embeddings.
   *
   * @example
   * ```ts
   * const result = await client.embed('MKTIIALSYIFCLVFA...')
   * console.log(`Embedding dimensions: ${result.dim}`)
   * // result.embedding is a number[] of length 1280
   * ```
   */
  async embed(
    sequence: string,
    options: { model?: string; returnPerResidue?: boolean } = {}
  ): Promise<EmbeddingResult> {
    const data = await this.http.post('/v1/run', {
      model: options.model ?? 'meta/esm2-650m',
      sequence,
      return_per_residue: String(options.returnPerResidue ?? false),
    })
    return parseEmbeddingResult(data)
  }

  /**
   * Design protein sequences for a given backbone structure.
   *
   * @example
   * ```ts
   * // First fold a protein
   * const structure = await client.fold('MKTIIALSYIFCLVFA...')
   *
   * // Then design sequences for that backbone
   * const result = await client.design(structure.pdb, { numSequences: 5 })
   * console.log(result.best.sequence)
   * ```
   */
  async design(
    pdb: string,
    options: { model?: string; numSequences?: number; temperature?: number } = {}
  ): Promise<DesignResult> {
    const data = await this.http.post('/v1/run', {
      model: options.model ?? 'bakerlab/proteinmpnn',
      pdb,
      num_sequences: String(options.numSequences ?? 1),
      temperature: String(options.temperature ?? 0.1),
    })
    return parseDesignResult(data)
  }

  /**
   * Run any Curie model with arbitrary parameters.
   *
   * @example
   * ```ts
   * const result = await client.run('esm/esmfold-v1', { sequence: 'MKTII...' })
   * ```
   */
  async run(
    model: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<Record<string, unknown>> {
    return this.http.post('/v1/run', { model, ...params })
  }

  /**
   * List all available models.
   */
  async models(): Promise<Array<Record<string, unknown>>> {
    const response = await fetch(`${DEFAULT_BASE_URL}/v1/run`, {
      headers: { Authorization: `Bearer ${(this.http as any).apiKey}` },
    })
    const data = await response.json()
    return data.models ?? []
  }
}

export default Curie
