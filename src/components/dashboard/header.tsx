"use client"

import { SidebarTrigger } from '@/components/ui/sidebar'
import { healthQuotes } from '@/lib/data'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useUser } from '@/firebase'
import { logout } from '@/services/authService'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'

export function DashboardHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [quote, setQuote] = useState("")

  useEffect(() => {
    setQuote(healthQuotes[Math.floor(Math.random() * healthQuotes.length)])
  }, [])

  const handleLogout = async () => {
    await logout(auth);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">
          Good Morning, {user?.displayName || 'User'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>
      <div className="ml-auto hidden md:block">
        <p className="text-sm italic text-muted-foreground">{quote}</p>
      </div>
       <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-4">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
    </header>
  )
}
