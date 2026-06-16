"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon, 
  Clock, 
  MoreHorizontal,
  Plus,
  RefreshCw,
  Phone,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Circle,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfWeek, addHours, startOfDay, isSameDay, subDays, startOfMonth, subMonths, endOfMonth, endOfWeek, endOfDay, eachDayOfInterval, isWithinInterval, addMonths } from "date-fns"
import { 
  Sheet, 
  SheetContent, 
} from "@/components/ui/sheet"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cancelAppointment, createAppointment, rescheduleAppointment } from "@/app/actions/appointments"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AppointmentsClientProps {
  initialAppointments: any[]
  workspaceId: string
  isModuleActive: boolean
}

const STATUS_OPTIONS = [
  { id: 'awaiting_response', label: 'Awaiting Response', icon: Circle, bg: 'bg-gray-100/50', text: 'text-gray-500' },
  { id: 'awaiting_confirmation', label: 'Awaiting Confirmation', icon: Clock, bg: 'bg-blue-50', text: 'text-blue-500' },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-500' },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-500' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, bg: 'bg-emerald-100/40', text: 'text-emerald-700' },
  { id: 'no_show', label: 'No Show', icon: XCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
  { id: 'rescheduled', label: 'Rescheduled', icon: RefreshCw, bg: 'bg-purple-50', text: 'text-purple-500' },
]

