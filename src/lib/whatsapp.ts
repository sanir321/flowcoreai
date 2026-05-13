/**
 * Calculates a realistic typing delay based on message length.
 * @param chars Number of characters in the message
 * @returns Milliseconds to delay
 */
export function typingDelay(chars: number): number {
  return Math.max(800, Math.min(chars * 35, 4000));
}

/**
 * Checks if a session is within the standard WhatsApp 24-hour window.
 * @param lastCustomerMessageAt ISO timestamp of the last message from the customer
 * @returns boolean
 */
export function isWithin24HourWindow(lastCustomerMessageAt: string | null): boolean {
  if (!lastCustomerMessageAt) return false;
  
  const lastActive = new Date(lastCustomerMessageAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - lastActive) < twentyFourHours;
}

/**
 * Splits a long message into smaller parts at sentence boundaries.
 * @param content The message content
 * @param maxChars Maximum characters per part
 * @returns Array of message parts
 */
export function splitMessage(content: string, maxChars = 1000): string[] {
  if (content.length <= maxChars) return [content];

  const parts: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      parts.push(remaining);
      break;
    }

    // Find the last sentence boundary before maxChars
    let boundary = -1;
    const boundaries = ['. ', '! ', '? '];
    
    for (const b of boundaries) {
      const lastIndex = remaining.lastIndexOf(b, maxChars);
      if (lastIndex > boundary) boundary = lastIndex;
    }

    if (boundary === -1) {
      // No sentence boundary found, hard split at maxChars
      boundary = maxChars;
    } else {
      boundary += 1; // Include the punctuation
    }

    parts.push(remaining.substring(0, boundary).trim());
    remaining = remaining.substring(boundary).trim();

    // Prevent infinite loops if splitting fails
    if (parts.length > 5) {
      parts.push(remaining);
      break;
    }
  }

  return parts.slice(0, 2); // Requirement: never more than 2 parts
}
