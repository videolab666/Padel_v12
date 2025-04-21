// Функции для работы с хранилищем матчей
import { compressToUTF16, decompressFromUTF16 } from "lz-string"
import {
  saveMatchToFirebase,
  getMatchFromFirebase,
  getMatchesListFromFirebase,
  deleteMatchFromFirebase,
  subscribeToMatch,
  subscribeToMatchesList,
  isFirebaseReady,
} from "./firebase"

// Максимальное количество хранимых матчей в локальном хранилище
const MAX_MATCHES = 5

// Получение всех матчей
export const getMatches = async () => {
  if (typeof window === "undefined") return []

  try {
    // Сначала пробуем получить матчи из Firebase, если она доступна
    if (isFirebaseReady()) {
      const firebaseMatches = await getMatchesListFromFirebase()
      if (firebaseMatches && firebaseMatches.length > 0) {
        return firebaseMatches
      }
    }

    // Если Firebase недоступен или нет матчей, используем локальное хранилище
    const matches = localStorage.getItem("tennis_padel_matches")
    if (!matches) return []

    // Пробуем распаковать сжатые данные
    try {
      return JSON.parse(decompressFromUTF16(matches))
    } catch (decompressError) {
      // Если не удалось распаковать, возможно данные в старом формате
      return JSON.parse(matches)
    }
  } catch (error) {
    console.error("Ошибка при получении матчей:", error)
    return []
  }
}

// Получение конкретного матча по ID
export const getMatch = async (id) => {
  if (typeof window === "undefined") return null

  try {
    // Сначала пробуем получить матч из Firebase, если она доступна
    if (isFirebaseReady()) {
      const firebaseMatch = await getMatchFromFirebase(id)
      if (firebaseMatch) {
        return firebaseMatch
      }
    }

    // Если Firebase недоступен или матч не найден, используем локальное хранилище
    const singleMatchKey = `match_${id}`
    const singleMatchData = localStorage.getItem(singleMatchKey)

    if (singleMatchData) {
      try {
        return JSON.parse(decompressFromUTF16(singleMatchData))
      } catch (decompressError) {
        // Если не удалось распаковать, возможно данные в старом формате
        return JSON.parse(singleMatchData)
      }
    }

    // Если нет, ищем в общем списке
    const matches = await getMatches()
    return matches.find((match) => match.id === id) || null
  } catch (error) {
    console.error("Ошибка при получении матча:", error)
    return null
  }
}

// Очистка старых матчей при приближении к лимиту
const cleanupStorage = () => {
  try {
    // Получаем все матчи
    const matches = JSON.parse(localStorage.getItem("tennis_padel_matches") || "[]")

    // Если матчей больше максимального количества, удаляем самые старые
    if (matches.length > MAX_MATCHES) {
      // Сортируем по дате создания (от новых к старым)
      matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Оставляем только MAX_MATCHES матчей
      const updatedMatches = matches.slice(0, MAX_MATCHES)

      // Сохраняем обновленный список в сжатом виде
      localStorage.setItem("tennis_padel_matches", compressToUTF16(JSON.stringify(updatedMatches)))

      // Удаляем отдельные записи для старых матчей
      const deletedMatches = matches.slice(MAX_MATCHES)
      deletedMatches.forEach((match) => {
        localStorage.removeItem(`match_${match.id}`)
      })
    }

    return true
  } catch (error) {
    console.error("Ошибка при очистке хранилища:", error)
    return false
  }
}

