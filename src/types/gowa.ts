// /types/gowa.ts

export interface GoWAWebhookPayload {
  event: 'message' | 'message.ack' | 'message.revoked' | 'presence'
  session: string               // Session/Device ID
  timestamp: number
  data: GoWAMessageData
}

export interface GoWAMessageData {
  id: string                    // Unique message ID from WhatsApp
  from: string                  // Sender phone: "919876543210@s.whatsapp.net"
  pushName: string              // Sender's display name on WhatsApp
  isGroup: boolean              // true if group message — IGNORE group messages
  type: GoWAMessageType
  body?: string                 // Text content (only if type === 'conversation')
  caption?: string              // Caption for media messages
  mediaPath?: string            // Server path to downloaded media
  mimeType?: string             // e.g. "image/jpeg"
  timestamp: number
  quotedMsg?: {                 // If user replied to a message
    id: string
    body: string
  }
}

export type GoWAMessageType =
  | 'conversation'              // Plain text message
  | 'extendedTextMessage'       // Text with link preview
  | 'imageMessage'              // Image
  | 'audioMessage'              // Voice note
  | 'videoMessage'              // Video
  | 'documentMessage'           // File/PDF
  | 'stickerMessage'            // Sticker
  | 'reactionMessage'           // Reaction emoji
  | 'liveLocationMessage'       // Live location

export interface SendTextPayload {
  phone: string    // "919876543210" — NO @s.whatsapp.net suffix
  message: string  // The text to send
}

export interface SendImagePayload {
  phone: string
  image_url: string
  caption: string
}

export interface SendLinkPayload {
  phone: string
  link: string
  caption: string
}
