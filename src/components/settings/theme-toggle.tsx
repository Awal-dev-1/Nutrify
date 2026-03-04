"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { Skeleton } from "../ui/skeleton"
import { useUser, useFirestore } from "@/firebase"
import { updateUserDocument } from "@/services/userService"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (user && db) {
      // This is a fire-and-forget operation, no need to show loading states to the user.
      updateUserDocument(db, user.uid, { 'preferences.themePreference': newTheme });
    }
  }

  if (!mounted) {
    return <Skeleton className="w-full sm:w-[280px] h-10" />
  }

  return (
    <Tabs defaultValue={theme} onValueChange={handleThemeChange} className="w-full sm:w-[280px]">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="light" className="gap-2">
                <Sun className="h-4 w-4" /> Light
            </TabsTrigger>
            <TabsTrigger value="dark" className="gap-2">
                <Moon className="h-4 w-4" /> Dark
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
                <Laptop className="h-4 w-4" /> System
            </TabsTrigger>
        </TabsList>
    </Tabs>
  )
}
