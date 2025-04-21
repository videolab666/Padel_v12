import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getTennisPointName } from "@/lib/tennis-utils"

export function ScoreBoard({ match }) {
  if (!match) return null

  const { teamA, teamB } = match
  const currentSet = match.score.currentSet
  const isServing = (team, playerIndex) => {
    return match.currentServer.team === team && match.currentServer.playerIndex === playerIndex
  }

  // Получаем текущий счет в виде строки (0, 15, 30, 40, Ad)
  const getCurrentGameScore = (team) => {
    if (currentSet.isTiebreak) {
      return currentSet.currentGame[team]
    }

    return getTennisPointName(currentSet.currentGame[team])
  }

  // Определяем общее количество сетов в матче
  const totalSets = match.settings.sets
  const currentSetIndex = match.score.sets.length

  // Создаем массив всех сетов (включая будущие)
  const allSets = []

  // Добавляем прошедшие сеты
  for (let i = 0; i < match.score.sets.length; i++) {
    allSets.push(match.score.sets[i])
  }

  // Добавляем текущий сет, если матч не завершен
  if (!match.isCompleted) {
    allSets.push({
      teamA: currentSet.teamA,
      teamB: currentSet.teamB,
      isCurrent: true,
    })
  }

  // Добавляем будущие сеты
  while (allSets.length < totalSets) {
    allSets.push({ teamA: "-", teamB: "-", isFuture: true })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="text-left space-y-1">
          <div className="text-sm text-muted-foreground mb-1">
            {match.courtSides?.teamA === "left" ? "Левая сторона" : "Правая сторона"}
          </div>
          {teamA.players.map((player, idx) => (
            <div key={idx} className="flex items-center">
              {isServing("teamA", idx) && (
                <Badge variant="outline" className="mr-2 bg-yellow-100 text-yellow-800">
                  Подача
                </Badge>
              )}
              <p className="font-medium truncate">{player.name}</p>
            </div>
          ))}
        </div>
        <div className="text-center font-bold text-3xl">
          {match.score.teamA} - {match.score.teamB}
        </div>
        <div className="text-right space-y-1">
          <div className="text-sm text-muted-foreground mb-1">
            {match.courtSides?.teamB === "left" ? "Левая сторона" : "Правая сторона"}
          </div>
          {teamB.players.map((player, idx) => (
            <div key={idx} className="flex items-center justify-end">
              <p className="font-medium truncate">{player.name}</p>
              {isServing("teamB", idx) && (
                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                  Подача
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="text-center">
              <span className="text-2xl font-bold">{getCurrentGameScore("teamA")}</span>
            </div>
            <div className="text-center text-muted-foreground">
              {currentSet.isTiebreak ? "Тай-брейк" : "Текущий гейм"}
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{getCurrentGameScore("teamB")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="text-center">
          <span className="text-xl font-bold">{currentSet.teamA}</span>
        </div>
        <div className="text-center text-muted-foreground">
          Сет {currentSetIndex + 1} из {totalSets}
        </div>
        <div className="text-center">
          <span className="text-xl font-bold">{currentSet.teamB}</span>
        </div>
      </div>

      {allSets.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Сеты</h3>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
            <div></div>
            <div className="text-center font-medium">Команда A</div>
            <div className="text-center font-medium">Команда B</div>

            {allSets.map((set, index) => (
              <div key={index} className="contents">
                <div className="font-medium flex items-center">
                  Сет {index + 1}
                  {set.isCurrent && (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                      Текущий
                    </Badge>
                  )}
                </div>
                <div className={`text-center ${set.isFuture ? "text-muted-foreground" : ""}`}>{set.teamA}</div>
                <div className={`text-center ${set.isFuture ? "text-muted-foreground" : ""}`}>{set.teamB}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
