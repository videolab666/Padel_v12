// Инициализация Firebase
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database"

// Флаг, указывающий, доступен ли Firebase
let isFirebaseAvailable = false

// Конфигурация Firebase
// Замените на свои данные после создания проекта в Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBP5DHKC9FULxAhDs9k7HZVZrR",
  authDomain: "padel-66fea.firebaseapp.com",
  databaseURL: "https://padel-66fea-default-rtdb.firebaseio.com",
  projectId: "padel-66fea",
  storageBucket: "padel-66fea.appspot.com",
  messagingSenderId: "1032929958517",
  appId: "1:1032929958517:web:8ca7d2ae36edc1381f363c",
  measurementId: "G-LQF94BXEZ5",
}

// Инициализация Firebase
let app
let database

// Инициализация Firebase только на клиенте
if (typeof window !== "undefined") {
  try {
    app = initializeApp(firebaseConfig)
    database = getDatabase(app)

    // Проверяем доступность базы данных
    const testRef = ref(database, ".info/connected")
    const unsubscribe = onValue(
      testRef,
      (snapshot) => {
        isFirebaseAvailable = snapshot.val() === true
        console.log(`Firebase database is ${isFirebaseAvailable ? "connected" : "disconnected"}`)
        unsubscribe()
      },
      (error) => {
        console.error("Firebase connection test failed:", error)
        isFirebaseAvailable = false
      },
    )

    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    isFirebaseAvailable = false
  }
}

// Функция для проверки доступности Firebase
export const isFirebaseReady = () => {
  return isFirebaseAvailable && database !== undefined
}

// Функция для получения ссылки на базу данных
export const getFirebaseDatabase = () => {
  if (!isFirebaseReady()) {
    throw new Error("Firebase database is not available")
  }
  return database
}

// Функция для получения ссылки на матч
export const getMatchRef = (matchId) => {
  if (!isFirebaseReady()) {
    throw new Error("Firebase database is not available")
  }
  const db = getFirebaseDatabase()
  return ref(db, `matches/${matchId}`)
}

// Функция для получения ссылки на список матчей
export const getMatchesListRef = () => {
  if (!isFirebaseReady()) {
    throw new Error("Firebase database is not available")
  }
  const db = getFirebaseDatabase()
  return ref(db, "matchesList")
}

// Функция для сохранения матча в Firebase
export const saveMatchToFirebase = async (match) => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping cloud save")
    return false
  }

  try {
    const matchRef = getMatchRef(match.id)
    await set(matchRef, match)

    // Также сохраняем краткую информацию о матче в список матчей
    const matchesListRef = getMatchesListRef()
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

    // Получаем текущий список матчей
    const snapshot = await get(matchesListRef)
    const matchesList = snapshot.exists() ? snapshot.val() : {}

    // Добавляем или обновляем информацию о матче
    matchesList[match.id] = matchSummary

    // Сохраняем обновленный список
    await set(matchesListRef, matchesList)

    return true
  } catch (error) {
    console.error("Error saving match to Firebase:", error)
    return false
  }
}

// Функция для получения матча из Firebase
export const getMatchFromFirebase = async (matchId) => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping cloud fetch")
    return null
  }

  try {
    const matchRef = getMatchRef(matchId)
    const snapshot = await get(matchRef)

    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting match from Firebase:", error)
    return null
  }
}

// Функция для получения списка матчей из Firebase
export const getMatchesListFromFirebase = async () => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping cloud fetch")
    return []
  }

  try {
    const matchesListRef = getMatchesListRef()
    const snapshot = await get(matchesListRef)

    if (snapshot.exists()) {
      const matchesList = snapshot.val()
      // Преобразуем объект в массив и сортируем по дате создания (от новых к старым)
      return Object.values(matchesList).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    } else {
      return []
    }
  } catch (error) {
    console.error("Error getting matches list from Firebase:", error)
    return []
  }
}

// Функция для подписки на изменения матча
export const subscribeToMatch = (matchId, callback) => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping real-time updates")
    return () => {}
  }

  try {
    const matchRef = getMatchRef(matchId)
    return onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val())
      } else {
        callback(null)
      }
    })
  } catch (error) {
    console.error("Error subscribing to match:", error)
    return () => {}
  }
}

// Функция для подписки на изменения списка матчей
export const subscribeToMatchesList = (callback) => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping real-time updates")
    return () => {}
  }

  try {
    const matchesListRef = getMatchesListRef()
    return onValue(matchesListRef, (snapshot) => {
      if (snapshot.exists()) {
        const matchesList = snapshot.val()
        // Преобразуем объект в массив и сортируем по дате создания (от новых к старым)
        callback(
          Object.values(matchesList).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        )
      } else {
        callback([])
      }
    })
  } catch (error) {
    console.error("Error subscribing to matches list:", error)
    return () => {}
  }
}

// Функция для удаления матча из Firebase
export const deleteMatchFromFirebase = async (matchId) => {
  if (!isFirebaseReady()) {
    console.warn("Firebase is not available, skipping cloud delete")
    return false
  }

  try {
    // Удаляем матч
    const matchRef = getMatchRef(matchId)
    await remove(matchRef)

    // Удаляем информацию о матче из списка матчей
    const matchesListRef = getMatchesListRef()
    const snapshot = await get(matchesListRef)

    if (snapshot.exists()) {
      const matchesList = snapshot.val()
      if (matchesList[matchId]) {
        delete matchesList[matchId]
        await set(matchesListRef, matchesList)
      }
    }

    return true
  } catch (error) {
    console.error("Error deleting match from Firebase:", error)
    return false
  }
}
