"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart2,
  Bot,
  Calendar,
  HeartPulse,
  LayoutGrid,
  ScanLine,
  Search,
  Settings,
  Target,
  User,
  Sparkles,
  Brain,
  ChefHat,
  PieChart,
  Activity,
  Flame,
  Menu,
} from 'lucide-react'

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  useSidebar,
  SidebarToggle,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/firebase'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mainLinks = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutGrid },
]

const aiLinks = [
  { href: '/dashboard/search',          label: 'AI Food Search',  icon: Search   },
  { href: '/dashboard/recognize',       label: 'AI Recognition',  icon: ScanLine },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot      },
  { href: '/dashboard/planner',         label: 'Meal Planner',    icon: Calendar },
]

const insightLinks = [
  { href: '/dashboard/tracker',   label: 'Daily Tracker', icon: HeartPulse },
  { href: '/dashboard/analytics', label: 'Analytics',     icon: BarChart2  },
  { href: '/dashboard/goals',     label: 'Goals',         icon: Target     },
]

export function MainSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { isMobile, setOpenMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleCloseMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  const renderLinks = (
    links: { href: string; label: string; icon: any }[],
    groupLabel?: string,
  ) => (
    <div className="space-y-0.5">
      {groupLabel && !isCollapsed && (
        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
          {groupLabel}
        </p>
      )}
      <SidebarMenu className="gap-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={link.label}
                className={cn(
                  'py-2.5 transition-all',
                  isActive  && 'bg-primary/10 text-primary font-medium shadow-sm',
                  !isActive && 'hover:bg-muted/50 hover:text-foreground',
                )}
                onClick={handleCloseMobileSidebar}
              >
                <Link href={link.href}>
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                  <span className={cn("whitespace-nowrap transition-opacity duration-200", isCollapsed && "opacity-0")}>
                    {link.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </div>
  )

  return (
    <>
      {/* ── HEADER ── */}
      <SidebarHeader className="flex h-16 flex-row items-center justify-between border-b px-4">
        {/* This div handles the space for the logo, and alignment */}
        <div className="flex-1">
          {/* Use relative positioning to stack logos */}
          <div className="relative h-8">
            {/* Expanded Logo */}
            <div
              className={cn(
                "absolute inset-0 flex items-center transition-opacity duration-200",
                isCollapsed ? 'opacity-0' : 'opacity-100'
              )}
            >
              <Logo collapsed={false} />
            </div>
            {/* Collapsed Logo ("N") */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                isCollapsed ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Logo collapsed={true} />
            </div>
          </div>
        </div>
        <SidebarToggle className="hidden md:inline-flex shrink-0" />
      </SidebarHeader>

      {/* ── CONTENT ── */}
      <SidebarContent className={cn('py-4', isCollapsed ? 'px-1' : 'px-2')}>
        <div className="space-y-6">

          {renderLinks(mainLinks, 'Main')}

          {/* AI Features */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="relative mb-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider flex-1">
                      AI Features
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            {renderLinks(aiLinks)}
          </div>

          {/* Insights */}
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="relative mb-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-r from-blue-500/5 to-transparent rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-500/10">
                      <PieChart className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider flex-1">
                      Insights
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="p-1.5 rounded-md bg-blue-500/10">
                  <PieChart className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            )}
            {renderLinks(insightLinks)}
          </div>

        </div>
      </SidebarContent>

      {/* ── FOOTER ── */}
      <SidebarFooter className={cn('border-t', isCollapsed ? 'p-2' : 'p-3')}>

        <SidebarMenu className="mb-2 gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/settings'}
              tooltip="Settings"
              className={cn(
                'py-2.5 transition-all',
                pathname === '/dashboard/settings'
                  ? 'bg-primary/10 text-primary font-medium shadow-sm'
                  : 'hover:bg-muted/50 hover:text-foreground',
              )}
              onClick={handleCloseMobileSidebar}
            >
              <Link href="/dashboard/settings">
                <Settings
                  className={cn(
                    'h-4 w-4 shrink-0',
                    pathname === '/dashboard/settings' && 'text-primary',
                  )}
                />
                <span className={cn("whitespace-nowrap transition-opacity duration-200", isCollapsed && "opacity-0")}>
                  Settings
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div
          className={cn(
            'rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-2 transition-all hover:shadow-md',
            isCollapsed && 'p-1.5 flex justify-center',
          )}
        >
          <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
            <Avatar
              className={cn(
                'border-2 border-background shadow-sm',
                isCollapsed ? 'h-8 w-8' : 'h-9 w-9',
              )}
            >
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn('flex-1 overflow-hidden whitespace-nowrap transition-opacity duration-200', isCollapsed && 'opacity-0')}>
                <p className="text-sm font-semibold truncate leading-tight">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </p>
            </div>
          </div>
        </div>

      </SidebarFooter>
    </>
  )
}
