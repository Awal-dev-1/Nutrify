
"use client"

import { TransitionLink } from '@/components/shared/transition-link'
import {
  LogOut,
  Settings,
} from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { format } from 'date-fns'
import { useUser } from '@/firebase'
import { logout } from '@/services/authService'
import { useAuth } from '@/hooks'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ThemeToggle } from './theme-toggle'


export function DashboardHeader() {
  const { user, userProfile } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();
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
    setTheme('system');
    await logout(auth);
    window.location.assign('/');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-col">
        <h1 className="text-body font-semibold">
          {greeting}, {userProfile?.name || 'User'}!
        </h1>
        <p className="text-small text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || userProfile?.profile?.profileImageUrl || ''} alt={userProfile?.name || 'User'} />
                <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-small font-medium leading-none">{userProfile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <TransitionLink href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </TransitionLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
