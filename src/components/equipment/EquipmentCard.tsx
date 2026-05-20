import { Equipment } from '@/types';
import { Camera, Mic, Cable, Monitor, Lightbulb, Headphones, Video, Box, Cpu, Wrench, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentCardProps {
  equipment: Equipment;
  onBorrow?: () => void;
  showBorrowButton?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  Kamera: Camera,
  Mikrofon: Mic,
  Kabel: Cable,
  Mixer: Monitor,
  Lighting: Lightbulb,
  Headphone: Headphones,
  Stabilizer: Video,
  Tripod: Box,
  'Alat Elektro': Cpu,
  Tools: Wrench,
  'Komponen Elektro': Cpu,
  Konsumabel: Package,
};

export function EquipmentCard({ equipment, onBorrow, showBorrowButton = true }: EquipmentCardProps) {
  const Icon = categoryIcons[equipment.category] || Box;
  const isBahan = equipment.itemType === 'bahan';
  const remaining = isBahan ? (equipment.stockRemaining ?? equipment.available) : equipment.available;
  const lowStock = isBahan && equipment.minStock !== undefined && remaining <= equipment.minStock;

  return (
    <div className="equipment-card animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          isBahan ? "bg-warning/10" : "bg-primary/10"
        )}>
          <Icon className={cn("w-7 h-7", isBahan ? "text-warning" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
              isBahan ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
            )}>
              {isBahan ? 'Bahan' : 'Alat'}
            </span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">{equipment.category}</p>
        </div>
      </div>

      {equipment.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {equipment.description}
        </p>
      )}

      {/* Stock Info */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {isBahan ? 'Sisa Stok' : 'Ketersediaan'}
          </span>
          <span className={cn(
            "font-semibold px-2 py-0.5 rounded",
            remaining <= 0
              ? 'bg-destructive/10 text-destructive'
              : lowStock
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success'
          )}>
            {remaining} / {equipment.stock} {isBahan ? equipment.unit : 'unit'}
          </span>
        </div>
        {lowStock && (
          <p className="text-xs text-warning mt-1">⚠ Stok menipis</p>
        )}
      </div>

      {/* Lokasi (alat) */}
      {!isBahan && equipment.location && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Lokasi:</span>
          <span className="font-medium text-foreground">{equipment.location}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {!isBahan ? (
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            equipment.condition === 'baik'
              ? 'bg-success/10 text-success'
              : equipment.condition === 'rusak_ringan'
              ? 'bg-warning/10 text-warning'
              : 'bg-destructive/10 text-destructive'
          )}>
            {equipment.condition === 'baik' ? 'Kondisi Baik' :
             equipment.condition === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sekali pakai</span>
        )}

        {showBorrowButton && remaining > 0 && (
          <button
            onClick={onBorrow}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {isBahan ? 'Ambil' : 'Pinjam'}
          </button>
        )}
      </div>
    </div>
  );
}
