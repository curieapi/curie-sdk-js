"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  Curie: () => Curie,
  CurieError: () => CurieError,
  InferenceError: () => InferenceError,
  ModelNotFoundError: () => ModelNotFoundError,
  RateLimitError: () => RateLimitError,
  TimeoutError: () => TimeoutError,
  ValidationError: () => ValidationError,
  default: () => Curie
});
module.exports = __toCommonJS(index_exports);

// src/exceptions.ts
var CurieError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CurieError";
  }
};
var AuthenticationError = class extends CurieError {
  constructor(message = "Invalid or missing API key") {
    super(message);
    this.name = "AuthenticationError";
  }
};
var ModelNotFoundError = class extends CurieError {
  constructor(model, availableModels = []) {
    const msg = availableModels.length ? `Model '${model}' not found. Available: ${availableModels.join(", ")}` : `Model '${model}' not found.`;
    super(msg);
    this.name = "ModelNotFoundError";
    this.model = model;
    this.availableModels = availableModels;
  }
};
var InferenceError = class extends CurieError {
  constructor(message, jobId) {
    super(message);
    this.name = "InferenceError";
    this.jobId = jobId;
  }
};
var RateLimitError = class extends CurieError {
  constructor(message = "Rate limit exceeded. Please wait before retrying.") {
    super(message);
    this.name = "RateLimitError";
  }
};
var ValidationError = class extends CurieError {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
var TimeoutError = class extends CurieError {
  constructor(model, timeout) {
    super(`Request to model '${model}' timed out after ${timeout}ms.`);
    this.name = "TimeoutError";
    this.model = model;
    this.timeout = timeout;
  }
};

// src/http.ts
var DEFAULT_RETRIES = 2;
var RETRY_DELAY_MS = 1e3;
var HttpClient = class {
  constructor(apiKey, baseUrl, timeout, maxRetries = DEFAULT_RETRIES) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "curie-js/0.1.0"
    };
  }
  async post(path, body) {
    const url = `${this.baseUrl}${path}`;
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        return await this.handleResponse(response);
      } catch (err) {
        if (err instanceof CurieError) throw err;
        if (err.name === "AbortError") {
          throw new CurieError(`Request timed out after ${this.timeout}ms`);
        }
        lastError = err;
        if (attempt < this.maxRetries) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new CurieError("Request failed");
  }
  async handleResponse(response) {
    if (response.ok) {
      return response.json();
    }
    let data = {};
    try {
      data = await response.json();
    } catch {
    }
    const errorMsg = data.error ?? "Unknown error";
    const errorCode = data.code ?? "";
    const jobId = data.job_id;
    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMsg);
      case 404:
        if (errorCode === "MODEL_NOT_FOUND") {
          const available = data.available_models ?? [];
          const model = errorMsg.match(/"([^"]+)"/)?.[1] ?? "unknown";
          throw new ModelNotFoundError(model, available);
        }
        throw new CurieError(errorMsg);
      case 422:
        throw new ValidationError(errorMsg);
      case 429:
        throw new RateLimitError(errorMsg);
      case 500:
        throw new InferenceError(errorMsg, jobId);
      default:
        throw new CurieError(`HTTP ${response.status}: ${errorMsg}`);
    }
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/types/protein.ts
function parseFoldResult(data) {
  const plddt = data.plddt;
  return {
    jobId: data.job_id,
    model: data.model,
    pdb: data.pdb,
    plddt,
    length: data.length,
    latencyMs: data.latency_ms,
    costUsd: data.cost_usd,
    confidence: plddt * 100,
    isHighConfidence: plddt > 0.7
  };
}
function parseDesignResult(data) {
  const sequences = data.sequences.map((s) => ({
    sequence: s.sequence,
    score: s.score,
    recovery: s.recovery
  }));
  const best = sequences.reduce((a, b) => a.score > b.score ? a : b);
  return {
    jobId: data.job_id,
    model: data.model,
    sequences,
    latencyMs: data.latency_ms,
    costUsd: data.cost_usd,
    best
  };
}

// src/types/embeddings.ts
function parseEmbeddingResult(data) {
  const embedding = data.embedding;
  return {
    jobId: data.job_id,
    model: data.model,
    embedding,
    perResidue: data.per_residue,
    length: data.length,
    latencyMs: data.latency_ms,
    costUsd: data.cost_usd,
    dim: embedding.length
  };
}

// src/client.ts
var DEFAULT_BASE_URL = "https://api.curie.sh";
var DEFAULT_TIMEOUT = 12e4;
var DEFAULT_MAX_RETRIES = 2;
var Curie = class {
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
  constructor(options = {}) {
    const apiKey = options.apiKey ?? (typeof process !== "undefined" ? process.env.CURIE_API_KEY : void 0);
    if (!apiKey) {
      throw new AuthenticationError(
        "No API key provided. Pass apiKey or set the CURIE_API_KEY environment variable."
      );
    }
    this.http = new HttpClient(
      apiKey,
      options.baseUrl ?? DEFAULT_BASE_URL,
      options.timeout ?? DEFAULT_TIMEOUT,
      options.maxRetries ?? DEFAULT_MAX_RETRIES
    );
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
  async fold(sequence, options = {}) {
    const data = await this.http.post("/v1/run", {
      model: options.model ?? "esm/esmfold-v1",
      sequence
    });
    return parseFoldResult(data);
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
  async embed(sequence, options = {}) {
    const data = await this.http.post("/v1/run", {
      model: options.model ?? "meta/esm2-650m",
      sequence,
      return_per_residue: String(options.returnPerResidue ?? false)
    });
    return parseEmbeddingResult(data);
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
  async design(pdb, options = {}) {
    const data = await this.http.post("/v1/run", {
      model: options.model ?? "bakerlab/proteinmpnn",
      pdb,
      num_sequences: String(options.numSequences ?? 1),
      temperature: String(options.temperature ?? 0.1)
    });
    return parseDesignResult(data);
  }
  /**
   * Run any Curie model with arbitrary parameters.
   *
   * @example
   * ```ts
   * const result = await client.run('esm/esmfold-v1', { sequence: 'MKTII...' })
   * ```
   */
  async run(model, params = {}) {
    return this.http.post("/v1/run", { model, ...params });
  }
  /**
   * List all available models.
   */
  async models() {
    const response = await fetch(`${DEFAULT_BASE_URL}/v1/run`, {
      headers: { Authorization: `Bearer ${this.http.apiKey}` }
    });
    const data = await response.json();
    return data.models ?? [];
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  Curie,
  CurieError,
  InferenceError,
  ModelNotFoundError,
  RateLimitError,
  TimeoutError,
  ValidationError
});
//# sourceMappingURL=index.js.map