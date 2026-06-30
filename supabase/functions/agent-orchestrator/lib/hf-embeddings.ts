let model: any = null;

async function getModel() {
  if (!model) {
    model = new Supabase.ai.Session('gte-small');
  }
  return model;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const m = await getModel();
    const embedding = await m.run(text, {
      mean_pool: true,
      normalize: true,
    })
    return Array.from(embedding)
  } catch (error: any) {
    console.error("Embedding generation failed:", error)
    throw new Error("Embedding generation failed");
  }
}
