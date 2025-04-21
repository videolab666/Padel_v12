"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMatches, subscribeToMatchesListUpdates } from "@/lib/match-storage"

export function MatchList() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matchList = await getMatches()
        setMatches(matchList)
      } catch (error) {
        console.error("Ошибка при загрузке матчей:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()

    // Подписываемся на обновления списка матчей в реальном времени
    const unsubscribe = subscribeToMatchesListUpdates((updatedMatches) => {
      setMatches(updatedMatches)
    })

    return () => {
      // Отписываемся при размонтировании компонента
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка матчей...</div>
  }

  if (matches.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Нет активных матчей</div>
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Link href={`/match/${match.id}`} key={match.id}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true, locale: ru })}
                </span>
                <div className="flex gap-2">
                  <Badge variant="outline">{match.type === "tennis" ? "Теннис" : "Падел"}</Badge>
                  {match.isCompleted ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Завершен
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      В процессе
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="text-left">
                  {match.teamA.players.map((player, idx) => (
                    <p key={idx} className="font-medium truncate">
                      {player.name}
                    </p>
                  ))}
                </div>
                <div className="text-center font-bold text-xl">
                  {match.score.teamA} - {match.score.teamB}
                </div>
                <div className="text-right">
                  {match.teamB.players.map((player, idx) => (
                    <p key={idx} className="font-medium truncate">
                      {player.name}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
