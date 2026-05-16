import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const crypto = require("crypto")
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex")

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()

      const { data: txs } = await supabase
        .from("billing_transactions")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .limit(1)

      const tx = txs?.[0]
      if (tx && tx.payment_status !== "success") {
        const bonusMatch = tx.description?.match(/\+ (\d+) bonus/)
        const bonusPct = bonusMatch ? Number(bonusMatch[1]) / 100 : 0
        const bonusCredits = Math.floor(tx.amount_credits * bonusPct)
        const totalCredits = tx.amount_credits + bonusCredits

        await supabase
          .from("billing_transactions")
          .update({
            razorpay_payment_id: paymentId,
            payment_status: "success",
          })
          .eq("id", tx.id)

        await supabase.rpc("increment_credits", {
          p_workspace_id: tx.workspace_id,
          p_credits: totalCredits,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook error:", err)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
