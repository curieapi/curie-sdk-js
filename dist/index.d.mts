interface FoldResult {
    jobId: string;
    model: string;
    pdb: string;
    plddt: number;
    length: number;
    latencyMs: number;
    costUsd: number;
    /** pLDDT as percentage (0-100) */
    confidence: number;
    /** True if mean pLDDT > 70 */
    isHighConfidence: boolean;
}
interface DesignedSequence {
    sequence: string;
    score: number;
    recovery: number;
}
interface DesignResult {
    jobId: string;
    model: string;
    sequences: DesignedSequence[];
    latencyMs: number;
    costUsd: number;
    /** The highest-scoring designed sequence */
    best: DesignedSequence;
}

interface EmbeddingResult {
    jobId: string;
    model: string;
    embedding: number[];
    perResidue: number[][] | null;
    length: number;
    latencyMs: number;
    costUsd: number;
    /** Embedding dimensionality */
    dim: number;
}

interface CurieOptions {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
}
declare class Curie {
    private http;
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
    constructor(options?: CurieOptions);
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
    fold(sequence: string, options?: {
        model?: string;
    }): Promise<FoldResult>;
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
    embed(sequence: string, options?: {
        model?: string;
        returnPerResidue?: boolean;
    }): Promise<EmbeddingResult>;
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
    design(pdb: string, options?: {
        model?: string;
        numSequences?: number;
        temperature?: number;
    }): Promise<DesignResult>;
    /**
     * Run any Curie model with arbitrary parameters.
     *
     * @example
     * ```ts
     * const result = await client.run('esm/esmfold-v1', { sequence: 'MKTII...' })
     * ```
     */
    run(model: string, params?: Record<string, string | number | boolean>): Promise<Record<string, unknown>>;
    /**
     * List all available models.
     */
    models(): Promise<Array<Record<string, unknown>>>;
}

declare class CurieError extends Error {
    constructor(message: string);
}
declare class AuthenticationError extends CurieError {
    constructor(message?: string);
}
declare class ModelNotFoundError extends CurieError {
    model: string;
    availableModels: string[];
    constructor(model: string, availableModels?: string[]);
}
declare class InferenceError extends CurieError {
    jobId?: string;
    constructor(message: string, jobId?: string);
}
declare class RateLimitError extends CurieError {
    constructor(message?: string);
}
declare class ValidationError extends CurieError {
    constructor(message: string);
}
declare class TimeoutError extends CurieError {
    model: string;
    timeout: number;
    constructor(model: string, timeout: number);
}

export { AuthenticationError, Curie, CurieError, type CurieOptions, type DesignResult, type DesignedSequence, type EmbeddingResult, type FoldResult, InferenceError, ModelNotFoundError, RateLimitError, TimeoutError, ValidationError, Curie as default };