// Создание нового матча
export const createMatch = async (match) => {
  if (typeof window === "undefined") return null

  try {
    // Очищаем локальное хранилище перед добавлением нового матча
    cleanupStorage()

    // Инициализируем пустую историю
    match.history = []

    // Сохраняем матч в Firebase, если она доступна
    if (isFirebaseReady()) {
      const firebaseSaved = await saveMatchToFirebase(match)
      if (!firebaseSaved) {
        console.warn("Не удалось сохранить матч в Firebase, используем только локальное хранилище")
      }
    } else {
      console.warn("Firebase недоступен, используем только локальное хранилище")
    }

    // Всегда сохраняем в локальное хранилище
    const singleMatchKey = `match_${match.id}`
    localStorage.setItem(singleMatchKey, compressToUTF16(JSON.stringify(match)))

    // Добавляем в общий список без истории и детальных данных
    const matchSummary = {
      id: match.id,
      type: match.type,
      format: match.format,
      createdAt: match.createdAt,
      teamA: {
        players: match.teamA.players,
      },
      teamB: {
        players: match.teamB.players,
      },
      score: {
        teamA: match.score.teamA,
        teamB: match.score.teamB,
      },
      isCompleted: match.isCompleted,
    }

    const matches = JSON.parse(localStorage.getItem("tennis_padel_matches") || "[]")
    matches.unshift(matchSummary)
    localStorage.setItem("tennis_padel_matches", compressToUTF16(JSON.stringify(matches)))

    // Уведомляем другие вкладки об изменении
    window.dispatchEvent(new Event("storage"))

    return match.id
  } catch (error) {
    console.error("Ошибка при создании матча:", error)
    return null
  }
}

// Обновление существующего матча
export const updateMatch = async (updatedMatch) => {
  if (typeof window === "undefined") return false

  try {
    // Полностью отключаем историю для экономии места
    updatedMatch.history = []

    // Сохраняем матч в Firebase, если она доступна
    if (isFirebaseReady()) {
      const firebaseSaved = await saveMatchToFirebase(updatedMatch)
      if (!firebaseSaved) {
        console.warn("Не удалось обновить матч в Firebase, используем только локальное хранилище")
      }
    } else {
      console.warn("Firebase недоступен, используем только локальное хранилище")
    }

    // Всегда сохраняем в локальное хранилище
    const singleMatchKey = `match_${updatedMatch.id}`

    try {
      localStorage.setItem(singleMatchKey, compressToUTF16(JSON.stringify(updatedMatch)))
    } catch (storageError) {
      console.error("Ошибка при сохранении полных данных матча:", storageError)

      // Если не удалось сохранить полные данные, сохраняем только самое необходимое
      const essentialMatchData = {
        id: updatedMatch.id,
        type: updatedMatch.type,
        format: updatedMatch.format,
        createdAt: updatedMatch.createdAt,
        settings: updatedMatch.settings,
        teamA: updatedMatch.teamA,
        teamB: updatedMatch.teamB,
        score: updatedMatch.score,
        currentServer: updatedMatch.currentServer,
        courtSides: updatedMatch.courtSides,
        shouldChangeSides: updatedMatch.shouldChangeSides,
        isCompleted: updatedMatch.isCompleted,
        history: [],
      }

      // Удаляем историю геймов для экономии места
      if (essentialMatchData.score && essentialMatchData.score.currentSet) {
        essentialMatchData.score.currentSet.games = []
      }

      if (essentialMatchData.score && essentialMatchData.score.sets) {
        essentialMatchData.score.sets = essentialMatchData.score.sets.map((set) => ({
          teamA: set.teamA,
          teamB: set.teamB,
          winner: set.winner,
          games: [],
        }))
      }

      localStorage.setItem(singleMatchKey, compressToUTF16(JSON.stringify(essentialMatchData)))
    }

    // Обновляем запись в общем списке
    const matches = JSON.parse(localStorage.getItem("tennis_padel_matches") || "[]")
    const index = matches.findIndex((match) => match.id === updatedMatch.id)

    if (index !== -1) {
      matches[index] = {
        id: updatedMatch.id,
        type: updatedMatch.type,
        format: updatedMatch.format,
        createdAt: updatedMatch.createdAt,
        teamA: {
          players: updatedMatch.teamA.players,
        },
        teamB: {
          players: updatedMatch.teamB.players,
        },
        score: {
          teamA: updatedMatch.score.teamA,
          teamB: updatedMatch.score.teamB,
        },
        isCompleted: updatedMatch.isCompleted,
      }

      localStorage.setItem("tennis_padel_matches", compressToUTF16(JSON.stringify(matches)))
    }

    // Уведомляем другие вкладки об изменении
    window.dispatchEvent(new Event("storage"))

    return true
  } catch (error) {
    console.error("Ошибка при обновлении матча:", error)
    throw error
  }
}

