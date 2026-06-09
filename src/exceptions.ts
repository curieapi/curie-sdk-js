// src/exceptions.ts

export class CurieError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CurieError'
  }
}

export class AuthenticationError extends CurieError {
  constructor(message = 'Invalid or missing API key') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ModelNotFoundError extends CurieError {
  model: string
  availableModels: string[]

  constructor(model: string, availableModels: string[] = []) {
    const msg = availableModels.length
      ? `Model '${model}' not found. Available: ${availableModels.join(', ')}`
      : `Model '${model}' not found.`
    super(msg)
    this.name = 'ModelNotFoundError'
    this.model = model
    this.availableModels = availableModels
  }
}

export class InferenceError extends CurieError {
  jobId?: string

  constructor(message: string, jobId?: string) {
    super(message)
    this.name = 'InferenceError'
    this.jobId = jobId
  }
}

export class RateLimitError extends CurieError {
  constructor(message = 'Rate limit exceeded. Please wait before retrying.') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends CurieError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class TimeoutError extends CurieError {
  model: string
  timeout: number

  constructor(model: string, timeout: number) {
    super(`Request to model '${model}' timed out after ${timeout}ms.`)
    this.name = 'TimeoutError'
    this.model = model
    this.timeout = timeout
  }
}
