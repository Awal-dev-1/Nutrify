"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Tabs defaultValue={theme} onValueChange={setTheme} className="w-full sm:w-[280px]">
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
