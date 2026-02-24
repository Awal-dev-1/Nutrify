"use client"

import { SidebarTrigger } from '@/components/ui/sidebar'
import { mockUser, healthQuotes } from '@/lib/data'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function DashboardHeader() {
  const [quote, setQuote] = useState("")

  useEffect(() => {
    setQuote(healthQuotes[Math.floor(Math.random() * healthQuotes.length)])
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">
          Good Morning, {mockUser.name}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>
      <div className="ml-auto hidden md:block">
        <p className="text-sm italic text-muted-foreground">{quote}</p>
      </div>
    </header>
  )
}
