'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Create Issue', href: '/create', icon: '➕' },
  { name: 'Projects', href: '/projects', icon: '📁' },
  { name: 'All Issues', href: '/issues', icon: '📋' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-[#0d0d0d] border-r border-[#2a2a2a] flex flex-col h-screen fixed left-0 top-0 z-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <h1 className="text-[14px] font-medium text-[#ebebeb]">Linear Portal</h1>
        <p className="text-[12px] text-[#5c5c5c] mt-0.5">Public Workspace</p>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-normal
                  transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-[#262626] text-[#ebebeb]'
                      : 'text-[#8a8a8a] hover:bg-[#262626] hover:text-[#ebebeb]'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer - Admin Link */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <Link
          href="/admin"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-normal transition-colors duration-150
            ${
              pathname === '/admin' || pathname?.startsWith('/admin')
                ? 'bg-[#262626] text-[#ebebeb]'
                : 'text-[#8a8a8a] hover:bg-[#262626] hover:text-[#ebebeb]'
            }
          `}
        >
          <span className="text-sm">⚙️</span>
          <span>Admin</span>
        </Link>
      </div>
    </nav>
  )
}
