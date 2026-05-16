import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRazorpay, CREDIT_PACKS } from "@/lib/razorpay"
import { z } from "zod"

const schema = z.object({
  pack_id: z.enum(["starter", "growth", "scale"]),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid pack" }, { status: 400 })

    const pack = CREDIT_PACKS.find(p => p.id === parsed.data.pack_id)
    if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 })

    const bonusCredits = Math.floor(pack.credits * pack.bonus / 100)
    const totalCredits = pack.credits + bonusCredits

    const order = await getRazorpay().orders.create({
      amount: pack.price,
      currency: "INR",
      receipt: `${workspaceId}_${pack.id}_${Date.now()}`,
      notes: {
        workspace_id: workspaceId,
        pack_id: pack.id,
        credits: String(pack.credits),
        bonus: String(pack.bonus),
        bonus_credits: String(bonusCredits),
        total_credits: String(totalCredits),
      },
    })

    await supabase.from("billing_transactions").insert({
      workspace_id: workspaceId,
      amount_credits: totalCredits,
      transaction_type: "purchase",
      description: `${pack.name} - ${totalCredits} credits`,
      amount_paid: pack.price,
      currency: "INR",
      razorpay_order_id: order.id,
      payment_status: "pending",
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err: any) {
    console.error("Create order error:", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
