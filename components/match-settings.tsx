"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { MinusIcon, PlusIcon, LockOpenIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

export function MatchSettings({ match, updateMatch }) {
  const [tiebreakEnabled, setTiebreakEnabled] = useState(match?.settings?.tiebreakEnabled)
  const [tiebreakAt, setTiebreakAt] = useState(match?.settings?.tiebreakAt)
  const [finalSetTiebreak, setFinalSetTiebreak] = useState(match?.settings?.finalSetTiebreak)

  // Состояние для редактирования счета сетов
  const [editSetIndex, setEditSetIndex] = useState(null)
  const [editSetScoreA, setEditSetScoreA] = useState(0)
  const [editSetScoreB, setEditSetScoreB] = useState(0)

  const applySettings = () => {
    const updatedMatch = { ...match }

    // Отключаем историю
    updatedMatch.history = []

    // Обновляем настройки
    updatedMatch.settings = {
      ...updatedMatch.settings,
      tiebreakEnabled,
      tiebreakAt,
      finalSetTiebreak,
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при обновлении настроек:", error)

      // Если произошла ошибка, пробуем упростить объект матча
      const minimalMatch = {
        ...updatedMatch,
        history: [],
      }

      // Удаляем историю геймов для экономии места
      if (minimalMatch.score && minimalMatch.score.currentSet) {
        minimalMatch.score.currentSet.games = []
      }

      if (minimalMatch.score && minimalMatch.score.sets) {
        minimalMatch.score.sets = minimalMatch.score.sets.map((set) => ({
          teamA: set.teamA,
          teamB: set.teamB,
          winner: set.winner,
        }))
      }

      updateMatch(minimalMatch)
    }
  }

  const startTiebreak = () => {
    const updatedMatch = { ...match }

    // Отключаем историю
    updatedMatch.history = []

    // Начинаем тай-брейк
    updatedMatch.score.currentSet.isTiebreak = true
    updatedMatch.score.currentSet.currentGame = {
      teamA: 0,
      teamB: 0,
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при запуске тай-брейка:", error)

      // Если произошла ошибка, пробуем упростить объект матча
      const minimalMatch = {
        ...updatedMatch,
        history: [],
      }

      // Удаляем историю геймов для экономии места
      if (minimalMatch.score && minimalMatch.score.currentSet) {
        minimalMatch.score.currentSet.games = []
      }

      if (minimalMatch.score && minimalMatch.score.sets) {
        minimalMatch.score.sets = minimalMatch.score.sets.map((set) => ({
          teamA: set.teamA,
          teamB: set.teamB,
          winner: set.winner,
        }))
      }

      updateMatch(minimalMatch)
    }
  }

  const endTiebreak = (winner) => {
    const updatedMatch = { ...match }

    // Отключаем историю
    updatedMatch.history = []

    // Завершаем тай-брейк и увеличиваем счет победителя
    updatedMatch.score.currentSet[winner]++
    updatedMatch.score.currentSet.isTiebreak = false

    // Завершаем сет
    winSet(winner, updatedMatch)
  }

  const winSet = (team, updatedMatch) => {
    // Увеличиваем счет матча
    updatedMatch.score[team]++

    // Сохраняем текущий сет в историю сетов
    updatedMatch.score.sets.push({
      teamA: updatedMatch.score.currentSet.teamA,
      teamB: updatedMatch.score.currentSet.teamB,
      winner: team,
    })

    // Проверка на победу в матче
    const setsToWin = Math.ceil(match.settings.sets / 2)
    if (updatedMatch.score[team] >= setsToWin) {
      // Запрашиваем подтверждение перед завершением матча
      if (confirm(`Команда ${team === "teamA" ? "A" : "B"} выиграла матч! Завершить матч?`)) {
        updatedMatch.isCompleted = true
        updatedMatch.winner = team
        updateMatch(updatedMatch)
        return
      }
    }

    // Начинаем новый сет
    updatedMatch.score.currentSet = {
      teamA: 0,
      teamB: 0,
      games: [],
      currentGame: {
        teamA: 0,
        teamB: 0,
      },
      isTiebreak: false,
    }

    updateMatch(updatedMatch)
  }

  const endMatch = () => {
    const updatedMatch = { ...match }
    updatedMatch.isCompleted = true
    updatedMatch.history = []
    updateMatch(updatedMatch)
  }

  const unlockMatch = () => {
    const updatedMatch = { ...match }
    updatedMatch.isCompleted = false
    updatedMatch.history = []
    updateMatch(updatedMatch)
  }

  const updateCurrentSetScore = (team, delta) => {
    const updatedMatch = { ...match }
    updatedMatch.history = []

    // Обновляем счет текущего сета
    if (delta > 0 || updatedMatch.score.currentSet[team] > 0) {
      updatedMatch.score.currentSet[team] += delta
      if (updatedMatch.score.currentSet[team] < 0) {
        updatedMatch.score.currentSet[team] = 0
      }
    }

    updateMatch(updatedMatch)
  }

  const startEditSet = (index) => {
    if (index < match.score.sets.length) {
      const set = match.score.sets[index]
      setEditSetScoreA(set.teamA)
      setEditSetScoreB(set.teamB)
      setEditSetIndex(index)
    } else if (index === match.score.sets.length) {
      // Текущий сет
      setEditSetScoreA(match.score.currentSet.teamA)
      setEditSetScoreB(match.score.currentSet.teamB)
      setEditSetIndex(index)
    }
  }

  const saveSetScore = () => {
    if (editSetIndex === null) return

    const updatedMatch = { ...match }
    updatedMatch.history = []

    if (editSetIndex < match.score.sets.length) {
      // Обновляем завершенный сет
      updatedMatch.score.sets[editSetIndex].teamA = editSetScoreA
      updatedMatch.score.sets[editSetIndex].teamB = editSetScoreB

      // Определяем победителя сета
      if (editSetScoreA > editSetScoreB) {
        updatedMatch.score.sets[editSetIndex].winner = "teamA"
      } else if (editSetScoreB > editSetScoreA) {
        updatedMatch.score.sets[editSetIndex].winner = "teamB"
      }

      // Пересчитываем общий счет матча
      updatedMatch.score.teamA = updatedMatch.score.sets.filter((set) => set.winner === "teamA").length
      updatedMatch.score.teamB = updatedMatch.score.sets.filter((set) => set.winner === "teamB").length
    } else if (editSetIndex === match.score.sets.length) {
      // Обновляем текущий сет
      updatedMatch.score.currentSet.teamA = editSetScoreA
      updatedMatch.score.currentSet.teamB = editSetScoreB
    }

    updateMatch(updatedMatch)
    setEditSetIndex(null)
  }

  if (!match) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки матча</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-center">
          Код матча: <span className="font-bold">{match.id}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="tiebreak-enabled">Тай-брейк</Label>
            <Switch
              id="tiebreak-enabled"
              checked={tiebreakEnabled}
              onCheckedChange={setTiebreakEnabled}
              disabled={match.isCompleted}
            />
          </div>

          {tiebreakEnabled && (
            <div>
              <Label>Тай-брейк при счете</Label>
              <Select value={tiebreakAt} onValueChange={setTiebreakAt} disabled={match.isCompleted}>
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
            <Label htmlFor="final-set-tiebreak">Тай-брейк в решающем сете</Label>
            <Switch
              id="final-set-tiebreak"
              checked={finalSetTiebreak}
              onCheckedChange={setFinalSetTiebreak}
              disabled={match.isCompleted}
            />
          </div>

          <Button className="w-full" onClick={applySettings} disabled={match.isCompleted}>
            Применить настройки
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="edit-score">
            <AccordionTrigger>Редактирование счета</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Текущий сет</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1 block">Команда A</Label>
                      <div className="flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-r-none"
                          onClick={() => updateCurrentSetScore("teamA", -1)}
                          disabled={match.isCompleted}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 flex items-center justify-center border-y border-input">
                          {match.score.currentSet.teamA}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-l-none"
                          onClick={() => updateCurrentSetScore("teamA", 1)}
                          disabled={match.isCompleted}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 block">Команда B</Label>
                      <div className="flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-r-none"
                          onClick={() => updateCurrentSetScore("teamB", -1)}
                          disabled={match.isCompleted}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 flex items-center justify-center border-y border-input">
                          {match.score.currentSet.teamB}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-l-none"
                          onClick={() => updateCurrentSetScore("teamB", 1)}
                          disabled={match.isCompleted}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Редактирование сетов</Label>
                  <div className="space-y-2">
                    {match.score.sets.map((set, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>
                          Сет {index + 1}: {set.teamA} - {set.teamB}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditSet(index)}
                          disabled={match.isCompleted}
                        >
                          Изменить
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span>
                        Текущий сет: {match.score.currentSet.teamA} - {match.score.currentSet.teamB}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditSet(match.score.sets.length)}
                        disabled={match.isCompleted}
                      >
                        Изменить
                      </Button>
                    </div>
                  </div>
                </div>

                {editSetIndex !== null && (
                  <div className="space-y-2 p-2 border rounded-md">
                    <Label>Редактирование сета {editSetIndex + 1}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 block">Команда A</Label>
                        <Input
                          type="number"
                          value={editSetScoreA}
                          onChange={(e) => setEditSetScoreA(Number.parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Команда B</Label>
                        <Input
                          type="number"
                          value={editSetScoreB}
                          onChange={(e) => setEditSetScoreB(Number.parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setEditSetIndex(null)}>
                        Отмена
                      </Button>
                      <Button size="sm" onClick={saveSetScore}>
                        Сохранить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="pt-2 border-t">
          <Button
            variant="outline"
            className="w-full mb-2"
            onClick={startTiebreak}
            disabled={match.isCompleted || match.score.currentSet.isTiebreak}
          >
            Начать тай-брейк вручную
          </Button>

          {match.score.currentSet.isTiebreak && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" onClick={() => endTiebreak("teamA")} disabled={match.isCompleted}>
                Тай-брейк выиграла A
              </Button>
              <Button variant="outline" onClick={() => endTiebreak("teamB")} disabled={match.isCompleted}>
                Тай-брейк выиграла B
              </Button>
            </div>
          )}

          {match.isCompleted ? (
            <Button variant="outline" className="w-full mt-2" onClick={unlockMatch}>
              <LockOpenIcon className="mr-2 h-4 w-4" />
              Разблокировать матч
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-2">
                  Завершить матч
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Завершить матч?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите завершить матч? Вы сможете разблокировать его позже, если потребуется.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={endMatch}>Завершить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
