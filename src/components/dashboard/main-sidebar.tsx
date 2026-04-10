
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
  Brain,
  PieChart,
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
import { Logo } from '@/components/shared/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/firebase'
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
    <div className="space-y-1">
      {groupLabel && !isCollapsed && (
        <p className={cn(
          'text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 px-4 py-2',
          'transition-all duration-300',
          isCollapsed ? 'opacity-0 -translate-x-2' : 'opacity-100 translate-x-0',
        )}>
          {groupLabel}
        </p>
      )}
      <SidebarMenu className="gap-1 px-4">
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
                  'h-auto py-3 transition-all duration-200 active:scale-95',
                  isCollapsed && 'justify-center px-0 h-12 w-12',
                  isActive
                    ? 'bg-primary/10 backdrop-blur-sm text-primary font-semibold shadow-sm border-r-4 border-primary'
                    : 'hover:bg-muted/50 hover:text-foreground',
                )}
                onClick={handleCloseMobileSidebar}
              >
                <TransitionLink
                  href={link.href}
                  className={cn('flex items-center gap-4 w-full', isCollapsed && 'justify-center px-0')}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 transition-all duration-200', isActive && 'text-primary')} />

                  <span className={cn(
                    'overflow-hidden whitespace-nowrap transition-all duration-300 text-sm',
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
      <SidebarHeader className="flex h-auto flex-col items-start justify-between border-b px-6 pt-8 pb-4 gap-4">
        {/* Mobile Grabber */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full md:hidden" />

        {/* Logo and Profile Section */}
        <div className="flex items-center justify-between w-full">
            <div className={cn(
              'flex items-center gap-2 transition-all duration-300',
              isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto',
            )}>
              <Logo collapsed={false} />
            </div>

            {/* Collapsed "N" logo */}
            <div className={cn('transition-all duration-300', isCollapsed ? 'opacity-100 mx-auto' : 'opacity-0 w-0 pointer-events-none')}>
              <Logo collapsed={true} />
            </div>
          
            <SidebarToggle className="hidden md:inline-flex" />
        </div>
        
        {/* User profile */}
         <div className={cn(
          'w-full rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 transition-all duration-300 hover:shadow-md',
          isCollapsed ? 'p-2 flex justify-center' : 'p-3',
        )}>
          <div className={cn(
            'flex items-center transition-all duration-300',
            isCollapsed ? 'justify-center' : 'gap-3',
          )}>
            <Avatar className={cn(
              'border-2 border-background shadow-sm transition-all duration-300 ring-2 ring-primary/50',
              isCollapsed ? 'h-9 w-9' : 'h-10 w-10',
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
              <p className="text-sm font-semibold truncate leading-tight">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className={cn('pt-4 pb-10 transition-all duration-300 no-scrollbar', isCollapsed ? 'px-0' : 'px-0')}>
        <div className="space-y-4">
          {renderLinks(mainLinks)}
          
          <div className="space-y-2">
            {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 px-4 py-2">AI Features</p>}
            {isCollapsed && <div className="flex justify-center py-2"><Brain className="h-5 w-5 text-muted-foreground" /></div>}
            {renderLinks(aiLinks)}
          </div>
          
          <div className="space-y-2">
            {!isCollapsed && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 px-4 py-2">Insights</p>}
            {isCollapsed && <div className="flex justify-center py-2"><PieChart className="h-5 w-5 text-muted-foreground" /></div>}
            {renderLinks(insightLinks)}
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className={cn(
        'border-t transition-all duration-300',
        isCollapsed ? 'p-2' : 'px-4 pt-3 pb-8',
      )}>
        <SidebarMenu className="gap-1 px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/settings'}
              tooltip="Settings"
              className={cn(
                'h-auto py-3 transition-all duration-200 active:scale-95',
                isCollapsed && 'justify-center px-0 h-12 w-12',
                pathname === '/dashboard/settings'
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'hover:bg-muted/50 hover:text-foreground',
              )}
              onClick={handleCloseMobileSidebar}
            >
              <TransitionLink
                href="/dashboard/settings"
                className={cn('flex items-center gap-4 w-full', isCollapsed && 'justify-center px-0')}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-300 text-sm',
                  isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100',
                )}>
                  Settings
                </span>
              </TransitionLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
