import Razorpay from "razorpay"

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  bonus: number
  popular?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter Pack", credits: 1000, price: 49900, bonus: 0 },
  { id: "growth", name: "Growth Pack", credits: 5000, price: 199900, bonus: 25, popular: true },
  { id: "scale", name: "Scale Pack", credits: 15000, price: 499900, bonus: 50 },
]

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require("crypto")
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  return expected === signature
}
