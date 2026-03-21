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
  { href: '/dashboard/search', label: 'AI Food Search', icon: Search },
  { href: '/dashboard/recognize', label: 'AI Recognition', icon: ScanLine },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Bot },
  { href: '/dashboard/planner', label: 'Meal Planner', icon: Calendar },
]

const insightLinks = [
  { href: '/dashboard/tracker', label: 'Daily Tracker', icon: HeartPulse },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
]

export function MainSidebar() {
  const pathname = usePathname()
  const { user } = useUser();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleCloseMobileSidebar = () => {
    if(isMobile) {
      setOpenMobile(false);
    }
  }

  const renderLinks = (links: {href: string, label: string, icon: any}[], groupLabel?: string) => (
    <div className="space-y-1">
      {groupLabel && !isCollapsed && (
        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
          {groupLabel}
        </p>
      )}
      <SidebarMenu className="gap-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={link.label}
                className={cn(
                  "py-2.5 transition-all",
                  isActive && "bg-primary/10 text-primary font-medium shadow-sm",
                  !isActive && "hover:bg-muted/50 hover:text-foreground"
                )}
                onClick={handleCloseMobileSidebar}
              >
                <Link href={link.href}>
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive && "text-primary"
                  )} />
                  <span>{link.label}</span>
                 
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );

  return (
    <>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Logo collapsed={isCollapsed} />
        <SidebarToggle className="hidden md:block"/>
      </SidebarHeader>

      <SidebarContent className={cn(
        "px-2 py-4",
        isCollapsed && "px-1"
      )}>
        <div className="space-y-6">
          {/* Main - Overview */}
          {renderLinks(mainLinks, "Main")}

          {/* AI Features Group */}
          <div className="space-y-2">
            <div className="relative">
              {!isCollapsed && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg blur-sm"></div>
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
                </>
              )}
              {isCollapsed && (
                <div className="flex justify-center py-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {renderLinks(aiLinks)}
            </div>
          </div>

          {/* Insights Group */}
          <div className="space-y-2">
            <div className="relative">
              {!isCollapsed && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 rounded-lg blur-sm"></div>
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
                </>
              )}
              {isCollapsed && (
                <div className="flex justify-center py-2">
                  <div className="p-1.5 rounded-md bg-blue-500/10">
                    <PieChart className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {renderLinks(insightLinks)}
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t p-3",
        isCollapsed && "p-2"
      )}>
        {/* Settings */}
        <div className="mb-2">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/settings'}
                tooltip="Settings"
                className={cn(
                  "py-2.5 transition-all",
                  pathname === '/dashboard/settings' && "bg-primary/10 text-primary font-medium shadow-sm",
                  pathname !== '/dashboard/settings' && "hover:bg-muted/50 hover:text-foreground"
                )}
                onClick={handleCloseMobileSidebar}
              >
                <Link href="/dashboard/settings">
                  <Settings className={cn(
                    "h-4 w-4",
                    pathname === '/dashboard/settings' && "text-primary"
                  )} />
                  {!isCollapsed && <span>Settings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* User Profile */}
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-2 transition-all hover:shadow-md",
          isCollapsed && "p-1.5 flex justify-center"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <Avatar className={cn(
              "border-2 border-background shadow-sm",
              isCollapsed ? "h-8 w-8" : "h-9 w-9"
            )}>
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate leading-tight">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}
