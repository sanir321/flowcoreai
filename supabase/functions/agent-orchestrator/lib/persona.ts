export interface AgentTraits {
  tone: 'professional' | 'friendly' | 'enthusiastic';
  formality: 'formal' | 'casual';
  brevity: 'concise' | 'standard' | 'detailed';
  proactivity: 'passive' | 'standard' | 'assertive';
  custom_directives?: string;
}

export function getPersonaInstructions(traits?: AgentTraits): string {
  if (!traits) return "";
  const instructions: string[] = [];
  if (traits.tone === 'professional') {
    instructions.push("Maintain a professional, polite, and helpful tone.");
  } else if (traits.tone === 'friendly') {
    instructions.push("Use a warm, welcoming tone and emojis where appropriate.");
  } else if (traits.tone === 'enthusiastic') {
    instructions.push("Be highly energetic and enthusiastic in your responses.");
  }
  if (traits.formality === 'formal') {
    instructions.push("Use formal language and avoid slang.");
  } else if (traits.formality === 'casual') {
    instructions.push("Use casual, everyday language. You can be relaxed but remain helpful.");
  }
  if (traits.brevity === 'concise') {
    instructions.push("Keep responses short and to the point. Avoid unnecessary fluff.");
  } else if (traits.brevity === 'detailed') {
    instructions.push("Provide detailed and comprehensive explanations.");
  }
  if (traits.proactivity === 'passive') {
    instructions.push("Respond only to what the user asks. Don't push for extra information unless necessary.");
  } else if (traits.proactivity === 'assertive') {
    instructions.push("Be assertive and take the lead in the conversation to guide the user towards a resolution or goal.");
  }
  const baseInstructions = instructions.length > 0 
    ? `\n## Personality & Style\n${instructions.join(" ")}` 
    : "";
  const customDirectives = traits.custom_directives 
    ? `\n\n## Custom Directives\n${traits.custom_directives}` 
    : "";
  return `${baseInstructions}${customDirectives}`;
}
