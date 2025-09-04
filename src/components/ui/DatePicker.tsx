"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDate(date: Date | null) {
  if (!date) return ""
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  label?: string
}

export function DatePicker({ value, onChange, placeholder, label }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | null>(value)
  const [inputValue, setInputValue] = React.useState(formatDate(value))

  React.useEffect(() => {
    setInputValue(formatDate(value))
    setMonth(value)
  }, [value])

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <div className="relative flex items-center">
        <Input
          value={inputValue}
          placeholder={placeholder || "Pilih tanggal"}
          className="bg-background pr-10"
          onChange={e => {
            setInputValue(e.target.value)
            const date = new Date(e.target.value)
            if (!isNaN(date.getTime())) {
              onChange(date)
              setMonth(date)
            }
          }}
          onKeyDown={e => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              tabIndex={-1}
              type="button"
            >
              <CalendarIcon className="size-4" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" alignOffset={-8} sideOffset={10}>
            <Calendar
              mode="single"
              selected={value || undefined}
              captionLayout="dropdown"
              month={month || undefined}
              onMonthChange={setMonth}
              onSelect={date => {
                onChange(date || null)
                setInputValue(formatDate(date || null))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
