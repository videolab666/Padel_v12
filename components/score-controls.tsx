"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MinusIcon, PlusIcon, ArrowLeftRightIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { shouldChangeSides } from "@/lib/tennis-utils"

export function ScoreControls({ match, updateMatch }) {
  if (!match) return null

  // Изменяем функцию changeSides, чтобы она автоматически меняла стороны
  const changeSides = (updatedMatch = null) => {
    const matchToUpdate = updatedMatch || { ...match, history: [] }

    // Меняем стороны
    matchToUpdate.courtSides = {
      teamA: matchToUpdate.courtSides.teamA === "left" ? "right" : "left",
      teamB: matchToUpdate.courtSides.teamB === "left" ? "right" : "left",
    }

    // Сбрасываем флаг необходимости смены сторон
    matchToUpdate.shouldChangeSides = false

    if (!updatedMatch) {
      updateMatch(matchToUpdate)
    }

    return matchToUpdate
  }

  // Изменяем функцию addPoint, чтобы автоматически менять стороны
  const addPoint = (team) => {
    // Создаем новый объект матча
    const updatedMatch = { ...match }

    // Полностью отключаем историю для экономии места
    updatedMatch.history = []

    const otherTeam = team === "teamA" ? "teamB" : "teamA"
    const currentSet = updatedMatch.score.currentSet

    // Если есть флаг необходимости смены сторон, меняем стороны автоматически
    if (updatedMatch.shouldChangeSides) {
      changeSides(updatedMatch)
    }

    if (currentSet.isTiebreak) {
      // Логика для тай-брейка
      currentSet.currentGame[team]++

      // Проверка на победу в тай-брейке (обычно до 7 очков с разницей в 2)
      if (currentSet.currentGame[team] >= 7 && currentSet.currentGame[team] - currentSet.currentGame[otherTeam] >= 2) {
        // Победа в тай-брейке = победа в сете
        // Увеличиваем счет в сете для победителя тай-брейка
        currentSet[team]++
        return winSet(team, updatedMatch)
      }

      // Смена подающего в тай-брейке (каждые 2 очка, кроме первого)
      const totalPoints = currentSet.currentGame.teamA + currentSet.currentGame.teamB
      if (totalPoints % 2 === 1) {
        switchServer(updatedMatch)
      }

      // Проверка необходимости смены сторон в тай-брейке (каждые 6 очков)
      if (totalPoints > 0 && totalPoints % 6 === 0) {
        updatedMatch.shouldChangeSides = true
      }
    } else {
      // Обычный гейм
      const currentGame = currentSet.currentGame

      // Логика тенниса: 0, 15, 30, 40, гейм
      if (currentGame[team] === 0) currentGame[team] = 15
      else if (currentGame[team] === 15) currentGame[team] = 30
      else if (currentGame[team] === 30) currentGame[team] = 40
      else if (currentGame[team] === 40) {
        if (currentGame[otherTeam] < 40) {
          // Победа в гейме
          return winGame(team, updatedMatch)
        } else if (currentGame[otherTeam] === 40) {
          // Преимущество
          currentGame[team] = "Ad"
        } else if (currentGame[otherTeam] === "Ad") {
          // Ровно
          currentGame[team] = 40
          currentGame[otherTeam] = 40
        }
      } else if (currentGame[team] === "Ad") {
        // Победа в гейме после преимущества
        return winGame(team, updatedMatch)
      }
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при обновлении счета:", error)

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

  // Изменяем функцию removePoint, чтобы автоматически менять стороны
  const removePoint = (team) => {
    // Создаем новый объект матча
    const updatedMatch = { ...match }

    // Полностью отключаем историю для экономии места
    updatedMatch.history = []

    // Если есть флаг необходимости смены сторон, меняем стороны автоматически
    if (updatedMatch.shouldChangeSides) {
      changeSides(updatedMatch)
    }

    const otherTeam = team === "teamA" ? "teamB" : "teamA"
    const currentSet = updatedMatch.score.currentSet

    if (currentSet.isTiebreak) {
      // Логика для тай-брейка
      if (currentSet.currentGame[team] > 0) {
        currentSet.currentGame[team]--
      }
    } else {
      // Обычный гейм
      const currentGame = currentSet.currentGame

      // Логика тенниса: 0, 15, 30, 40, гейм (в обратном порядке)
      if (currentGame[team] === "Ad") currentGame[team] = 40
      else if (currentGame[team] === 40) currentGame[team] = 30
      else if (currentGame[team] === 30) currentGame[team] = 15
      else if (currentGame[team] === 15) currentGame[team] = 0
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при обновлении счета:", error)
      // Если произошла ошибка, пробуем упростить объект матча
      updateMatch({
        ...updatedMatch,
        history: [],
      })
    }
  }

  const winGame = (team, updatedMatch) => {
    const otherTeam = team === "teamA" ? "teamB" : "teamA"
    const currentSet = updatedMatch.score.currentSet

    // Увеличиваем счет в сете
    currentSet[team]++

    // Сохраняем минимальную информацию о гейме
    currentSet.games.push({
      winner: team,
    })

    // Сбрасываем текущий гейм
    currentSet.currentGame = {
      teamA: 0,
      teamB: 0,
    }

    // Смена подающего
    switchServer(updatedMatch)

    // Проверка на необходимость смены сторон (после нечетного количества геймов)
    const totalGames = currentSet.teamA + currentSet.teamB
    if (shouldChangeSides(totalGames)) {
      updatedMatch.shouldChangeSides = true
    }

    // Проверка на тай-брейк
    const tiebreakAt = Number.parseInt(match.settings.tiebreakAt.split("-")[0])
    if (match.settings.tiebreakEnabled && currentSet.teamA === tiebreakAt && currentSet.teamB === tiebreakAt) {
      // Начинаем тай-брейк
      currentSet.isTiebreak = true
    }

    // Проверка на победу в сете
    if (currentSet.teamA >= 6 && currentSet.teamA - currentSet.teamB >= 2) {
      return winSet("teamA", updatedMatch)
    } else if (currentSet.teamB >= 6 && currentSet.teamB - currentSet.teamA >= 2) {
      return winSet("teamB", updatedMatch)
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при обновлении после выигрыша гейма:", error)

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

    // Смена сторон после нечетного количества сетов
    if (updatedMatch.score.sets.length % 2 === 1) {
      // Меняем стороны автоматически при смене сета
      changeSides(updatedMatch)
    }

    try {
      updateMatch(updatedMatch)
    } catch (error) {
      console.error("Ошибка при обновлении после выигрыша сета:", error)

      // Если произошла ошибка, пробуем упростить объект матча
      const minimalMatch = {
        ...updatedMatch,
        history: [],
      }

      // Удаляем историю геймов для экономии места
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

  const switchServer = (updatedMatch) => {
    const currentTeam = updatedMatch.currentServer.team
    const otherTeam = currentTeam === "teamA" ? "teamB" : "teamA"

    // Для одиночной игры просто меняем команду
    if (match.format === "singles") {
      updatedMatch.currentServer.team = otherTeam
      updatedMatch.currentServer.playerIndex = 0
    } else {
      // Для парной игры - после каждого гейма подача переходит к следующему игроку по порядку
      // Порядок: A1 -> B1 -> A2 -> B2 -> A1 и т.д.
      if (currentTeam === "teamA") {
        // Если подавала команда A, переходим к команде B
        updatedMatch.currentServer.team = "teamB"
        // Сохраняем тот же индекс игрока
        // (если подавал A1, то теперь B1; если подавал A2, то теперь B2)
      } else {
        // Если подавала команда B, переходим к команде A и меняем игрока
        updatedMatch.currentServer.team = "teamA"
        // Меняем индекс игрока на следующего в команде A
        updatedMatch.currentServer.playerIndex = updatedMatch.currentServer.playerIndex === 0 ? 1 : 0
      }
    }

    return updatedMatch
  }

  const manualSwitchServer = () => {
    const updatedMatch = { ...match }

    // Отключаем историю
    updatedMatch.history = []

    // Меняем подающего
    switchServer(updatedMatch)

    updateMatch(updatedMatch)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление счетом</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">
                Команда A
                <span className="ml-2 text-sm text-muted-foreground">
                  ({match.courtSides?.teamA === "left" ? "Левая" : "Правая"})
                </span>
              </h3>
              <div className="text-sm text-muted-foreground mb-4">
                {match.teamA.players.map((player) => player.name).join(" / ")}
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none w-8 h-8 p-0"
                  onClick={() => removePoint("teamA")}
                  disabled={match.isCompleted}
                >
                  <MinusIcon className="h-3 w-3" />
                </Button>
                <Button
                  className="flex-1 h-12 text-lg font-bold"
                  onClick={() => addPoint("teamA")}
                  disabled={match.isCompleted}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Очко
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">
                Команда B
                <span className="ml-2 text-sm text-muted-foreground">
                  ({match.courtSides?.teamB === "left" ? "Левая" : "Правая"})
                </span>
              </h3>
              <div className="text-sm text-muted-foreground mb-4">
                {match.teamB.players.map((player) => player.name).join(" / ")}
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none w-8 h-8 p-0"
                  onClick={() => removePoint("teamB")}
                  disabled={match.isCompleted}
                >
                  <MinusIcon className="h-3 w-3" />
                </Button>
                <Button
                  className="flex-1 h-12 text-lg font-bold"
                  onClick={() => addPoint("teamB")}
                  disabled={match.isCompleted}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Очко
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {match.shouldChangeSides && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700 font-medium">
              Необходимо поменять стороны! Смена сторон произойдет автоматически при следующем изменении счета.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={manualSwitchServer} disabled={match.isCompleted}>
            Сменить подающего
          </Button>

          <Button variant="outline" className="flex-1" onClick={() => changeSides()} disabled={match.isCompleted}>
            <ArrowLeftRightIcon className="h-4 w-4 mr-1" />
            Сменить стороны
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
