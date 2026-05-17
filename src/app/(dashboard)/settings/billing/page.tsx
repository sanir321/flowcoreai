"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { getSiteUrl } from "@/lib/site"
import { Button } from "@/components/ui/button"
import { 
  CreditCard, 
  Plus, 
  History, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/use-workspace"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Tables } from "@/types/supabase"

export default function BillingPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<Tables<"workspaces"> | null>(null)
  const [transactions, setTransactions] = useState<Tables<"billing_transactions">[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (wsLoading) return
    
    if (!workspaceId) {
      setIsLoading(false)
      return
    }
    
    async function fetchWorkspace() {
      try {
        const { data, error: fetchError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", workspaceId!)
          .is("deleted_at", null)
          .single()
        
        if (fetchError) throw fetchError
        setWorkspace(data)

        // Fetch last 10 transactions
        const { data: txData, error: txError } = await supabase
          .from("billing_transactions")
          .select("*")
          .eq("workspace_id", workspaceId!)
          .order("created_at", { ascending: false })
          .limit(10)

        if (txError) {
          console.error("Error fetching transactions:", txError)
        } else {
          setTransactions(txData || [])
        }
      } catch (err) {
        console.error("Error fetching billing data:", err)
        const message = err instanceof Error ? err.message : "Failed to load billing data"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWorkspace()
  }, [workspaceId, wsLoading, supabase])

  const handleUpgrade = () => {
    window.open("https://wa.me/917904721312?text=I%20want%20to%20recharge%20my%20FlowCore%20credits", "_blank")
  }

  const ANIMATION_TRANSITION = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: ANIMATION_TRANSITION
  }

  if (wsLoading || isLoading) return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      <p className="text-sm text-gray-500 font-medium">Loading billing data...</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <p className="text-sm text-red-500 font-medium">{error}</p>
      <Button onClick={() => window.location.reload()} variant="outline">
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto font-sans pb-32">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-2 text-gray-900">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Billing & Credits</h1>
        <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
          <HelpCircle className="h-4 w-4" /> Help Center
        </button>
      </motion.div>
      <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.05 }}>
        <p className="text-sm font-medium text-gray-500">Manage your conversation credits and usage limits.</p>
      </motion.div>

      <hr className="border-gray-100 my-10" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Credits Balance Card */}
        <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.1 }} className="md:col-span-2">
          <Card className="relative overflow-hidden p-12 rounded-[2.5rem] bg-white border-gray-100 shadow-sm group hover:border-[#D95E46]/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <Zap className="h-40 w-40 text-black" />
            </div>
            
            <div className="relative space-y-8">
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  <h3 className="text-sm font-semibold text-gray-600 tracking-wide uppercase">Current Balance</h3>
               </div>
               
               <div className="space-y-1">
                  <h2 className="text-7xl font-bold text-gray-900 tracking-tighter">
                    {workspace?.credits_balance?.toLocaleString() || 0}
                  </h2>
                  <p className="text-base font-medium text-gray-500">Available Credits</p>
               </div>

               <div className="pt-6 flex flex-wrap gap-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="bg-black text-white hover:bg-gray-800 rounded-2xl px-10 h-14 text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center gap-3"
                  >
                    <Plus className="h-5 w-5" />
                    Recharge Credits
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl px-10 h-14 text-sm font-bold transition-all"
                  >
                    <History className="h-5 w-5 mr-2" />
                    Usage History
                  </Button>
               </div>
            </div>
          </Card>
        </motion.div>

        {/* Plan Info Card */}
        <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.2 }}>
          <Card className="h-full p-8 bg-gray-50/50 border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-600">Active Plan</h3>
               <div className="space-y-1">
                  <p className="text-xl font-bold text-gray-900 uppercase tracking-tight">{workspace?.plan || 'Pay As You Go'}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Indian Manual Billing Mode</p>
               </div>
            </div>

            <div className="pt-8 space-y-4">
               <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                  Secure Manual Recharge
               </div>
               <p className="text-[10px] text-gray-400 leading-relaxed italic">
                 Contact support via WhatsApp to recharge your wallet. Credits are usually added within 15 minutes of payment verification.
               </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Pricing Info Section */}
      <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.3 }} className="space-y-6 mt-12">
         <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-600">Usage Rates</h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gray-50/30 border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-gray-50/50 transition-all duration-300">
               <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 tracking-tight">AI Generated Response</p>
                  <p className="text-[11px] text-gray-500 font-medium leading-none">Per outbound message</p>
               </div>
               <div className="text-right space-y-0.5">
                  <p className="text-xl font-bold text-gray-900 tracking-tight">1 Credit</p>
                  <p className="text-[10px] text-[#10B981] font-bold tracking-wide uppercase">~₹0.50</p>
               </div>
            </Card>

            <Card className="p-6 bg-gray-50/30 border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-gray-50/50 transition-all duration-300">
               <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 tracking-tight">Media Handling</p>
                  <p className="text-[11px] text-gray-500 font-medium leading-none">Images, PDF, Voice</p>
               </div>
               <div className="text-right space-y-0.5">
                  <p className="text-xl font-bold text-gray-900 tracking-tight">2 Credits</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Premium</p>
               </div>
            </Card>
         </div>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.4 }} className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-600">Recent Activity</h3>
          </div>
          <Button variant="ghost" className="text-xs text-gray-500 hover:text-black font-medium">
            View All
          </Button>
        </div>

        <Card className="overflow-hidden border-gray-100 bg-white rounded-2xl shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="w-[100px] text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Description</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <History className="h-8 w-8 text-gray-200" />
                      <p className="text-sm text-gray-500 font-medium">No recent transactions found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.transaction_type === 'purchase' ? (
                          <div className="p-1.5 bg-[#10B981]/10 rounded-lg text-[#10B981]">
                            <ArrowUpRight className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                            <ArrowDownLeft className="h-3 w-3" />
                          </div>
                        )}
                        <span className="text-[11px] font-bold uppercase text-gray-600 tracking-tight">
                          {tx.transaction_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">{tx.description}</TableCell>
                    <TableCell className="text-xs text-gray-500 font-medium">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${tx.transaction_type === 'purchase' ? 'text-[#10B981]' : 'text-gray-900'}`}>
                        {tx.transaction_type === 'purchase' ? '+' : '-'}{Math.abs(tx.amount_credits).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      <motion.div {...fadeUp} transition={{ ...ANIMATION_TRANSITION, delay: 0.5 }} className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
         <a 
          href={`${getSiteUrl()}/pricing`} 
          target="_blank" 
          className="text-xs font-semibold text-gray-500 hover:text-black transition-colors flex items-center gap-1.5 group"
         >
           View full pricing details <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
         </a>
      </motion.div>
    </div>
  )
}

