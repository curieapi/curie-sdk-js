// src/types/embeddings.ts

export interface EmbeddingResult {
  jobId: string
  model: string
  embedding: number[]
  perResidue: number[][] | null
  length: number
  latencyMs: number
  costUsd: number
  /** Embedding dimensionality */
  dim: number
}

export function parseEmbeddingResult(data: Record<string, unknown>): EmbeddingResult {
  const embedding = data.embedding as number[]
  return {
    jobId: data.job_id as string,
    model: data.model as string,
    embedding,
    perResidue: data.per_residue as number[][] | null,
    length: data.length as number,
    latencyMs: data.latency_ms as number,
    costUsd: data.cost_usd as number,
    dim: embedding.length,
  }
}
