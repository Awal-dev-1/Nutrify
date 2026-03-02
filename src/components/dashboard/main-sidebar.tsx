
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
import { useUser } from '@/firebase'

const mainLinks = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutGrid },
  { href: '/dashboard/tracker', label: 'Daily Tracker', icon: HeartPulse },
  { href: '/dashboard/search', label: 'AI Food Search', icon: Search },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
]

const insightLinks = [
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/planner', label: 'Meal Planner', icon: Calendar },
]

const aiLinks = [
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot },
]

export function MainSidebar() {
  const pathname = usePathname()
  const { user } = useUser();

  const renderLinks = (links: {href: string, label: string, icon: any}[]) => (
    <SidebarMenu className="gap-1">
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === link.href}
            tooltip={link.label}
            className="py-2"
          >
            <Link href={link.href}>
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  return (
    <>
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider">
              Main
            </p>
            {renderLinks(mainLinks)}
          </div>

          {/* Insights */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider">
              Insights
            </p>
            {renderLinks(insightLinks)}
          </div>

          {/* AI Features */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider">
              AI Features
            </p>
            {renderLinks(aiLinks)}
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {/* Settings */}
        <div className="mb-3">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/settings'}
                tooltip="Settings"
                className="py-2"
              >
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* User Profile */}
        <div className="rounded-lg bg-muted/30 p-2 transition-colors group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold truncate leading-tight">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}
