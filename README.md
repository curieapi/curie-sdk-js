# Curie AI

The official JavaScript/TypeScript SDK for [Curie](https://curie.sh) — inference infrastructure for scientific AI.

Run biology, chemistry, and physics AI models through one unified API.

## Installation

```bash
npm install curieai
# or
pnpm add curieai
# or
yarn add curieai
```

## Quick start

```typescript
import { Curie } from 'curieai';

const client = new Curie({ apiKey: 'sk-...' });

// Predict protein structure
const result = await client.fold('MKTIIALSYIFCLVFA...');
console.log(`Confidence: ${result.confidence}%`);
await result.savePdb('my_protein.pdb');

// Generate embeddings
const embedding = await client.embed('MKTIIALSYIFCLVFA...');
const vector = embedding.toArray(); // Float32Array, length 1280

// Design sequences for a backbone
const design = await client.design(result.pdb, { numSequences: 3 });
console.log(design.best.sequence);
```

## Environment variable

```bash
export CURIE_API_KEY="sk-..."
```

```typescript
import { Curie } from 'curieai';
const client = new Curie(); // reads from CURIE_API_KEY automatically
```

## Models

| Model | Method | Slug |
|-------|--------|------|
| ESMFold v1 | `client.fold()` | `esm/esmfold-v1` |
| ESM-2 650M | `client.embed()` | `meta/esm2-650m` |
| ProteinMPNN | `client.design()` | `bakerlab/proteinmpnn` |

## Docs

Full API reference: [curie.sh/dashboard/docs](https://curie.sh/dashboard/docs)
