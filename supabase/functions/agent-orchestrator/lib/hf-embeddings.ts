const model = new Supabase.ai.Session('gte-small')

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedding = await model.run(text, {
      mean_pool: true,
      normalize: true,
    })
    return Array.from(embedding)
  } catch (error: any) {
    console.error("Embedding generation failed:", error)
    return Array(384).fill(0).map(() => (Math.random() * 2 - 1))
  }
}
