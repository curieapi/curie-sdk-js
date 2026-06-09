// tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Curie, { AuthenticationError, ModelNotFoundError } from '../src'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Curie client', () => {
  beforeEach(() => mockFetch.mockReset())

  it('throws AuthenticationError without API key', () => {
    expect(() => new Curie({ apiKey: '' })).toThrow(AuthenticationError)
  })

  it('folds a protein successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'test-id',
        model: 'esm/esmfold-v1',
        pdb: 'ATOM 1 N MET...',
        plddt: 0.87,
        length: 16,
        latency_ms: 500,
        cost_usd: 0.005,
      }),
    })

    const client = new Curie({ apiKey: 'sk-test' })
    const result = await client.fold('MKTIIALSYIFCLVFA')

    expect(result.pdb).toBe('ATOM 1 N MET...')
    expect(result.plddt).toBe(0.87)
    expect(result.confidence).toBeCloseTo(87)
    expect(result.isHighConfidence).toBe(true)
  })

  it('throws AuthenticationError on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid API key', code: 'UNAUTHORIZED' }),
    })

    const client = new Curie({ apiKey: 'sk-bad' })
    await expect(client.fold('MKTII')).rejects.toThrow(AuthenticationError)
  })

  it('throws ModelNotFoundError with available models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: "Model 'unknown' not found",
        code: 'MODEL_NOT_FOUND',
        available_models: ['esm/esmfold-v1'],
      }),
    })

    const client = new Curie({ apiKey: 'sk-test' })
    await expect(client.run('unknown', { sequence: 'MKTII' }))
      .rejects.toThrow(ModelNotFoundError)
  })

  it('returns correct embedding dimensions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'test-id',
        model: 'meta/esm2-650m',
        embedding: new Array(1280).fill(0.1),
        per_residue: null,
        length: 16,
        latency_ms: 100,
        cost_usd: 0.002,
      }),
    })

    const client = new Curie({ apiKey: 'sk-test' })
    const result = await client.embed('MKTIIALSYIFCLVFA')

    expect(result.dim).toBe(1280)
    expect(result.embedding).toHaveLength(1280)
  })
})
