"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  MessageCircle, 
  HelpCircle, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw,
  Smartphone,
  Clock,
  Zap,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

import { useWorkspace } from "@/hooks/use-workspace"
import { createClient } from "@/lib/supabase/client"

interface DeviceInfo {
  status: string
  pushName?: string
  platform?: string
  business_id?: string
  message?: string
  phone?: string
}

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.717 2.009-1.41.25-.694.25-1.288.174-1.41-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function WhatsAppPage() {
  const [status, setStatus] = useState<'checking' | 'disconnected' | 'qr_pending' | 'connected' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const { workspaceId } = useWorkspace()
  const supabase = createClient()

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gowa/status")
      if (!res.ok) {
        // Don't try to parse JSON on a 500 error
        throw new Error(`API returned status ${res.status}`);
      }
      const data = await res.json() as DeviceInfo
      
      // Force connected state if API confirms it, overriding any local pending state
      if (data.status === 'connected') {
        setStatus('connected')
        setDeviceInfo(data)
        setShowPairingModal(false)
        setErrorMessage(null)
        if (status !== 'checking' && status !== 'connected') toast.success("WhatsApp connected!")
        return; // Exit early
      }

      // Handle other states only if not currently pairing
      if (!showPairingModal) {
        if (data.status === 'error') {
          setStatus('error')
          setErrorMessage(data.message || "A connection error occurred.")
        } else {
          // This covers 'disconnected', 'qr_pending' etc.
          setStatus(data.status as any || 'disconnected')
        }
      }
    } catch (e) {
      console.error("[STATUS_POLL_ERROR]", e)
      if (!showPairingModal) {
        setStatus('disconnected')
      }
    }
  }, [showPairingModal, status])

  // Subscribe to real-time changes for the session
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`gowa_session:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gowa_sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('[REALTIME] Change received!', payload);
          const newRecord = payload.new as any;
          if (payload.eventType === 'DELETE' || !newRecord) {
            setStatus('disconnected');
            setDeviceInfo(null);
          } else if (newRecord.status === 'connected') {
            setStatus('connected');
            setDeviceInfo({
              status: 'connected',
              phone: newRecord.phone_jid,
              pushName: newRecord.display_name,
            });
            setShowPairingModal(false);
          } else if (newRecord.status === 'error') {
            setStatus('error');
            setErrorMessage(newRecord.error_message || 'An unknown error occurred.');
          } else {
            setStatus(newRecord.status || 'disconnected');
          }
        }
      )
      .subscribe();

    // Also fetch initial status
    fetchStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, fetchStatus, supabase]);

  const startPairing = useCallback(async () => {
    setIsLoading(true)
    setQrCode(null)
    setErrorMessage(null)
    setTimeLeft(60)
    try {
      const res = await fetch("/api/gowa/init")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setQrCode(data.qr_code)
      setStatus('qr_pending')
      setShowPairingModal(true)
      toast.success("Connection initialized")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to initialize pairing")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showPairingModal && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (showPairingModal && timeLeft === 0) {
      void startPairing()
    }
    return () => clearInterval(timer)
  }, [showPairingModal, timeLeft, startPairing])

  // Poll GoWA status while QR modal is open to detect scan
  useEffect(() => {
    if (!showPairingModal) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/gowa/status")
        if (res.ok) {
          const data = await res.json()
          if (data.status === "connected") {
            setStatus("connected")
            setDeviceInfo(data)
            setShowPairingModal(false)
            toast.success("WhatsApp connected!")
          }
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [showPairingModal])

  const disconnectSession = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/gowa/logout", { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setStatus('disconnected')
      setDeviceInfo(null)
      setQrCode(null)
      setErrorMessage(null)
      toast.success("WhatsApp disconnected")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Logout failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="max-w-4xl mx-auto font-sans pb-32 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-52 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        
        <hr className="border-gray-100 my-10" />

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex justify-center gap-3">
            <div className="h-12 w-32 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 w-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-32">
      <div className="flex items-center justify-between mb-2 text-gray-900">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">WhatsApp Connection</h1>
        <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
          <HelpCircle className="h-4 w-4" /> Help Center
        </button>
      </div>
      <p className="text-sm text-gray-500 font-medium">Link your WhatsApp account to enable automated business messaging.</p>
      
      <hr className="border-gray-100 my-10" />

      {status === 'connected' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-[2.5rem] border border-emerald-100 bg-emerald-50/20 flex flex-col items-center text-center space-y-8"
        >
           <div className="h-24 w-24 rounded-[2rem] bg-[#25D366] flex items-center justify-center text-white shadow-2xl shadow-[#25D366]/40 relative p-6">
              <WhatsAppLogo className="h-full w-full" />
              <div className="absolute -inset-2 rounded-[2.5rem] border-2 border-[#25D366]/20 animate-pulse" />
           </div>
           
           <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">WhatsApp is Active</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Account <span className="font-bold text-gray-900">{deviceInfo?.phone}</span> is currently handling messages.
              </p>
           </div>

           <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-white border border-emerald-100 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 text-center">Automated Sync Active</span>
           </div>

           <div className="mt-6">
               <Button 
                onClick={disconnectSession}
                disabled={isLoading}
                variant="outline" 
                className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl h-11 px-10 text-sm font-semibold"
               >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Disconnect WhatsApp
               </Button>
           </div>
        </motion.div>
      ) : status === 'error' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-[2.5rem] border border-rose-100 bg-rose-50/20 flex flex-col items-center text-center space-y-8"
        >
           <div className="h-24 w-24 rounded-[2rem] bg-rose-500 flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 relative">
              <AlertCircle className="h-10 w-10" />
           </div>
           
           <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Connection Issue</h2>
              <p className="text-sm text-gray-500 max-w-md">
                {errorMessage}
              </p>
           </div>

           <div className="flex gap-4 pt-6">
              <Button 
                onClick={startPairing}
                disabled={isLoading}
                className="bg-black text-white rounded-xl h-12 px-8 text-xs font-semibold"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Try Again
              </Button>
              <Button 
                onClick={disconnectSession}
                variant="outline"
                className="border-gray-200 text-gray-500 rounded-xl h-12 px-8 text-xs font-semibold"
              >
                Reset Connection
              </Button>
           </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-[#25D366] shadow-inner mb-8 relative group cursor-pointer hover:scale-105 transition-all duration-500 p-7">
              <WhatsAppLogo className="h-full w-full" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Connect WhatsApp</h2>
           <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed font-medium">
             Link your business number to start automating customer interactions.
           </p>
           
           <button 
            onClick={startPairing}
            disabled={isLoading}
            className="bg-black text-white rounded-2xl px-12 py-5 text-sm font-semibold mt-12 hover:bg-gray-800 transition-all shadow-2xl active:scale-95 flex items-center gap-4 group"
           >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />}
              {isLoading ? "Connecting..." : "Start Connection"}
           </button>

           <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto border-t border-gray-50 pt-16 text-left">
              {[
                  { icon: ShieldCheck, title: "Secure", desc: "Private and encrypted messaging services." },
                  { icon: Zap, title: "Smart", desc: "Automated routing and answers." },
                  { icon: Smartphone, title: "Simple", desc: "Works even when your phone is offline." }
              ].map((feature, i) => (
                  <div key={i} className="space-y-3">
                      <feature.icon className="h-5 w-5 text-black" />
                      <h4 className="text-sm font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
                  </div>
              ))}
           </div>
        </div>
      )}

      {/* Pairing Modal */}
      <Dialog open={showPairingModal} onOpenChange={(open) => !open && setShowPairingModal(false)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl font-sans text-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left: QR Side */}
                <div className="p-12 bg-white flex flex-col items-center justify-center space-y-8 relative">
                    <div className="relative p-4 bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden aspect-square flex items-center justify-center">
                        {qrCode ? (
                            <img src={qrCode} alt="WhatsApp QR" className="w-full h-full object-contain" />
                        ) : (
                            <div className="h-64 w-64 flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-2xl">
                                <Loader2 className="h-10 w-10 animate-spin text-gray-200" />
                                <span className="text-xs font-semibold text-gray-500">Preparing...</span>
                            </div>
                        )}
                        {timeLeft === 0 && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl space-y-4">
                                <AlertCircle className="h-8 w-8 text-rose-500" />
                                <span className="text-xs font-bold">Expired</span>
                                <Button onClick={startPairing} variant="outline" size="sm" className="rounded-lg h-8 text-[10px]">Refresh</Button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-gray-50 border border-gray-100">
                        <Clock className={cn("h-3.5 w-3.5", timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-gray-400")} />
                        <span className={cn("text-xs font-bold", timeLeft < 10 ? "text-rose-600" : "text-gray-600")}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Right: Instructions */}
                <div className="p-12 bg-gray-50 flex flex-col justify-center space-y-10 border-l border-gray-100">
                    <div className="space-y-2 text-left">
                        <h3 className="text-xl font-bold text-gray-900">Connect Your WhatsApp</h3>
                        <p className="text-sm text-gray-500 font-medium">Follow these steps to link your account.</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { step: "1", text: "Open WhatsApp on your phone" },
                            { step: "2", text: "Tap Menu or Settings and select Linked Devices" },
                            { step: "3", text: "Tap on Link a Device" },
                            { step: "4", text: "Point your phone to this screen to capture the code" }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                                <div className="h-6 w-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                    {item.step}
                                </div>
                                <p className="text-sm font-medium text-gray-600 leading-tight text-left">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6">
                        <Button 
                            onClick={() => setShowPairingModal(false)} 
                            variant="ghost" 
                            className="w-full h-12 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
