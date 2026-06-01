"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  id?: string;
  placeholder?: string;
};

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Elegí una fecha",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 w-full justify-start gap-2 px-3 text-left font-normal text-foreground",
          !value && "text-muted-foreground",
        )}
      >
        <CalendarIcon className="size-4 opacity-70" />
        {value ? (
          <span className="capitalize">
            {format(value, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
