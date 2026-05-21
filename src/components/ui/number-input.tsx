import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number | "";
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function NumberInput({ value, onChange, min = 0, max, step = 1, disabled, className }: NumberInputProps) {
  const v = typeof value === "number" ? value : 0;
  const dec = () => onChange(Math.max(min, v - step));
  const inc = () => onChange(max !== undefined ? Math.min(max, v + step) : v + step);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={dec} disabled={disabled || v <= min}>
        <Minus className="w-4 h-4" />
      </Button>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        disabled={disabled}
        className="h-10 text-center"
      />
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={inc} disabled={disabled || (max !== undefined && v >= max)}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
