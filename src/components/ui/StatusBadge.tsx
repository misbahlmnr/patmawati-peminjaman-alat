import { LoanStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: LoanStatus;
  className?: string;
}

const statusConfig: Record<LoanStatus, { label: string; className: string }> = {
  diminta: { label: 'Diminta', className: 'status-requested' },
  disetujui: { label: 'Disetujui', className: 'status-approved' },
  dipinjam: { label: 'Dipinjam', className: 'status-borrowed' },
  terlambat: { label: 'Terlambat', className: 'status-overdue' },
  dikembalikan: { label: 'Dikembalikan', className: 'status-returned' },
  ditolak: { label: 'Ditolak', className: 'status-overdue' },
  diambil: { label: 'Diambil', className: 'status-approved' },
  menunggu_inspeksi: { label: 'Menunggu Inspeksi', className: 'status-requested' },
  antrian: { label: 'Antrian', className: 'status-requested' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
