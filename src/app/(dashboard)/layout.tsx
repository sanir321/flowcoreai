import { DashboardClientWrapper } from "@/components/nav/dashboard-client-wrapper"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardClientWrapper>
      {children}
    </DashboardClientWrapper>
  )
}
