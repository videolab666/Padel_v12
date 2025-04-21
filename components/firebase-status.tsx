"use client"

import { useState, useEffect } from "react"
import { isFirebaseReady } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CloudOff, Cloud } from "lucide-react"

export function FirebaseStatus() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Проверяем статус Firebase при монтировании компонента
    setIsConnected(isFirebaseReady())

    // Периодически проверяем статус
    const interval = setInterval(() => {
      setIsConnected(isFirebaseReady())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Badge
              variant="outline"
              className={`${
                isConnected ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              } flex items-center gap-1`}
            >
              {isConnected ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
              {isConnected ? "Онлайн" : "Офлайн"}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected
            ? "Синхронизация включена. Матчи доступны на всех устройствах."
            : "Синхронизация отключена. Матчи сохраняются только локально."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
