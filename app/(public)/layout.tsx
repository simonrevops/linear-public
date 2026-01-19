import Navigation from '@/components/Layout/Navigation'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <div className="flex-1 ml-64 min-h-screen">
        {children}
      </div>
    </div>
  )
}
