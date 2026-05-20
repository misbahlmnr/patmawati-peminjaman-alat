import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoanDetailModal } from '@/components/loans/LoanDetailModal';
import { Loan, formatDateTime } from '@/types';
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle2, Package, Send, X, Check, Eye, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'alat' | 'bahan';

export default function MyLoans() {
  const { user } = useAuth();
  const { loans, requestReturn } = useData();
  const [tab, setTab] = useState<Tab>('all');
  const [detail, setDetail] = useState<Loan | null>(null);
  const [returnFor, setReturnFor] = useState<Loan | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [success, setSuccess] = useState('');

  const myLoans = useMemo(() => loans
    .filter(l => l.borrowerId === user?.id)
    .filter(l => tab === 'all' || l.itemType === tab)
    .sort((a, b) => (b.requestDate + b.requestTime).localeCompare(a.requestDate + a.requestTime))
  , [loans, user, tab]);

  const counts = useMemo(() => ({
    all: loans.filter(l => l.borrowerId === user?.id).length,
    alat: loans.filter(l => l.borrowerId === user?.id && l.itemType === 'alat').length,
    bahan: loans.filter(l => l.borrowerId === user?.id && l.itemType === 'bahan').length,
  }), [loans, user]);

  const getRemaining = (l: Loan) => {
    if (!l.dueDate || !l.dueTime) return null;
    const [h, m] = l.dueTime.split(':').map(Number);
    const due = new Date(l.dueDate); due.setHours(h, m, 0, 0);
    const diffH = (due.getTime() - Date.now()) / 36e5;
    if (Math.abs(diffH) < 24) return { value: Math.floor(diffH), unit: 'jam' };
    return { value: Math.floor(diffH / 24), unit: 'hari' };
  };

  const submitReturn = () => {
    if (!returnFor) return;
    requestReturn(returnFor.id, returnNotes);
    setReturnFor(null); setReturnNotes('');
    setSuccess('Permintaan pengembalian terkirim! Tunggu konfirmasi admin.');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <div className="animate-fade-in">
      {success && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-bold mb-2">Berhasil</h3>
            <p className="text-muted-foreground text-sm">{success}</p>
          </div>
        </div>
      )}

      {returnFor && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Ajukan Pengembalian</h3>
              <button onClick={() => setReturnFor(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 mb-4">
              <p className="font-medium text-sm">{returnFor.equipmentName}</p>
              <p className="text-xs text-muted-foreground">Jumlah: {returnFor.quantity} unit</p>
              {returnFor.dueDate && returnFor.dueTime && (
                <p className="text-xs text-muted-foreground mt-1">Jatuh tempo: {formatDateTime(returnFor.dueDate, returnFor.dueTime)}</p>
              )}
            </div>
            <label className="block text-sm font-medium mb-2">Catatan kondisi (opsional)</label>
            <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
              placeholder="Kondisi peralatan saat dikembalikan..." className="form-input min-h-[80px] resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setReturnFor(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={submitReturn} className="btn-primary flex-1"><Send className="w-4 h-4 mr-2" /> Ajukan</button>
            </div>
          </div>
        </div>
      )}

      <LoanDetailModal
        loan={detail}
        onClose={() => setDetail(null)}
        footer={detail && (detail.status === 'dipinjam' || detail.status === 'terlambat') ? (
          <button onClick={() => { setReturnFor(detail); setDetail(null); }} className="btn-primary w-full">
            <Send className="w-4 h-4 mr-2" /> Ajukan Pengembalian
          </button>
        ) : undefined}
      />

      <div className="page-header">
        <div>
          <h1 className="section-title">Peminjaman Saya</h1>
          <p className="text-muted-foreground mt-1">Riwayat & status peminjaman Anda</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 bg-secondary p-1 rounded-lg w-fit">
        {(['all', 'alat', 'bahan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
            tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            {t === 'alat' && <Wrench className="w-4 h-4" />}
            {t === 'bahan' && <Package className="w-4 h-4" />}
            {t === 'all' ? 'Semua' : t === 'alat' ? 'Alat' : 'Bahan'}
            <span className="opacity-60">({counts[t]})</span>
          </button>
        ))}
      </div>

      {myLoans.length > 0 ? (
        <div className="space-y-3">
          {myLoans.map(loan => {
            const remaining = loan.itemType === 'alat' ? getRemaining(loan) : null;
            const isOverdue = remaining !== null && remaining.value < 0;
            const isUrgent = remaining !== null && remaining.value >= 0 && remaining.value <= 2;
            return (
              <div key={loan.id} className={cn('bg-card rounded-xl border p-4',
                loan.status === 'terlambat' ? 'border-destructive/30 bg-destructive/5' : 'border-border')}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      loan.itemType === 'bahan' ? 'bg-warning/10' : 'bg-primary/10')}>
                      {loan.itemType === 'bahan' ? <Package className="w-5 h-5 text-warning" /> : <Wrench className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{loan.equipmentName}</h3>
                        <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                          loan.itemType === 'bahan' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary')}>
                          {loan.itemType}
                        </span>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">Jumlah: {loan.quantity} • {loan.teacherName ?? '—'}</p>
                      {loan.dueDate && loan.dueTime && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Jatuh tempo: {formatDateTime(loan.dueDate, loan.dueTime)}
                        </p>
                      )}
                    </div>
                  </div>

                  {remaining !== null && loan.status !== 'dikembalikan' && loan.status !== 'ditolak' && (
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                      isOverdue ? 'bg-destructive/10 text-destructive' :
                      isUrgent ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                      {isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isOverdue ? `Terlambat ${Math.abs(remaining.value)} ${remaining.unit}` : `${remaining.value} ${remaining.unit} lagi`}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setDetail(loan)} className="inline-flex items-center px-3 py-1.5 text-sm bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
                      <Eye className="w-4 h-4 mr-1" /> Detail
                    </button>
                    {(loan.status === 'dipinjam' || loan.status === 'terlambat') && (
                      <button onClick={() => setReturnFor(loan)} className="btn-primary text-sm py-1.5 px-3">
                        <Send className="w-4 h-4 mr-1" /> Kembalikan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">Belum ada peminjaman</p>
          <p className="text-muted-foreground text-sm">Ajukan peminjaman dari menu Ajukan Peminjaman</p>
        </div>
      )}
    </div>
  );
}
