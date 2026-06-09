/**
 * Basic usage examples for Curie SDK
 * Run with: npx tsx examples/basic.ts
 */

import Curie from '../src'

async function main() {
  // Create client (uses CURIE_API_KEY env var)
  const client = new Curie({
    apiKey: process.env.CURIE_API_KEY,
  })

  // Example protein sequence
  const sequence = 'MKTIIALSYIFCLVFA'

  console.log('🧬 Folding protein structure...')
  const structure = await client.fold(sequence)
  console.log(`✓ Confidence: ${structure.confidence.toFixed(1)}%`)
  console.log(`✓ Length: ${structure.length} residues`)
  console.log(`✓ Model: ${structure.model}`)
  console.log(`✓ Cost: $${structure.costUsd.toFixed(4)}`)
  console.log(`✓ High confidence: ${structure.isHighConfidence}`)

  console.log('\n📊 Generating embeddings...')
  const embedding = await client.embed(sequence)
  console.log(`✓ Dimensions: ${embedding.dim}`)
  console.log(`✓ Model: ${embedding.model}`)
  console.log(`✓ Cost: $${embedding.costUsd.toFixed(4)}`)

  console.log('\n🔬 Designing sequences...')
  const design = await client.design(structure.pdb, {
    numSequences: 3,
    temperature: 0.1,
  })
  console.log(`✓ Generated ${design.sequences.length} sequences`)
  console.log(`✓ Best score: ${design.best.score.toFixed(3)}`)
  console.log(`✓ Best sequence: ${design.best.sequence.substring(0, 20)}...`)
}

// Error handling example
main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
