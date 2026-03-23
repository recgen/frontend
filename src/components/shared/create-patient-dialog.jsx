"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Plus } from "lucide-react";

export function CreatePatientDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [gender, setGender] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setBirthDate(null);
    setGender("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Введите имя пациента");
      return;
    }
    if (!birthDate) {
      setError("Укажите дату рождения");
      return;
    }
    if (!gender) {
      setError("Выберите пол");
      return;
    }

    setSending(true);
    setError("");

    try {
      await api.post("/patients", {
        name: name.trim(),
        birth_date: birthDate.toISOString(),
        gender,
      });

      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      console.error("Failed to create patient:", err);

      if (err.status === 401) {
        setError("Сессия истекла. Войдите заново.");
      } else if (err.status === 422) {
        setError(`Ошибка валидации: ${err.message}`);
      } else {
        setError("Не удалось создать пациента. Попробуйте снова.");
      }
    } finally {
      setSending(false);
    }
  };
  const today = new Date();
  const fromYear = today.getFullYear() - 120;
  const toYear = today.getFullYear();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Новый пациент
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создание пациента</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Имя</Label>
            <Input
              id="patient-name"
              placeholder="Иванов Иван Иванович"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label>Дата рождения</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={sending}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate
                    ? format(birthDate, "d MMMM yyyy", { locale: ru })
                    : "Выберите дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(date) => {
                    setBirthDate(date);
                    setCalendarOpen(false);
                  }}
                  locale={ru}
                  disabled={(date) => date > today}
                  defaultMonth={birthDate}
                  captionLayout="dropdown"
                  fromYear={fromYear}
                  toYear={toYear}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Пол</Label>
            <Select
              value={gender}
              onValueChange={setGender}
              disabled={sending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите пол" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Мужской</SelectItem>
                <SelectItem value="FEMALE">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
              <span className="text-destructive text-sm">⚠</span>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
