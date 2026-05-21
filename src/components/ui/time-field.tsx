import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeFieldProps {
  value?: string; // HH:MM
  onChange: (v: string) => void;
  disabled?: boolean;
  minuteStep?: number;
  className?: string;
}

export function TimeField({ value, onChange, disabled, minuteStep = 5, className }: TimeFieldProps) {
  const [hh = "", mm = ""] = (value ?? "").split(":");
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) =>
    (i * minuteStep).toString().padStart(2, "0")
  );
  const set = (h: string, m: string) => onChange(`${h || "00"}:${m || "00"}`);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Clock className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />
      <Select value={hh} onValueChange={(v) => set(v, mm)} disabled={disabled}>
        <SelectTrigger className="h-10 w-[72px]"><SelectValue placeholder="Jam" /></SelectTrigger>
        <SelectContent className="max-h-[260px]">
          {hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={mm} onValueChange={(v) => set(hh, v)} disabled={disabled}>
        <SelectTrigger className="h-10 w-[72px]"><SelectValue placeholder="Mnt" /></SelectTrigger>
        <SelectContent className="max-h-[260px]">
          {minutes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
