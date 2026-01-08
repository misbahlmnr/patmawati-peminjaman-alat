import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { loansData } from '@/data/mockData';
import { LoanStatus } from '@/types';
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

export default function MyLoans() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');

  // Filter loans for current user (demo: show all for testing)
  const myLoans = loansData.filter(loan => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesStatus;
  });

  const activeLoans = myLoans.filter(l => l.status === 'dipinjam' || l.status === 'disetujui' || l.status === 'terlambat');

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  return (
    <div className="animate-fade-in">
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
            const daysRemaining = loan.dueDate ? getDaysRemaining(loan.dueDate) : null;
            const isOverdue = daysRemaining !== null && daysRemaining < 0;
            const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 2;

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
                      {loan.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Catatan: {loan.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-6 lg:gap-8">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tanggal Pinjam</p>
                        <p className="text-sm font-medium">
                          {loan.borrowDate 
                            ? format(new Date(loan.borrowDate), 'd MMM yyyy', { locale: id })
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
                          {loan.dueDate 
                            ? format(new Date(loan.dueDate), 'd MMM yyyy', { locale: id })
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Days indicator */}
                    {daysRemaining !== null && loan.status !== 'dikembalikan' && (
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
                            ? `Terlambat ${Math.abs(daysRemaining)} hari`
                            : `${daysRemaining} hari lagi`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(loan.status === 'dipinjam' || loan.status === 'terlambat') && (
                    <button className="btn-primary lg:ml-4">
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
