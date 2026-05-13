/**
 * hf-embeddings.ts - Free HuggingFace Inference API for Embeddings
 */

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add "Authorization": `Bearer ${Deno.env.get('HUGGINGFACE_API_KEY')}` if you have a key
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HuggingFace API Error: ${err}`);
    }

    const embedding = await response.json();
    
    // all-MiniLM-L6-v2 returns 384 dimensions.
    return embedding;
  } catch (error: any) {
    console.error("Embedding generation failed:", error);
    // Return random fallback to prevent hard crash if HF is down
    return Array(384).fill(0).map(() => (Math.random() * 2 - 1));
  }
}
