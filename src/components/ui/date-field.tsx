import * as React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateFieldProps {
  value?: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  className?: string;
}

export function DateField({ value, onChange, placeholder = "Pilih tanggal", disabled, min, className }: DateFieldProps) {
  const date = value ? new Date(value + "T00:00:00") : undefined;
  const minDate = min ? new Date(min + "T00:00:00") : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {date ? format(date, "dd MMM yyyy", { locale: idLocale }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(format(d, "yyyy-MM-dd"))}
          disabled={(d) => (minDate ? d < minDate : false)}
          initialFocus
          locale={idLocale}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
