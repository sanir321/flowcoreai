export function getPersonaInstructions(traits: any): string {
  if (!traits) return "";

  const inst: string[] = [];
  
  // Tone
  if (traits.tone === 'friendly') inst.push("Use a warm, welcoming tone and emojis where appropriate.");
  else if (traits.tone === 'professional') inst.push("Maintain a professional and polished tone.");
  else if (traits.tone === 'enthusiastic') inst.push("Be energetic and enthusiastic in your responses.");
  
  // Formality
  if (traits.formality === 'formal') inst.push("Maintain a formal and respectful demeanor.");
  else if (traits.formality === 'casual') inst.push("Use a casual and relaxed conversational style.");
  
  // Brevity
  if (traits.brevity === 'concise') inst.push("Keep your responses very short and to the point.");
  else if (traits.brevity === 'detailed') inst.push("Provide thorough and detailed explanations.");
  
  // Proactivity
  if (traits.proactivity === 'assertive') inst.push("Be proactive in guiding the user towards a resolution.");
  else if (traits.proactivity === 'passive') inst.push("Respond only to what the user asks without being pushy.");
  
  return inst.join(" ");
}
