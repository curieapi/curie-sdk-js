// src/index.ts
export { Curie, Curie as default } from './client'
export type { CurieOptions } from './client'
export {
  CurieError,
  AuthenticationError,
  ModelNotFoundError,
  InferenceError,
  RateLimitError,
  ValidationError,
  TimeoutError,
} from './exceptions'
export type { FoldResult, DesignResult, DesignedSequence, EmbeddingResult } from './types'
