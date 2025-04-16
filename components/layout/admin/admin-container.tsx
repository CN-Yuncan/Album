'use client'

import * as React from 'react'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'

export default function AdminContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar className="h-screen sticky top-0" />
      <div className="flex-1 p-4 md:p-8">
        {children}
      </div>
    </div>
  )
} 