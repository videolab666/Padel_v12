// Функции для работы с хранилищем игроков

// Получение всех игроков
export const getPlayers = () => {
  if (typeof window === "undefined") return []

  try {
    const players = localStorage.getItem("tennis_padel_players")
    return players ? JSON.parse(players) : []
  } catch (error) {
    console.error("Ошибка при получении игроков:", error)
    return []
  }
}

// Добавление нового игрока
export const addPlayer = (player) => {
  if (typeof window === "undefined") return false

  try {
    const players = getPlayers()

    // Проверяем, что игрок с таким именем еще не существует
    if (!players.some((p) => p.name.toLowerCase() === player.name.toLowerCase())) {
      players.push(player)
      localStorage.setItem("tennis_padel_players", JSON.stringify(players))
      return true
    }

    return false
  } catch (error) {
    console.error("Ошибка при добавлении игрока:", error)
    return false
  }
}

// Удаление игрока
export const deletePlayer = (id: string) => {
  if (typeof window === "undefined") return false

  try {
    const players = getPlayers()
    const filteredPlayers = players.filter((player) => player.id !== id)

    localStorage.setItem("tennis_padel_players", JSON.stringify(filteredPlayers))
    return true
  } catch (error) {
    console.error("Ошибка при удалении игрока:", error)
    return false
  }
}
