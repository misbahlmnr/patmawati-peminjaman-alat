import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, InspectionResult } from '@/contexts/DataContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CollateralStatusBadge } from '@/components/ui/CollateralStatusBadge';
import { LoanDetailModal } from '@/components/loans/LoanDetailModal';
import { Loan, LoanStatus, formatDateTime } from '@/types';
import { Search, FileText, Eye, Check, X, AlertCircle, Download, CreditCard, Search as SearchIcon, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function Loans() {
  const { user } = useAuth();
  const { loans, approveLoan, rejectLoan, confirmReturn, inspectReturn } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [detail, setDetail] = useState<Loan | null>(null);
  const [rejectFor, setRejectFor] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveFor, setApproveFor] = useState<Loan | null>(null);
  const [inspectFor, setInspectFor] = useState<Loan | null>(null);
  const [inspResult, setInspResult] = useState<'lengkap' | 'tidak_lengkap' | 'rusak'>('lengkap');
  const [inspNotes, setInspNotes] = useState('');
  const [inspMissing, setInspMissing] = useState('');
  const [inspDamage, setInspDamage] = useState('');
  const [inspAmount, setInspAmount] = useState('');
  const [inspCompDesc, setInspCompDesc] = useState('');
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => loans
    .filter(l => l.itemType === 'alat')
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .filter(l => l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 l.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.requestDate + b.requestTime).localeCompare(a.requestDate + a.requestTime))
  , [loans, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const base = loans.filter(l => l.itemType === 'alat');
    return {
      all: base.length,
      diminta: base.filter(l => l.status === 'diminta').length,
      disetujui: base.filter(l => l.status === 'disetujui').length,
      dipinjam: base.filter(l => l.status === 'dipinjam').length,
      terlambat: base.filter(l => l.status === 'terlambat').length,
      menunggu_inspeksi: base.filter(l => l.status === 'menunggu_inspeksi').length,
      dikembalikan: base.filter(l => l.status === 'dikembalikan').length,
      ditolak: base.filter(l => l.status === 'ditolak').length,
      diambil: 0,
    };
  }, [loans]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const handleApproveClick = (l: Loan) => {
    if (l.borrowScope === 'bawa_pulang') {
      setApproveFor(l); setDetail(null);
    } else {
      approveLoan(l.id); setDetail(null); showToast('Peminjaman disetujui & stok diperbarui');
    }
  };
  const confirmApprove = () => {
    if (!approveFor) return;
    approveLoan(approveFor.id);
    showToast('Disetujui. Kartu pelajar tercatat ditahan.');
    setApproveFor(null);
  };
  const handleReturnClick = (l: Loan) => {
    if (l.borrowScope === 'bawa_pulang') {
      setInspectFor(l); setDetail(null);
      setInspResult('lengkap'); setInspNotes(''); setInspMissing(''); setInspDamage(''); setInspAmount(''); setInspCompDesc('');
    } else {
      confirmReturn(l.id); setDetail(null); showToast('Pengembalian dikonfirmasi');
    }
  };
  const submitInspection = () => {
    if (!inspectFor) return;
    const payload: InspectionResult = {
      result: inspResult,
      notes: inspNotes || undefined,
      missingItems: inspMissing || undefined,
      damageDescription: inspDamage || undefined,
      compensationAmount: inspAmount ? Number(inspAmount) : undefined,
      compensationDescription: inspCompDesc || undefined,
    };
    inspectReturn(inspectFor.id, payload);
    setInspectFor(null);
    showToast(inspResult === 'lengkap' ? 'Pengembalian lengkap — kartu dikembalikan' : 'Pengembalian dicatat — kartu tetap ditahan');
  };
  const handleReject = () => {
    if (!rejectFor || !rejectReason.trim()) return;
    rejectLoan(rejectFor.id, rejectReason);
    setRejectFor(null); setRejectReason(''); showToast('Peminjaman ditolak');
  };


  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 bg-card border border-success rounded-lg shadow-lg p-4 z-50 flex items-center gap-2 animate-slide-up">
          <Check className="w-5 h-5 text-success" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <LoanDetailModal
        loan={detail}
        onClose={() => setDetail(null)}
        footer={detail && user?.role === 'admin' ? (
          detail.status === 'diminta' ? (
            <div className="flex gap-3">
              <button onClick={() => { setRejectFor(detail); setDetail(null); }}
                className="btn-outline flex-1 text-destructive border-destructive hover:bg-destructive/10">
                <X className="w-4 h-4 mr-2" /> Tolak
              </button>
              <button onClick={() => handleApproveClick(detail)} className="btn-primary flex-1">
                <Check className="w-4 h-4 mr-2" /> Setujui
              </button>
            </div>
          ) : detail.status === 'menunggu_inspeksi' || (detail.returnRequestedAt && (detail.status === 'dipinjam' || detail.status === 'terlambat')) ? (
            <button onClick={() => handleReturnClick(detail)} className="btn-primary w-full">
              {detail.borrowScope === 'bawa_pulang' ? <><SearchIcon className="w-4 h-4 mr-2" /> Inspeksi Pengembalian</> : <><Check className="w-4 h-4 mr-2" /> Konfirmasi Pengembalian</>}
            </button>
          ) : undefined
        ) : undefined}
      />

      {rejectFor && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Tolak Peminjaman</h3>
              <button onClick={() => setRejectFor(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                Tolak permintaan dari <strong>{rejectFor.borrowerName}</strong> untuk <strong>{rejectFor.equipmentName}</strong>?
              </p>
            </div>
            <label className="block text-sm font-medium mb-2">Alasan Penolakan *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Masukkan alasan..." className="form-input min-h-[80px] resize-none mb-4" required />
            <div className="flex gap-3">
              <button onClick={() => setRejectFor(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="btn-primary flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50">
                <X className="w-4 h-4 mr-2" /> Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="section-title">{user?.role === 'admin' ? 'Manajemen Peminjaman' : 'Peminjaman Siswa'}</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} data peminjaman alat</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-outline"><Download className="w-4 h-4 mr-2" /> Export</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'diminta', 'disetujui', 'dipinjam', 'terlambat', 'dikembalikan', 'ditolak'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium',
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}>
            {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari peminjam atau peralatan..." className="form-input pl-10" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Peminjam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Peralatan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(loan => (
                  <tr key={loan.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{loan.borrowerName}</p>
                      <p className="text-xs text-muted-foreground">{loan.borrowerClass}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{loan.equipmentName}</p>
                      <p className="text-xs text-muted-foreground">{loan.quantity} unit</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{loan.borrowDate && loan.borrowTime ? formatDateTime(loan.borrowDate, loan.borrowTime) : formatDateTime(loan.requestDate, loan.requestTime)}</p>
                      {loan.dueDate && loan.dueTime && (
                        <p className="text-xs text-muted-foreground">s/d {formatDateTime(loan.dueDate, loan.dueTime)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                      {loan.returnRequestedAt && (loan.status === 'dipinjam' || loan.status === 'terlambat') && (
                        <p className="text-[10px] text-warning mt-1">⚠ Minta dikembalikan</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setDetail(loan)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                        <Eye className="w-4 h-4 mr-1" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Tidak ada data peminjaman</p>
        </div>
      )}
    </div>
  );
}
