"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getMatch } from "@/lib/match-storage"

export default function JoinMatchPage() {
  const router = useRouter()
  const [matchId, setMatchId] = useState("")
  const [error, setError] = useState("")

  const handleJoin = () => {
    if (!matchId.trim()) {
      setError("Введите код матча")
      return
    }

    try {
      // Проверяем существование матча
      const match = getMatch(matchId.trim())

      if (match) {
        router.push(`/match/${matchId.trim()}`)
      } else {
        setError("Матч не найден")
      }
    } catch (err) {
      setError("Ошибка при поиске матча")
      console.error(err)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Присоединиться к матчу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Введите код матча"
              value={matchId}
              onChange={(e) => {
                setMatchId(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleJoin}>
            Присоединиться
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
