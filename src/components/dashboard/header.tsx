"use client"

import { SidebarTrigger } from '@/components/ui/sidebar'
import { format } from 'date-fns'
import { useUser } from '@/firebase'
import { logout } from '@/services/authService'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DashboardHeader() {
  const { userProfile } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        return "Good Morning";
      } else if (hour < 18) {
        return "Good Afternoon";
      } else {
        return "Good Evening";
      }
    };
    setGreeting(getGreeting());
  }, []);

  const handleLogout = async () => {
    await logout(auth);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-col">
        <h1 className="text-base md:text-xl font-semibold">
          {greeting}, {userProfile?.name || 'User'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>
       <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
    </header>
  )
}
