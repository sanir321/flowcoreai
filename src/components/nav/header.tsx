"use client"

import { usePathname } from "next/navigation"
import { ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()
  
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p)
    if (paths.length === 0) return ['Overview']
    return paths.map(p => {
      if (p === 'agent-hub') return 'Agents'
      if (p === 'dashboard') return ''
      return p.charAt(0).toUpperCase() + p.slice(1)
    }).filter(Boolean)
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {breadcrumbs.map((crumb, idx) => (
          <div key={crumb} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className={cn(
              "transition-colors",
              idx === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : ""
            )}>
              {crumb}
            </span>
            {idx < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] h-9 text-xs font-medium px-4 flex items-center gap-2 active:scale-[0.98] transition-transform">
          <Plus className="h-4 w-4" /> Deploy
        </Button>
      </div>
    </header>
  )
}
