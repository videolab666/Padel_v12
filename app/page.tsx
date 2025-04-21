import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchList } from "@/components/match-list"
import { FirebaseStatus } from "@/components/firebase-status"

export default function HomePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">Tennis & Padel Scoreboard</h1>
        <p className="text-muted-foreground">Отслеживайте счет в реальном времени</p>
        <div className="mt-2">
          <FirebaseStatus />
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Создать новый матч</CardTitle>
            <CardDescription>Настройте новую игру с выбранными параметрами</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/new-match?type=tennis">
                  <Button className="w-full">Теннис</Button>
                </Link>
                <Link href="/new-match?type=padel">
                  <Button className="w-full">Падел</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Присоединиться к матчу</CardTitle>
            <CardDescription>Введите код матча для просмотра</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/join-match">
                <Button className="w-full">Присоединиться по коду</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активные матчи</CardTitle>
          <CardDescription>Текущие и недавние матчи</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchList />
        </CardContent>
      </Card>
    </div>
  )
}
