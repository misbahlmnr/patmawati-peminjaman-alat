import { Loan, formatDateTime } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { X, Package, User, Calendar, Clock, FileText, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  loan: Loan | null;
  onClose: () => void;
  footer?: React.ReactNode;
}

const timelineSteps = [
  { key: 'diminta', label: 'Diminta' },
  { key: 'disetujui', label: 'Disetujui' },
  { key: 'dipinjam', label: 'Dipinjam' },
  { key: 'dikembalikan', label: 'Dikembalikan' },
] as const;

const statusOrder: Record<string, number> = {
  diminta: 0, ditolak: 0, disetujui: 1, diambil: 3,
  dipinjam: 2, terlambat: 2, dikembalikan: 3,
};

export function LoanDetailModal({ loan, onClose, footer }: Props) {
  if (!loan) return null;
  const isBahan = loan.itemType === 'bahan';
  const currentStep = statusOrder[loan.status] ?? 0;

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl p-6 max-w-lg w-full my-8 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Detail {isBahan ? 'Pengambilan Bahan' : 'Peminjaman'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={cn(
              'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
              isBahan ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'
            )}>
              {isBahan ? 'Bahan' : 'Alat'}
            </span>
            <StatusBadge status={loan.status} />
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isBahan ? 'bg-warning/10' : 'bg-primary/10'
            )}>
              {isBahan ? <Package className="w-5 h-5 text-warning" /> : <Wrench className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <p className="font-medium text-foreground">{loan.equipmentName}</p>
              <p className="text-sm text-muted-foreground">Jumlah: {loan.quantity} unit</p>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Peminjam & Pembimbing</span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Nama:</span> {loan.borrowerName}</p>
              {loan.borrowerClass && <p><span className="text-muted-foreground">Kelas:</span> {loan.borrowerClass}</p>}
              {loan.teacherName && <p><span className="text-muted-foreground">Guru Pembimbing:</span> {loan.teacherName}</p>}
            </div>
          </div>

          {!isBahan && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pinjam</span>
                </div>
                <p className="text-sm font-medium">
                  {loan.borrowDate && loan.borrowTime ? formatDateTime(loan.borrowDate, loan.borrowTime) : '-'}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Batas Kembali</span>
                </div>
                <p className="text-sm font-medium">
                  {loan.dueDate && loan.dueTime ? formatDateTime(loan.dueDate, loan.dueTime) : '-'}
                </p>
              </div>
            </div>
          )}

          {loan.notes && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Catatan / Keperluan</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6 whitespace-pre-line">{loan.notes}</p>
            </div>
          )}

          {loan.rejectionReason && (
            <div className="bg-destructive/10 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Alasan Penolakan</p>
                <p className="text-sm text-destructive/80">{loan.rejectionReason}</p>
              </div>
            </div>
          )}

          {!isBahan && (
            <div>
              <p className="text-sm font-medium mb-3">Timeline Status</p>
              <div className="space-y-2">
                {timelineSteps.map((step, idx) => {
                  const active = currentStep >= idx;
                  const isLate = loan.status === 'terlambat' && step.key === 'dipinjam';
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                        isLate ? 'bg-destructive text-destructive-foreground' :
                        active ? 'bg-success text-success-foreground' : 'bg-secondary text-muted-foreground'
                      )}>
                        {active ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={cn('text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>
                        {isLate ? 'Terlambat' : step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {footer && <div className="pt-4 mt-4 border-t border-border">{footer}</div>}
        {!footer && (
          <div className="pt-4 mt-4 border-t border-border">
            <button onClick={onClose} className="btn-outline w-full">Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
