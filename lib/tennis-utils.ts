// Вспомогательные функции для тенниса и паделя

// Преобразование числового значения очка в текстовое представление
export const getTennisPointName = (point) => {
  if (point === 0) return "0"
  if (point === 15) return "15"
  if (point === 30) return "30"
  if (point === 40) return "40"
  if (point === "Ad") return "Ad"

  // Для тай-брейка или других случаев возвращаем как есть
  return point.toString()
}

// Определение, нужно ли менять стороны
export const shouldChangeSides = (gameNumber) => {
  // В теннисе стороны меняются после нечетного количества геймов (1, 3, 5...)
  return gameNumber % 2 === 1
}

// Определение, кто подает в тай-брейке
export const getTiebreakServer = (startingServer, pointNumber) => {
  // Первый подает стартовый игрок
  // Затем каждые 2 очка меняется подающий
  if (pointNumber === 0) return startingServer

  // После первого очка подает другой игрок
  if (pointNumber === 1) return !startingServer

  // Далее каждые 2 очка
  return (Math.floor((pointNumber + 1) / 2) % 2 === 0) === startingServer
}

// Получение названия стороны корта
export const getCourtSideName = (side, short = false) => {
  if (side === "left") return short ? "Л" : "Левая"
  if (side === "right") return short ? "П" : "Правая"
  return ""
}
