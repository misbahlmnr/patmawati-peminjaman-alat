import { Equipment } from '@/types';
import { Camera, Mic, Cable, Monitor, Lightbulb, Headphones, Video, Box } from 'lucide-react';
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
};

export function EquipmentCard({ equipment, onBorrow, showBorrowButton = true }: EquipmentCardProps) {
  const Icon = categoryIcons[equipment.category] || Box;
  const availabilityPercent = (equipment.available / equipment.stock) * 100;
  
  return (
    <div className="equipment-card animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">{equipment.category}</p>
        </div>
      </div>

      {/* Description */}
      {equipment.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {equipment.description}
        </p>
      )}

      {/* Stock Info */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Ketersediaan</span>
          <span className="font-medium text-foreground">
            {equipment.available} / {equipment.stock} unit
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              availabilityPercent > 50 ? 'bg-success' : 
              availabilityPercent > 20 ? 'bg-warning' : 'bg-destructive'
            )}
            style={{ width: `${availabilityPercent}%` }}
          />
        </div>
      </div>

      {/* Location */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Lokasi:</span>
        <span className="font-medium text-foreground">{equipment.location}</span>
      </div>

      {/* Condition Badge */}
      <div className="mt-3 flex items-center justify-between">
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

        {showBorrowButton && equipment.available > 0 && (
          <button
            onClick={onBorrow}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Pinjam
          </button>
        )}
      </div>
    </div>
  );
}
