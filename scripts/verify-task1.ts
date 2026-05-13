
import { generateEmbedding } from "../supabase/functions/agent-orchestrator/lib/hf-embeddings.ts";

async function testDimensions() {
  console.log("Testing Embedding Dimensions...");
  try {
    const embedding = await generateEmbedding("Hello world");
    console.log(`Dimension: ${embedding.length}`);
    if (embedding.length === 384) {
      console.log("✅ SUCCESS: Dimensions match (384)");
    } else {
      console.log(`❌ FAILURE: Expected 384, got ${embedding.length}`);
    }
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testDimensions();
