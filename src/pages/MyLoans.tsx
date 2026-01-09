import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { loansData } from '@/data/mockData';
import { LoanStatus, formatDateTime } from '@/types';
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle2, Package, Send, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

export default function MyLoans() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [returnModal, setReturnModal] = useState<{ open: boolean; loanId: string | null }>({ open: false, loanId: null });
  const [returnNotes, setReturnNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter loans for current user (demo: show all for testing)
  const myLoans = loansData.filter(loan => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesStatus;
  });

  const getDaysRemaining = (dueDate: string, dueTime?: string) => {
    if (dueTime) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      const dueDateTime = new Date(dueDate);
      dueDateTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      const diffMs = dueDateTime.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 24) {
        return { value: diffHours, unit: 'jam' };
      }
    }
    const days = differenceInDays(new Date(dueDate), new Date());
    return { value: days, unit: 'hari' };
  };

  const handleRequestReturn = (loanId: string) => {
    setReturnModal({ open: true, loanId });
    setReturnNotes('');
  };

  const handleSubmitReturn = () => {
    console.log('Submit return request:', { loanId: returnModal.loanId, notes: returnNotes });
    setReturnModal({ open: false, loanId: null });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getLoan = (id: string) => loansData.find(l => l.id === id);

  return (
    <div className="animate-fade-in">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Permintaan Pengembalian Terkirim!</h3>
            <p className="text-muted-foreground">
              Silakan serahkan peralatan ke admin untuk verifikasi.
            </p>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModal.open && returnModal.loanId && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Ajukan Pengembalian</h3>
              <button 
                onClick={() => setReturnModal({ open: false, loanId: null })}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Loan Info */}
            <div className="bg-secondary/50 rounded-lg p-4 mb-4">
              <p className="font-medium text-foreground">{getLoan(returnModal.loanId)?.equipmentName}</p>
              <p className="text-sm text-muted-foreground">
                Jumlah: {getLoan(returnModal.loanId)?.quantity} unit
              </p>
              {getLoan(returnModal.loanId)?.dueDate && getLoan(returnModal.loanId)?.dueTime && (
                <p className="text-sm text-muted-foreground mt-1">
                  Jatuh Tempo: {formatDateTime(getLoan(returnModal.loanId)!.dueDate!, getLoan(returnModal.loanId)!.dueTime!)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Catatan Pengembalian (Opsional)
              </label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Kondisi peralatan saat dikembalikan..."
                className="form-input min-h-[80px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReturnModal({ open: false, loanId: null })}
                className="btn-outline flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReturn}
                className="btn-primary flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Ajukan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Peminjaman Saya</h1>
          <p className="text-muted-foreground mt-1">
            Kelola peminjaman peralatan Anda
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'diminta', 'disetujui', 'dipinjam', 'terlambat', 'dikembalikan'] as const).map((status) => {
          const count = status === 'all' 
            ? myLoans.length 
            : myLoans.filter(l => l.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Loans List */}
      {myLoans.length > 0 ? (
        <div className="space-y-4">
          {myLoans.map((loan) => {
            const remaining = loan.dueDate ? getDaysRemaining(loan.dueDate, loan.dueTime) : null;
            const isOverdue = remaining !== null && remaining.value < 0;
            const isUrgent = remaining !== null && remaining.value >= 0 && remaining.value <= 2;

            return (
              <div 
                key={loan.id}
                className={cn(
                  "bg-card rounded-xl border p-5 transition-all hover:shadow-elevated",
                  loan.status === 'terlambat' 
                    ? 'border-destructive/30 bg-destructive/5' 
                    : 'border-border'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Equipment Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {loan.equipmentName}
                        </h3>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Jumlah: {loan.quantity} unit
                      </p>
                      {loan.teacherName && (
                        <p className="text-sm text-muted-foreground">
                          Guru Pembimbing: {loan.teacherName}
                        </p>
                      )}
                      {loan.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Catatan: {loan.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates with Time */}
                  <div className="flex flex-wrap gap-6 lg:gap-8">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tanggal & Waktu Pinjam</p>
                        <p className="text-sm font-medium">
                          {loan.borrowDate && loan.borrowTime
                            ? formatDateTime(loan.borrowDate, loan.borrowTime)
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className={cn(
                        "w-4 h-4",
                        isOverdue ? 'text-destructive' : isUrgent ? 'text-warning' : 'text-muted-foreground'
                      )} />
                      <div>
                        <p className="text-xs text-muted-foreground">Jatuh Tempo</p>
                        <p className={cn(
                          "text-sm font-medium",
                          isOverdue && 'text-destructive',
                          isUrgent && !isOverdue && 'text-warning'
                        )}>
                          {loan.dueDate && loan.dueTime
                            ? formatDateTime(loan.dueDate, loan.dueTime)
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Days/Hours indicator */}
                    {remaining !== null && loan.status !== 'dikembalikan' && (
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                        isOverdue 
                          ? 'bg-destructive/10 text-destructive' 
                          : isUrgent 
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      )}>
                        {isOverdue ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isOverdue 
                            ? `Terlambat ${Math.abs(remaining.value)} ${remaining.unit}`
                            : `${remaining.value} ${remaining.unit} lagi`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(loan.status === 'dipinjam' || loan.status === 'terlambat') && (
                    <button 
                      onClick={() => handleRequestReturn(loan.id)}
                      className="btn-primary lg:ml-4"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Ajukan Pengembalian
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">Belum ada peminjaman</p>
          <p className="text-muted-foreground">
            Kunjungi halaman peralatan untuk meminjam peralatan
          </p>
        </div>
      )}
    </div>
  );
}
