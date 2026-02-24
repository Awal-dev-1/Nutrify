"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart2,
  Bot,
  Calendar,
  HeartPulse,
  LayoutGrid,
  Search,
  Settings,
  Target,
  User,
} from 'lucide-react'

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/shared/logo'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockUser } from '@/lib/data'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/search', label: 'Search Food', icon: Search },
  { href: '/dashboard/tracker', label: 'Daily Tracker', icon: HeartPulse },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/planner', label: 'Meal Planner', icon: Calendar },
  { href: '/dashboard/recognize', label: 'AI Recognition', icon: Bot },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot },
]

export function MainSidebar() {
  const pathname = usePathname()

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/settings'}
              tooltip="Settings"
            >
              <Link href="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="flex items-center gap-3 p-2 rounded-md transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto">
            <Avatar className="h-8 w-8">
              <AvatarImage src={mockUser.profilePictureUrl} alt={mockUser.name} />
              <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden transition-all w-full group-data-[collapsible=icon]:hidden">
              <p className="font-medium text-sm truncate">{mockUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{mockUser.email}</p>
            </div>
        </div>
      </SidebarFooter>
    </>
  )
}