export function AppointmentsClient({ initialAppointments, workspaceId, isModuleActive }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments)

  // Handle real-time updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointments:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments((prev) => [...prev, payload.new])
          }
          if (payload.eventType === 'UPDATE') {
            setAppointments((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a))
          }
          if (payload.eventType === 'DELETE') {
            setAppointments((prev) => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', startTime: '09:00', startPeriod: 'am', endTime: '09:30', endPeriod: 'am' })
  
  // Creation Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    startPeriod: 'am',
    endTime: '09:30',
    endPeriod: 'am',
    notes: ''
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ 
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), 
    end: endOfWeek(new Date(), { weekStartsOn: 1 }) 
  })
  const [pickerMonth, setPickerMonth] = useState(new Date())

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      // Status filter
      if (statusFilter && appt.status !== statusFilter) return false;
      
      // Date range filter - Apply to both views for consistency
      const apptDate = new Date(appt.start_at);
      const start = startOfDay(dateRange.start);
      const end = endOfDay(dateRange.end);
      if (apptDate < start || apptDate > end) return false;
      
      return true;
    });
  }, [appointments, statusFilter, dateRange])

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)

    try {
      // Helper to convert 12h time to 24h ISO
      const toISO = (dateStr: string, timeStr: string, period: string) => {
        const parts = timeStr.split(':').map(Number);
        let hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        const d = new Date(dateStr);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
      }

      const start_at = toISO(formData.date, formData.startTime, formData.startPeriod);
      const end_at = toISO(formData.date, formData.endTime, formData.endPeriod);

      const result = await createAppointment({
        workspace_id: workspaceId,
        customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
        customer_phone: formData.phone,
        service: formData.propertyId || 'General Booking',
        start_at,
        end_at
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.data.calendar_synced ? "Appointment created & synced with Calendar" : "Appointment created (Calendar sync failed)")
        setAppointments(prev => [...prev, result.data])
        setIsCreateModalOpen(false)
        setFormData({
            firstName: '', lastName: '', email: '', phone: '', propertyId: '',
            date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', startPeriod: 'am',
            endTime: '09:30', endPeriod: 'am', notes: ''
        })
      }
    } catch (err: any) {
      console.error("[APPOINTMENT_CREATE_ERROR]", err)
      toast.error(err?.message || "Failed to process appointment")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return
    setIsCancelling(true)
    const result = await cancelAppointment(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Appointment cancelled")
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
      setSelectedAppt(null)
    }
    setIsCancelling(false)
  }

  const openReschedule = (appt: any) => {
    const d = new Date(appt.start_at)
    setRescheduleForm({
      date: format(d, 'yyyy-MM-dd'),
      startTime: format(d, 'hh:mm'),
      startPeriod: format(d, 'aa').toLowerCase(),
      endTime: format(addHours(d, 1), 'hh:mm'),
      endPeriod: format(addHours(d, 1), 'aa').toLowerCase(),
    })
    setSelectedAppt(appt)
    setIsRescheduleOpen(true)
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)
    try {
      const toISO = (dateStr: string, timeStr: string, period: string) => {
        const parts = timeStr.split(':').map(Number);
        let hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        const d = new Date(dateStr);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
      }

      const result = await rescheduleAppointment({
        appointment_id: selectedAppt.id,
        start_at: toISO(rescheduleForm.date, rescheduleForm.startTime, rescheduleForm.startPeriod),
        end_at: toISO(rescheduleForm.date, rescheduleForm.endTime, rescheduleForm.endPeriod),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Appointment rescheduled & synced with Calendar")
        setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? { ...a, ...result.data } : a))
        setIsRescheduleOpen(false)
        setSelectedAppt(null)
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to reschedule appointment")
    } finally {
      setIsActionLoading(false)
    }
  }

  if (!isModuleActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-sans bg-white text-gray-900">
        <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
          <CalendarIcon className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm font-semibold">Appointment Booking agent is not active</p>
        <p className="text-xs text-gray-400 font-medium mt-1">Go to Agent Hub to activate the Appointment Booking agent.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-sans bg-white overflow-hidden relative text-gray-900">
          {/* Header Actions */}
          <div className="h-20 px-4 md:px-6 lg:px-10 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <h1 className="text-xl font-bold tracking-tight">Appointments</h1>
          
          <div className="flex items-center gap-4">
              <Button variant="outline" className="h-10 px-6 rounded-xl text-xs font-bold border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                <Copy size={14} /> Copy link
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 px-6 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <Plus size={14} /> Add
              </Button>
          </div>
      </div>

      {/* View Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="h-16 px-4 md:px-6 lg:px-10 border-b border-gray-100 flex items-center gap-6 bg-white shrink-0">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-medium text-gray-400">Show</span>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-all min-w-[80px] justify-between group">
                            {statusFilter ? STATUS_OPTIONS.find(o => o.id === statusFilter)?.label : 'All'}
                            <ChevronDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                         </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5 border-gray-100 shadow-2xl space-y-0.5 bg-white">
                         <DropdownMenuItem 
                            onClick={() => setStatusFilter(null)} 
                            className="rounded-xl flex justify-between py-2.5 px-4 focus:bg-gray-50 cursor-pointer"
                         >
                            <span className="text-xs font-semibold text-gray-900">All</span>
                            {!statusFilter && <Check size={14} className="text-gray-300" />}
                         </DropdownMenuItem>
                         <div className="h-px bg-gray-50 my-1 mx-2" />
                         {STATUS_OPTIONS.map((opt) => (
                           <DropdownMenuItem 
                            key={opt.id} 
                            onClick={() => setStatusFilter(opt.id)}
                            className={cn(
                                "rounded-xl flex items-center justify-between py-2 px-3 focus:bg-blue-50/50 cursor-pointer group transition-colors",
                                statusFilter === opt.id && "bg-blue-50/50"
                            )}
                           >
                              <div className={cn("px-3 py-1.5 rounded-full flex items-center gap-2.5", opt.bg)}>
                                 <opt.icon className={cn("h-3.5 w-3.5 stroke-[2]", opt.text)} />
                                 <span className={cn("text-[11px] font-semibold tracking-tight", opt.text)}>{opt.label}</span>
                              </div>
                              {statusFilter === opt.id && <Check size={14} className="text-blue-400" />}
                           </DropdownMenuItem>
                         ))}
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 border-l border-gray-100 pl-6 text-gray-900">
                   <span className="text-xs font-medium text-gray-400">during</span>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-all">
                            {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')} <ChevronDown size={14} className="opacity-40" />
                         </button>
                      </DropdownMenuTrigger>
                       <DropdownMenuContent align="start" className="p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-w-0 w-[95vw] max-w-[600px] bg-white">
                         {/* Presets Sidebar */}
                         <div className="w-48 bg-white border-r border-gray-100 p-6 flex flex-col gap-1 shrink-0">
                            {[
                              { label: 'Today', action: () => setDateRange({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
                              { label: 'Yesterday', action: () => {
                                const d = subDays(new Date(), 1);
                                setDateRange({ start: startOfDay(d), end: endOfDay(d) });
                              }},
                              { label: 'Last 7 days', action: () => setDateRange({ start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) }) },
                              { label: 'This Week', action: () => setDateRange({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
                              { label: 'Last Week', action: () => {
                                const d = subDays(new Date(), 7);
                                setDateRange({ start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) });
                              }},
                              { label: 'This Month', action: () => setDateRange({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
                              { label: 'Last Month', action: () => {
                                const d = subMonths(new Date(), 1);
                                setDateRange({ start: startOfMonth(d), end: endOfMonth(d) });
                              }},
                              { label: 'All time', action: () => {
                                const earliest = appointments.length > 0 
                                  ? new Date(Math.min(...appointments.map(a => new Date(a.start_at).getTime())))
                                  : subDays(new Date(), 365);
                                setDateRange({ start: startOfDay(earliest), end: endOfDay(new Date()) });
                              }},
                            ].map((p, i) => (
                              <button key={i} onClick={p.action} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition-all">{p.label}</button>
                            ))}
                         </div>
                         {/* Calendar Area */}
                         <div className="flex-1 p-8 flex flex-col space-y-8">
                            <div className="flex justify-center gap-8">
                               {[0, 1].map((offset) => {
                                 const monthDate = addMonths(startOfMonth(pickerMonth), offset);
                                 const days = eachDayOfInterval({
                                   start: startOfWeek(monthDate),
                                   end: endOfWeek(endOfMonth(monthDate))
                                 });

                                 return (
                                   <div key={offset} className="space-y-4">
                                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                         {offset === 0 ? (
                                           <button onClick={() => setPickerMonth(subMonths(pickerMonth, 1))}><ChevronLeft size={14} /></button>
                                         ) : <div className="w-3" />}
                                         <span>{format(monthDate, 'MMMM yyyy')}</span>
                                         {offset === 1 ? (
                                           <button onClick={() => setPickerMonth(addMonths(pickerMonth, 1))}><ChevronRight size={14} /></button>
                                         ) : <div className="w-3" />}
                                      </div>
                                      <div className="grid grid-cols-7 gap-1 text-center">
                                         {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d} className="text-[9px] font-bold text-gray-300 w-8">{d}</span>)}
                                         {days.map((day, i) => {
                                           const isSelected = isSameDay(day, dateRange.start) || isSameDay(day, dateRange.end);
                                           const inRange = isWithinInterval(day, { start: dateRange.start, end: dateRange.end });
                                           const isCurrentMonth = day.getMonth() === monthDate.getMonth();

                                           return (
                                             <button 
                                              key={i} 
                                              onClick={() => {
                                                if (isSameDay(day, dateRange.start)) return;
                                                if (day < dateRange.start) {
                                                  setDateRange({ start: startOfDay(day), end: endOfDay(dateRange.end) });
                                                } else {
                                                  setDateRange({ start: dateRange.start, end: endOfDay(day) });
                                                }
                                              }}
                                              className={cn(
                                                "w-8 h-8 text-[11px] font-semibold flex items-center justify-center transition-all relative",
                                                !isCurrentMonth && "opacity-20",
                                                isSelected ? "bg-black text-white rounded-lg z-10" : inRange ? "bg-gray-100" : "hover:bg-gray-100 rounded-lg"
                                              )}
                                             >
                                               {format(day, 'd')}
                                             </button>
                                           );
                                         })}
                                      </div>
                                   </div>
                                 );
                               })}
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                               <DialogClose>
                                  <button className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-black transition-colors">Close</button>
                               </DialogClose>
                            </div>
                         </div>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-10 bg-gray-50/30">
                {filteredAppointments.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">Customer</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">Service</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">Date & Time</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">Status</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">Google Sync</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appt) => {
                          const status = STATUS_OPTIONS.find(o => o.id === appt.status) || STATUS_OPTIONS[0]!;
                          return (
                            <TableRow key={appt.id} className="group border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <TableCell className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-900">{appt.customer_name}</span>
                                  <span className="text-[10px] text-gray-400 font-medium">{appt.customer_phone}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                <span className="text-sm text-gray-500 font-medium capitalize">{appt.service}</span>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-700 font-medium">{format(new Date(appt.start_at), 'MMM d, yyyy')}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{format(new Date(appt.start_at), 'h:mm a')}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                <Badge className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border-none", status.bg, status.text)}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                {appt.google_event_id ? (
                                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Synced
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400">Not synced</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4 px-6 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAppt(appt)}
                                  className="h-8 rounded-lg text-[10px] font-bold text-[#c65f39] hover:bg-[#c65f39]/5 hover:text-[#c65f39]"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-900">
                    <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
                       <CalendarIcon className="h-8 w-8 text-gray-200" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No appointments found</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">No appointments match the current filter or date range.</p>
                  </div>
                )}
              </div>
      </div>

      {/* CREATE NEW APPOINTMENT MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
         <DialogContent className="sm:max-w-xl bg-white rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl font-sans text-gray-900 max-h-[85vh] !flex !flex-col">
            <div className="p-8 border-b border-gray-50 bg-white shrink-0">
               <DialogHeader className="space-y-1 text-left text-gray-900">
                  <DialogTitle className="text-xl font-bold tracking-tight">Create new appointment</DialogTitle>
                  <DialogDescription className="text-xs text-gray-400 font-medium">Fill in the details to schedule a new appointment.</DialogDescription>
               </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <div className="p-8">
                  <form onSubmit={handleCreateAppointment} id="create-appt-form" className="space-y-6 relative">
                     {isActionLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
                           <Loader2 className="h-8 w-8 animate-spin text-[#c65f39]" />
                        </div>
                     )}
                     <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-gray-700 ml-1">First Name <span className="text-rose-500">*</span></Label>
                              <Input 
                                 placeholder="John" 
                                 required 
                                 value={formData.firstName}
                                 onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                 className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium text-sm" 
                              />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-gray-700 ml-1">Last Name <span className="text-rose-500">*</span></Label>
                              <Input 
                                 placeholder="Doe" 
                                 required 
                                 value={formData.lastName}
                                 onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                 className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium text-sm" 
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-bold text-gray-700 ml-1">Email <span className="text-rose-500">*</span></Label>
                           <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                              <Input 
                                 type="email" 
                                 placeholder="email@example.com" 
                                 required 
                                 value={formData.email}
                                 onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                 className="h-11 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium text-sm" 
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-bold text-gray-700 ml-1">Phone Number <span className="text-rose-500">*</span></Label>
                           <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                              <Input 
                                 placeholder="+1 (555) 123-4567" 
                                 required 
                                 value={formData.phone}
                                 onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                 className="h-11 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium text-sm" 
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                           <Label className="text-[10px] font-bold text-gray-700 ml-1">Service or Location (Optional)</Label>
                           <div className="relative group">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                              <Input 
                                 placeholder="e.g. Consultation / Room 102" 
                                 value={formData.propertyId}
                                 onChange={e => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                                 className="h-11 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-[#c65f39]/20 transition-all font-medium text-sm text-gray-900" 
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-gray-700 ml-1">Date <span className="text-rose-500">*</span></Label>
                              <Input 
                                 type="date"
                                 value={formData.date}
                                 onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                 className="h-11 rounded-xl bg-gray-50 border-gray-100 font-medium text-xs text-gray-900" 
                              />
                           </div>
                           <div className="space-y-1.5 col-span-2 grid grid-cols-2 gap-3 text-gray-900">
                              <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-gray-700 ml-1">Start Time <span className="text-rose-500">*</span></Label>
                                 <div className="flex gap-1.5">
                                    <Input 
                                       value={formData.startTime}
                                       onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                       className="h-11 rounded-xl bg-gray-50 border-gray-100 w-full font-medium text-xs" 
                                    />
                                    <Select 
                                       value={formData.startPeriod}
                                       onValueChange={val => setFormData(prev => ({ ...prev, startPeriod: val }))}
                                    >
                                       <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 w-16 focus:ring-0 text-[10px] px-2 text-gray-900">
                                          <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent className="bg-white border-gray-100 rounded-xl text-gray-900">
                                          <SelectItem value="am">AM</SelectItem>
                                          <SelectItem value="pm">PM</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <Label className="text-[10px] font-bold text-gray-700 ml-1">End Time <span className="text-rose-500">*</span></Label>
                                 <div className="flex gap-1.5">
                                    <Input 
                                       value={formData.endTime}
                                       onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                       className="h-11 rounded-xl bg-gray-50 border-gray-100 w-full font-medium text-xs" 
                                    />
                                    <Select 
                                       value={formData.endPeriod}
                                       onValueChange={val => setFormData(prev => ({ ...prev, endPeriod: val }))}
                                    >
                                       <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 w-16 focus:ring-0 text-[10px] px-2 text-gray-900">
                                          <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent className="bg-white border-gray-100 rounded-xl text-gray-900">
                                          <SelectItem value="am">AM</SelectItem>
                                          <SelectItem value="pm">PM</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-1.5 text-gray-900">
                           <Label className="text-[10px] font-bold text-gray-700 ml-1">Notes</Label>
                           <Textarea 
                              placeholder="Add any additional details..." 
                              value={formData.notes}
                              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              className="min-h-[80px] rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all p-4 resize-none font-medium text-sm leading-relaxed" 
                           />
                        </div>
                     </div>
                  </form>
               </div>
            </div>

            <div className="p-6 border-t border-gray-50 bg-white shrink-0 flex gap-3 z-[100]">
               <DialogClose 
                  render={
                     <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-100 text-gray-500 font-bold hover:bg-gray-50 text-xs">
                        Cancel
                     </Button>
                  } 
               />
               <Button 
                  form="create-appt-form"
                  type="submit" 
                  disabled={isActionLoading} 
                  className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 shadow-xl active:scale-95 transition-all font-bold text-xs"
               >
                  {isActionLoading ? "Processing..." : "Create Appointment"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* RESCHEDULE DIALOG */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl font-sans text-gray-900">
          <div className="p-8 border-b border-gray-50">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight">Reschedule Appointment</DialogTitle>
              <DialogDescription className="text-xs text-gray-400 font-medium">Pick a new date and time.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleReschedule} className="p-8 space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-700 ml-1">Date</Label>
              <Input type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))} className="h-11 rounded-xl bg-gray-50 border-gray-100 font-medium text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-700 ml-1">Start Time</Label>
                <div className="flex gap-1.5">
                  <Input value={rescheduleForm.startTime} onChange={e => setRescheduleForm(p => ({ ...p, startTime: e.target.value }))} className="h-11 rounded-xl bg-gray-50 border-gray-100 font-medium text-xs" />
                  <Select value={rescheduleForm.startPeriod} onValueChange={val => setRescheduleForm(p => ({ ...p, startPeriod: val }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 w-16 text-[10px] px-2"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-xl"><SelectItem value="am">AM</SelectItem><SelectItem value="pm">PM</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-700 ml-1">End Time</Label>
                <div className="flex gap-1.5">
                  <Input value={rescheduleForm.endTime} onChange={e => setRescheduleForm(p => ({ ...p, endTime: e.target.value }))} className="h-11 rounded-xl bg-gray-50 border-gray-100 font-medium text-xs" />
                  <Select value={rescheduleForm.endPeriod} onValueChange={val => setRescheduleForm(p => ({ ...p, endPeriod: val }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 w-16 text-[10px] px-2"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-xl"><SelectItem value="am">AM</SelectItem><SelectItem value="pm">PM</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-12 rounded-xl border-gray-100 text-gray-500 font-bold text-xs">Cancel</Button>
              <Button type="submit" disabled={isActionLoading} className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 shadow-xl font-bold text-xs">
                {isActionLoading ? "Rescheduling..." : "Confirm Reschedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Sheet */}
      <Sheet open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-hidden font-sans border-none shadow-2xl">
          <div className="h-full flex flex-col bg-white">
             <div className="p-10 bg-gray-50 border-b border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-gray-900">
                   <CalendarIcon className="h-32 w-32 text-black" />
                </div>
                <div className="relative z-10 space-y-6 text-gray-900">
                   <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-white border-none text-[10px] px-2 h-5 font-bold">
                         {selectedAppt?.status || 'confirmed'}
                      </Badge>
                      <button onClick={() => setSelectedAppt(null)} className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                         <MoreHorizontal className="h-4 w-4" />
                      </button>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#c65f39]">Confirmed Slot</p>
                      <h2 className="text-3xl font-semibold text-gray-900 tracking-tight leading-none pt-2">
                         {selectedAppt && format(new Date(selectedAppt.start_at), 'h:mm aa')}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium pt-1">
                         {selectedAppt && format(new Date(selectedAppt.start_at), 'EEEE, MMMM do')}
                      </p>
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-10 text-gray-900">
                <section className="space-y-4">
                   <h4 className="text-[10px] font-bold text-gray-400 ml-1">Customer Profile</h4>
                   <div className="p-6 rounded-2xl border border-gray-100 bg-white space-y-6 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-semibold uppercase">
                            {selectedAppt?.customer_name?.charAt(0) || 'C'}
                         </div>
                         <div>
                            <p className="text-sm font-semibold">{selectedAppt?.customer_name}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Verified Identity</p>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-semibold">{selectedAppt?.customer_phone || 'WhatsApp Verified'}</span>
                         </div>
                         <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-[#c65f39]">Sync</Button>
                      </div>
                   </div>
                </section>

                <section className="space-y-4 text-gray-900">
                   <h4 className="text-[10px] font-bold text-gray-400 ml-1">Service Details</h4>
                   <div className="grid grid-cols-2 gap-3 text-gray-900">
                      <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900">
                         <p className="text-[9px] font-bold text-gray-400 mb-1">Service Type</p>
                         <p className="text-xs font-semibold capitalize">{selectedAppt?.service || 'General'}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-900">
                         <p className="text-[9px] font-bold text-gray-400 mb-1">Duration</p>
                         <p className="text-xs font-semibold">30 Minutes</p>
                      </div>
                   </div>
                </section>
             </div>

             <div className="p-8 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                   <Button 
                      variant="outline" 
                      onClick={() => openReschedule(selectedAppt)}
                      disabled={selectedAppt?.status === 'cancelled'}
                      className="flex-1 h-12 rounded-xl text-[10px] font-bold border-gray-200 text-gray-900"
                    >
                       Reschedule
                    </Button>
                   <Button 
                      onClick={() => handleCancel(selectedAppt.id)}
                      disabled={isCancelling || selectedAppt?.status === 'cancelled'}
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl text-[10px] font-bold border-rose-100 text-rose-600 hover:bg-rose-50"
                   >
                      {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Slot"}
                   </Button>
                </div>
             </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
