import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { CollateralStatusBadge } from '@/components/ui/CollateralStatusBadge';
import { Loan } from '@/types';
import { CreditCard, Check, AlertTriangle, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoanDetailModal } from '@/components/loans/LoanDetailModal';
import { Textarea } from '@/components/ui/textarea';

type Filter = 'all' | 'pending' | 'siap';

export default function Collateral() {
  const { loans, completeCompensation } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<Loan | null>(null);
  const [completeFor, setCompleteFor] = useState<Loan | null>(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');

  const held = useMemo(() => loans.filter(l =>
    l.itemType === 'alat' && l.collateral?.status === 'ditahan'
  ), [loans]);

  const filtered = useMemo(() => {
    if (filter === 'pending') return held.filter(l => l.compensation?.status === 'pending');
    if (filter === 'siap') return held.filter(l => !l.compensation?.required || l.compensation?.status === 'selesai');
    return held;
  }, [held, filter]);

  const counts = {
    all: held.length,
    pending: held.filter(l => l.compensation?.status === 'pending').length,
    siap: held.filter(l => !l.compensation?.required || l.compensation?.status === 'selesai').length,
  };

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const submitComplete = () => {
    if (!completeFor) return;
    completeCompensation(completeFor.id, note || undefined);
    show('Kompensasi selesai. Kartu pelajar siap dikembalikan.');
    setCompleteFor(null); setNote('');
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 bg-card border border-success rounded-lg shadow-lg p-4 z-50 flex items-center gap-2 animate-slide-up">
          <Check className="w-5 h-5 text-success" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <LoanDetailModal loan={detail} onClose={() => setDetail(null)} />

      {completeFor && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Selesaikan Kompensasi</h3>
              <button onClick={() => setCompleteFor(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium">{completeFor.equipmentName}</p>
              <p className="text-xs text-muted-foreground">{completeFor.borrowerName}</p>
              {completeFor.compensation?.amount !== undefined && (
                <p className="text-xs mt-1">Nominal: <strong>Rp {completeFor.compensation.amount.toLocaleString('id-ID')}</strong></p>
              )}
            </div>
            <label className="block text-sm font-medium mb-2">Catatan penyelesaian (opsional)</label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Mis. Unit pengganti diterima, atau bayar tunai Rp..." className="min-h-[80px] resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setCompleteFor(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={submitComplete} className="btn-primary flex-1">
                <CreditCard className="w-4 h-4 mr-2" /> Selesai — Kembalikan Kartu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="section-title">Jaminan Kartu Pelajar</h1>
          <p className="text-muted-foreground mt-1">{held.length} kartu pelajar sedang ditahan</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { k: 'all' as Filter, l: 'Semua' },
          { k: 'pending' as Filter, l: 'Menunggu Kompensasi' },
          { k: 'siap' as Filter, l: 'Siap Dikembalikan' },
        ]).map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium',
              filter === k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}>
            {l} ({counts[k]})
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(loan => {
            const pending = loan.compensation?.status === 'pending';
            return (
              <div key={loan.id} className={cn('bg-card rounded-xl border p-4',
                pending ? 'border-destructive/30 bg-destructive/5' : 'border-border')}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{loan.borrowerName}</h3>
                        <span className="text-xs text-muted-foreground">{loan.borrowerClass}</span>
                        <CollateralStatusBadge collateral={loan.collateral} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Jaminan untuk: <span className="text-foreground font-medium">{loan.equipmentName}</span>
                      </p>
                      {loan.collateral?.heldAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ditahan sejak: {new Date(loan.collateral.heldAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {pending && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Kompensasi: {loan.compensation?.description ?? 'menunggu penyelesaian'}
                          {loan.compensation?.amount !== undefined && ` (Rp ${loan.compensation.amount.toLocaleString('id-ID')})`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setDetail(loan)} className="inline-flex items-center px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80">
                      <Eye className="w-4 h-4 mr-1" /> Detail
                    </button>
                    {pending ? (
                      <button onClick={() => setCompleteFor(loan)} className="btn-primary text-sm py-1.5 px-3">
                        <Check className="w-4 h-4 mr-1" /> Selesaikan & Kembalikan Kartu
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">Tidak ada kartu pelajar ditahan</p>
          <p className="text-muted-foreground text-sm">Semua kartu telah dikembalikan ke siswa.</p>
        </div>
      )}
    </div>
  );
}
