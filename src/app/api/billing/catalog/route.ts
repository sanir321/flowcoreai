import { NextResponse } from "next/server"
import { CREDIT_PACKS } from "@/lib/razorpay"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    packs: CREDIT_PACKS.map(p => ({
      ...p,
      price: p.price,
    })),
    currency: "INR",
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  })
}
