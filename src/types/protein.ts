// src/types/protein.ts

export interface FoldResult {
  jobId: string
  model: string
  pdb: string
  plddt: number
  length: number
  latencyMs: number
  costUsd: number
  /** pLDDT as percentage (0-100) */
  confidence: number
  /** True if mean pLDDT > 70 */
  isHighConfidence: boolean
}

export interface DesignedSequence {
  sequence: string
  score: number
  recovery: number
}

export interface DesignResult {
  jobId: string
  model: string
  sequences: DesignedSequence[]
  latencyMs: number
  costUsd: number
  /** The highest-scoring designed sequence */
  best: DesignedSequence
}

export function parseFoldResult(data: Record<string, unknown>): FoldResult {
  const plddt = data.plddt as number
  return {
    jobId: data.job_id as string,
    model: data.model as string,
    pdb: data.pdb as string,
    plddt,
    length: data.length as number,
    latencyMs: data.latency_ms as number,
    costUsd: data.cost_usd as number,
    confidence: plddt * 100,
    isHighConfidence: plddt > 0.7,
  }
}

export function parseDesignResult(data: Record<string, unknown>): DesignResult {
  const sequences = (data.sequences as Array<Record<string, unknown>>).map(s => ({
    sequence: s.sequence as string,
    score: s.score as number,
    recovery: s.recovery as number,
  }))
  // Fixed: Higher scores are better, so we select the sequence with the maximum score
  const best = sequences.reduce((a, b) => a.score > b.score ? a : b)
  return {
    jobId: data.job_id as string,
    model: data.model as string,
    sequences,
    latencyMs: data.latency_ms as number,
    costUsd: data.cost_usd as number,
    best,
  }
}