// Удаление матча
export const deleteMatch = async (id) => {
  if (typeof window === "undefined") return false

  try {
    // Удаляем матч из Firebase, если она доступна
    if (isFirebaseReady()) {
      await deleteMatchFromFirebase(id)
    }

    // Удаляем отдельную запись матча из локального хранилища
    localStorage.removeItem(`match_${id}`)

    // Удаляем из общего списка
    const matches = JSON.parse(localStorage.getItem("tennis_padel_matches") || "[]")
    const filteredMatches = matches.filter((match) => match.id !== id)
    localStorage.setItem("tennis_padel_matches", compressToUTF16(JSON.stringify(filteredMatches)))

    // Уведомляем другие вкладки об изменении
    window.dispatchEvent(new Event("storage"))

    return true
  } catch (error) {
    console.error("Ошибка при удалении матча:", error)
    return false
  }
}

// Сохранение матча в URL для шаринга
export const getMatchShareUrl = (matchId) => {
  if (typeof window === "undefined") return ""

  const baseUrl = window.location.origin
  return `${baseUrl}/match/${matchId}`
}

// Функция для экспорта матча в JSON
export const exportMatchToJson = async (matchId) => {
  if (typeof window === "undefined") return null

  try {
    const match = await getMatch(matchId)
    if (!match) return null

    // Создаем копию матча без истории для уменьшения размера
    const exportMatch = { ...match, history: [] }

    // Преобразуем в JSON
    return JSON.stringify(exportMatch)
  } catch (error) {
    console.error("Ошибка при экспорте матча:", error)
    return null
  }
}

// Функция для импорта матча из JSON
export const importMatchFromJson = async (jsonData) => {
  if (typeof window === "undefined") return false

  try {
    const match = JSON.parse(jsonData)

    // Проверяем, что это валидный матч
    if (!match.id || !match.teamA || !match.teamB || !match.score) {
      throw new Error("Некорректный формат данных матча")
    }

    // Сохраняем импортированный матч
    await createMatch(match)
    return match.id
  } catch (error) {
    console.error("Ошибка при импорте матча:", error)
    return false
  }
}

// Подписка на обновления матча в реальном времени
export const subscribeToMatchUpdates = (matchId, callback) => {
  // Если Firebase недоступен, настраиваем локальную подписку через событие storage
  if (!isFirebaseReady()) {
    console.warn("Firebase недоступен, используем локальную подписку на изменения")

    const handleStorageChange = async () => {
      const match = await getMatch(matchId)
      if (match) {
        callback(match)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Также настраиваем периодическую проверку обновлений
    const interval = setInterval(handleStorageChange, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }

  // Если Firebase доступен, используем его для подписки
  return subscribeToMatch(matchId, callback)
}

// Подписка на обновления списка матчей в реальном времени
export const subscribeToMatchesListUpdates = (callback) => {
  // Если Firebase недоступен, настраиваем локальную подписку через событие storage
  if (!isFirebaseReady()) {
    console.warn("Firebase недоступен, используем локальную подписку на изменения")

    const handleStorageChange = async () => {
      const matches = await getMatches()
      callback(matches)
    }

    window.addEventListener("storage", handleStorageChange)

    // Также настраиваем периодическую проверку обновлений
    const interval = setInterval(handleStorageChange, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }

  // Если Firebase доступен, используем его для подписки
  return subscribeToMatchesList(callback)
}
