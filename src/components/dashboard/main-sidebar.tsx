
"use client"

import { usePathname } from 'next/navigation'
import { TransitionLink } from '@/components/shared/transition-link'
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
  const { user, userProfile } = useUser()
  const { isMobile, setOpenMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleCloseMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  const renderLinks = (
    links: { href: string; label: string; icon: any }[],
    groupLabel?: string
  ) => (
    <div className="space-y-0.5">
      {groupLabel && !isCollapsed && (
        <p className={cn(
          'text-small font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wider',
          'transition-all duration-300',
          isCollapsed ? 'opacity-0 -translate-x-2' : 'opacity-100 translate-x-0',
        )}>
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
                  'py-2.5 transition-all duration-200',
                  // When collapsed: centre the icon
                  isCollapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                    : 'hover:bg-muted/50 hover:text-foreground',
                )}
                onClick={handleCloseMobileSidebar}
              >
                <TransitionLink
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 w-full',
                    isCollapsed && 'justify-center',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-all duration-200', isActive && 'text-primary')} />

                  {/* Label: slides + fades out when collapsing */}
                  <span className={cn(
                    'overflow-hidden whitespace-nowrap transition-all duration-300',
                    isCollapsed
                      ? 'w-0 opacity-0 pointer-events-none'
                      : 'w-auto opacity-100',
                  )}>
                    {link.label}
                  </span>
                </TransitionLink>
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
      <SidebarHeader className="flex h-16 flex-row items-center justify-between border-b px-4 overflow-hidden">

        {/* Expanded: full logo + toggle */}
        <div className={cn(
          'flex items-center gap-2 transition-all duration-300',
          isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto',
        )}>
          <Logo collapsed={false} />
        </div>

        {/* Collapsed: "N" fades to toggle on hover */}
        <div className={cn(
          'group relative flex items-center justify-center transition-all duration-300',
          isCollapsed ? 'opacity-100 mx-auto h-8 w-8' : 'opacity-0 w-0 pointer-events-none',
        )}>
          {/* N monogram */}
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-100 group-hover:opacity-0">
            <Logo collapsed={true} />
          </span>
          {/* Toggle reveals on hover */}
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
            <SidebarToggle className="hidden md:inline-flex" />
          </span>
        </div>

        {/* Expanded toggle — always right-aligned when open */}
        <div className={cn(
          'transition-all duration-300 shrink-0',
          isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100',
        )}>
          <SidebarToggle className="hidden md:inline-flex" />
        </div>

      </SidebarHeader>

      {/* ── CONTENT ── */}
      <SidebarContent className={cn(
        'py-4 transition-all duration-300',
        isCollapsed ? 'px-1' : 'px-2',
      )}>
        <div className="space-y-6">

          {renderLinks(mainLinks, 'Main')}

          {/* AI Features */}
          <div className="space-y-1">
            {/* Section header */}
            <div className={cn('transition-all duration-300 overflow-hidden', isCollapsed ? 'h-10' : 'h-auto')}>
              {!isCollapsed ? (
                <div className="relative mb-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg blur-sm" />
                  <div className="relative bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-small font-semibold text-primary uppercase tracking-wider flex-1 transition-all duration-300">
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
            </div>
            {renderLinks(aiLinks)}
          </div>

          {/* Insights */}
          <div className="space-y-1">
            <div className={cn('transition-all duration-300 overflow-hidden', isCollapsed ? 'h-10' : 'h-auto')}>
              {!isCollapsed ? (
                <div className="relative mb-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg blur-sm" />
                  <div className="relative bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10">
                        <PieChart className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-small font-semibold text-primary uppercase tracking-wider flex-1 transition-all duration-300">
                        Insights
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
            {renderLinks(insightLinks)}
          </div>

        </div>
      </SidebarContent>

      {/* ── FOOTER ── */}
      <SidebarFooter className={cn(
        'border-t transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-3',
      )}>

        <SidebarMenu className="mb-2 gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/settings'}
              tooltip="Settings"
              className={cn(
                'py-2.5 transition-all duration-200',
                isCollapsed && 'justify-center px-0',
                pathname === '/dashboard/settings'
                  ? 'bg-primary/10 text-primary font-medium shadow-sm'
                  : 'hover:bg-muted/50 hover:text-foreground',
              )}
              onClick={handleCloseMobileSidebar}
            >
              <TransitionLink
                href="/dashboard/settings"
                className={cn('flex items-center gap-2 w-full', isCollapsed && 'justify-center')}
              >
                <Settings className={cn(
                  'h-4 w-4 shrink-0 transition-all duration-200',
                  pathname === '/dashboard/settings' && 'text-primary',
                )} />
                <span className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-300',
                  isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100',
                )}>
                  Settings
                </span>
              </TransitionLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User profile */}
        <div className={cn(
          'rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 transition-all duration-300 hover:shadow-md',
          isCollapsed ? 'p-1.5 flex justify-center' : 'p-2',
        )}>
          <div className={cn(
            'flex items-center transition-all duration-300',
            isCollapsed ? 'justify-center' : 'gap-3',
          )}>
            <Avatar className={cn(
              'border-2 border-background shadow-sm transition-all duration-300',
              isCollapsed ? 'h-8 w-8' : 'h-9 w-9',
            )}>
              <AvatarImage src={user?.photoURL || userProfile?.profile?.profileImageUrl || ''} alt={userProfile?.name || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 flex-1',
            )}>
              <p className="text-small font-semibold truncate leading-tight">
                {userProfile?.name || 'User'}
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
