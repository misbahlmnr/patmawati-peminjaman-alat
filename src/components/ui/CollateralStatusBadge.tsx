import { cn } from '@/lib/utils';
import { LoanCollateral } from '@/types';
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react';

export function CollateralStatusBadge({ collateral, className }: { collateral?: LoanCollateral; className?: string }) {
  if (!collateral || collateral.status === 'tidak_diperlukan') return null;
  const isHeld = collateral.status === 'ditahan';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
      isHeld ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success',
      className,
    )}>
      {isHeld ? <Lock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      <CreditCard className="w-3 h-3" />
      {isHeld ? 'Kartu Ditahan' : 'Kartu Dikembalikan'}
    </span>
  );
}
