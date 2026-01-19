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
    <nav className="w-64 bg-[#151515] border-r border-[#1f1f1f] flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo/Header */}
      <div className="p-4 border-b border-[#1f1f1f]">
        <h1 className="text-base font-semibold text-[#ededed]">Linear Portal</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Public Workspace</p>
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
                  flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-[#5e6ad2] text-white'
                      : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-[#ededed]'
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
      <div className="p-3 border-t border-[#1f1f1f]">
        <Link
          href="/admin"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors
            ${
              pathname === '/admin' || pathname?.startsWith('/admin')
                ? 'bg-[#5e6ad2] text-white'
                : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-[#ededed]'
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
