"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowLeftRightIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PlayerSelector } from "@/components/player-selector"
import { createMatch } from "@/lib/match-storage"
import { getPlayers, addPlayer } from "@/lib/player-storage"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function NewMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "tennis"

  const [matchType, setMatchType] = useState(defaultType)
  const [matchFormat, setMatchFormat] = useState("singles")
  const [sets, setSets] = useState("3")
  const [tiebreakEnabled, setTiebreakEnabled] = useState(true)
  const [tiebreakAt, setTiebreakAt] = useState("6-6")
  const [finalSetTiebreak, setFinalSetTiebreak] = useState(true)
  const [players, setPlayers] = useState([])
  const [newPlayerName, setNewPlayerName] = useState("")

  // Игроки для команд
  const [teamAPlayer1, setTeamAPlayer1] = useState("")
  const [teamAPlayer2, setTeamAPlayer2] = useState("")
  const [teamBPlayer1, setTeamBPlayer1] = useState("")
  const [teamBPlayer2, setTeamBPlayer2] = useState("")

  // Стороны корта
  const [teamASide, setTeamASide] = useState("left")
  const [servingTeam, setServingTeam] = useState("teamA")

  // Загрузка списка игроков
  useEffect(() => {
    setPlayers(getPlayers())
  }, [])

  // Добавление нового игрока
  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: uuidv4(),
        name: newPlayerName.trim(),
      }
      addPlayer(newPlayer)
      setPlayers([...players, newPlayer])
      setNewPlayerName("")
    }
  }

  const handleCreateMatch = () => {
    // Проверка, что все необходимые игроки выбраны
    if (!teamAPlayer1 || !teamBPlayer1) {
      alert("Выберите игроков для обеих команд")
      return
    }

    if (matchFormat === "doubles" && (!teamAPlayer2 || !teamBPlayer2)) {
      alert("Для парной игры необходимо выбрать всех игроков")
      return
    }

    // Создание объекта матча
    const match = {
      id: uuidv4(),
      type: matchType,
      format: matchFormat,
      createdAt: new Date().toISOString(),
      settings: {
        sets: Number.parseInt(sets),
        tiebreakEnabled,
        tiebreakAt,
        finalSetTiebreak,
      },
      teamA: {
        players: [
          { id: teamAPlayer1, name: players.find((p) => p.id === teamAPlayer1)?.name || teamAPlayer1 },
          ...(teamAPlayer2
            ? [{ id: teamAPlayer2, name: players.find((p) => p.id === teamAPlayer2)?.name || teamAPlayer2 }]
            : []),
        ],
        isServing: servingTeam === "teamA",
      },
      teamB: {
        players: [
          { id: teamBPlayer1, name: players.find((p) => p.id === teamBPlayer1)?.name || teamBPlayer1 },
          ...(teamBPlayer2
            ? [{ id: teamBPlayer2, name: players.find((p) => p.id === teamBPlayer2)?.name || teamBPlayer2 }]
            : []),
        ],
        isServing: servingTeam === "teamB",
      },
      score: {
        teamA: 0,
        teamB: 0,
        sets: [],
        currentSet: {
          teamA: 0,
          teamB: 0,
          games: [],
          currentGame: {
            teamA: 0,
            teamB: 0,
          },
        },
        isTiebreak: false,
      },
      currentServer: {
        team: servingTeam,
        playerIndex: 0,
      },
      courtSides: {
        teamA: teamASide,
        teamB: teamASide === "left" ? "right" : "left",
      },
      shouldChangeSides: false,
      history: [],
      isCompleted: false,
    }

    // Сохранение матча
    const matchId = createMatch(match)

    // Переход на страницу матча
    router.push(`/match/${matchId}`)
  }

  const switchSides = () => {
    setTeamASide(teamASide === "left" ? "right" : "left")
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Новый матч</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue={matchType} onValueChange={setMatchType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tennis">Теннис</TabsTrigger>
              <TabsTrigger value="padel">Падел</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div>
              <Label>Формат игры</Label>
              <Select value={matchFormat} onValueChange={setMatchFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите формат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Одиночная игра</SelectItem>
                  <SelectItem value="doubles">Парная игра</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Количество сетов</Label>
              <Select value={sets} onValueChange={setSets}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите количество сетов" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 сет</SelectItem>
                  <SelectItem value="3">3 сета</SelectItem>
                  <SelectItem value="5">5 сетов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Тай-брейк</Label>
              <Switch checked={tiebreakEnabled} onCheckedChange={setTiebreakEnabled} />
            </div>

            {tiebreakEnabled && (
              <div>
                <Label>Тай-брейк при счете</Label>
                <Select value={tiebreakAt} onValueChange={setTiebreakAt}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите счет для тай-брейка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6-6">6:6</SelectItem>
                    <SelectItem value="5-5">5:5</SelectItem>
                    <SelectItem value="4-4">4:4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Тай-брейк в решающем сете</Label>
              <Switch checked={finalSetTiebreak} onCheckedChange={setFinalSetTiebreak} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Игроки</h3>

            <div className="flex gap-2">
              <Input
                placeholder="Добавить нового игрока"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              />
              <Button onClick={handleAddPlayer}>Добавить</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Команда A</Label>
                <div className="space-y-2 mt-2">
                  <PlayerSelector
                    players={players}
                    value={teamAPlayer1}
                    onChange={setTeamAPlayer1}
                    placeholder="Игрок 1"
                  />

                  {matchFormat === "doubles" && (
                    <PlayerSelector
                      players={players}
                      value={teamAPlayer2}
                      onChange={setTeamAPlayer2}
                      placeholder="Игрок 2"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Команда B</Label>
                <div className="space-y-2 mt-2">
                  <PlayerSelector
                    players={players}
                    value={teamBPlayer1}
                    onChange={setTeamBPlayer1}
                    placeholder="Игрок 1"
                  />

                  {matchFormat === "doubles" && (
                    <PlayerSelector
                      players={players}
                      value={teamBPlayer2}
                      onChange={setTeamBPlayer2}
                      placeholder="Игрок 2"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Начальные позиции</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Сторона команды A</Label>
                    <Button variant="outline" size="sm" onClick={switchSides}>
                      <ArrowLeftRightIcon className="h-4 w-4 mr-1" />
                      Поменять
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className={`p-2 rounded ${teamASide === "left" ? "bg-blue-100 font-medium" : "bg-gray-100"}`}>
                      Левая
                    </div>
                    <div className={`p-2 rounded ${teamASide === "right" ? "bg-blue-100 font-medium" : "bg-gray-100"}`}>
                      Правая
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <Label className="block mb-2">Первая подача</Label>
                  <RadioGroup value={servingTeam} onValueChange={setServingTeam} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teamA" id="teamA" />
                      <Label htmlFor="teamA">Команда A</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teamB" id="teamB" />
                      <Label htmlFor="teamB">Команда B</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCreateMatch}>
            Начать матч
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
