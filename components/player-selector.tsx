"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type PlayerSelectorProps = {
  players: Array<{ id: string; name: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PlayerSelector({ players, value, onChange, placeholder = "Выберите игрока" }: PlayerSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedPlayer = players.find((player) => player.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedPlayer ? selectedPlayer.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Поиск игрока..." />
          <CommandList>
            <CommandEmpty>Игрок не найден</CommandEmpty>
            <CommandGroup>
              {players.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.name}
                  onSelect={() => {
                    onChange(player.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === player.id ? "opacity-100" : "opacity-0")} />
                  {player.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
