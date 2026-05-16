import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { razorpay, verifyRazorpaySignature } from "@/lib/razorpay"
import { z } from "zod"

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
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
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment data" }, { status: 400 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 })

    const { data: tx } = await supabase
      .from("billing_transactions")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("workspace_id", workspaceId)
      .single()

    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    if (tx.payment_status === "success") return NextResponse.json({ success: true, credits_added: tx.amount_credits })

    await supabase
      .from("billing_transactions")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        payment_status: "success",
      })
      .eq("id", tx.id)

    const { error: rpcError } = await supabase.rpc("increment_credits", {
      p_workspace_id: workspaceId,
      p_credits: tx.amount_credits,
    })

    if (rpcError) throw rpcError

    return NextResponse.json({ success: true, credits_added: tx.amount_credits })
  } catch (err: any) {
    console.error("Verify payment error:", err)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
