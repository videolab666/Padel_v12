"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Match = {
  id: string
  date: string
  team1: {
    player1: string
    player2: string
    score: number
  }
  team2: {
    player1: string
    player2: string
    score: number
  }
  completed: boolean
}

export function MatchHistoryList() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    // Load matches from localStorage
    const savedMatches = localStorage.getItem("padelMatches")
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches))
    }
  }, [])

  if (matches.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No matches yet. Start by creating a new match!</div>
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Link href={`/match/${match.id}`} key={match.id}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(match.date), { addSuffix: true })}
                </span>
                {match.completed ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    In Progress
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="text-left">
                  <p className="font-medium truncate">{match.team1.player1}</p>
                  <p className="font-medium truncate">{match.team1.player2}</p>
                </div>
                <div className="text-center font-bold text-xl">
                  {match.team1.score} - {match.team2.score}
                </div>
                <div className="text-right">
                  <p className="font-medium truncate">{match.team2.player1}</p>
                  <p className="font-medium truncate">{match.team2.player2}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
