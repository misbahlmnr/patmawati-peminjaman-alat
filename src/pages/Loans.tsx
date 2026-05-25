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
      antrian: base.filter(l => l.status === 'antrian').length,
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
          detail.status === 'diminta' || detail.status === 'antrian' ? (
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

      {approveFor && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Konfirmasi Setujui (Bawa Pulang)</h3>
              <button onClick={() => setApproveFor(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-sm">
                Pastikan <strong>kartu pelajar</strong> milik <strong>{approveFor.borrowerName}</strong> telah Anda terima sebelum melepas alat <strong>{approveFor.equipmentName}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveFor(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={confirmApprove} className="btn-primary flex-1">
                <Check className="w-4 h-4 mr-2" /> Kartu Diterima — Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectFor && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full my-8 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><SearchIcon className="w-5 h-5" /> Inspeksi Pengembalian</h3>
              <button onClick={() => setInspectFor(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium">{inspectFor.equipmentName}</p>
              <p className="text-xs text-muted-foreground">{inspectFor.borrowerName} • {inspectFor.quantity} unit</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Hasil Inspeksi</Label>
                <RadioGroup value={inspResult} onValueChange={(v) => setInspResult(v as typeof inspResult)} className="gap-2">
                  {[
                    { v: 'lengkap', l: 'Lengkap & Baik', d: 'Alat utuh, kartu pelajar dikembalikan' },
                    { v: 'tidak_lengkap', l: 'Tidak Lengkap', d: 'Ada komponen yang hilang' },
                    { v: 'rusak', l: 'Rusak', d: 'Alat dikembalikan dalam kondisi rusak' },
                  ].map(opt => (
                    <label key={opt.v} className={cn('flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer',
                      inspResult === opt.v ? (opt.v === 'lengkap' ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5') : 'border-border'
                    )}>
                      <RadioGroupItem value={opt.v} className="mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">{opt.l}</p>
                        <p className="text-xs text-muted-foreground">{opt.d}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-1.5 block">Catatan inspeksi</Label>
                <Textarea value={inspNotes} onChange={e => setInspNotes(e.target.value)}
                  placeholder="Catatan tambahan..." className="min-h-[64px] resize-none" />
              </div>

              {inspResult === 'tidak_lengkap' && (
                <div>
                  <Label className="mb-1.5 block">Item yang kurang</Label>
                  <Input value={inspMissing} onChange={e => setInspMissing(e.target.value)} placeholder="Mis. Lensa cap, Battery grip" />
                </div>
              )}
              {inspResult === 'rusak' && (
                <div>
                  <Label className="mb-1.5 block">Deskripsi kerusakan</Label>
                  <Input value={inspDamage} onChange={e => setInspDamage(e.target.value)} placeholder="Mis. Layar LCD pecah" />
                </div>
              )}

              {inspResult !== 'lengkap' && (
                <>
                  <div>
                    <Label className="mb-1.5 block">Nominal Ganti Rugi (Rp, opsional)</Label>
                    <Input type="number" value={inspAmount} onChange={e => setInspAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Instruksi untuk siswa</Label>
                    <Textarea value={inspCompDesc} onChange={e => setInspCompDesc(e.target.value)}
                      placeholder="Mis. Ganti unit yang sama atau bayar dalam 7 hari..." className="min-h-[64px] resize-none" />
                  </div>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">Kartu pelajar akan TETAP ditahan hingga kompensasi diselesaikan.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setInspectFor(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={submitInspection} className="btn-primary flex-1">
                <Check className="w-4 h-4 mr-2" /> Simpan Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}


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
        {(['all', 'diminta', 'antrian', 'disetujui', 'dipinjam', 'menunggu_inspeksi', 'terlambat', 'dikembalikan', 'ditolak'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium',
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}>
            {s === 'all' ? 'Semua' : s === 'menunggu_inspeksi' ? 'Inspeksi' : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s as keyof typeof counts]})
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {loan.borrowScope && (
                          <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
                            loan.borrowScope === 'bawa_pulang' ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-foreground')}>
                            <MapPin className="w-2.5 h-2.5" />
                            {loan.borrowScope === 'bawa_pulang' ? 'Bawa Pulang' : 'Di Lab'}
                          </span>
                        )}
                        {loan.schedulePriority && (
                          <span className={cn('inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium',
                            loan.schedulePriority === 'lomba' ? 'bg-destructive/15 text-destructive' :
                            loan.schedulePriority === 'tinggi' ? 'bg-warning/15 text-warning' :
                            'bg-secondary text-muted-foreground')}>
                            {loan.schedulePriority === 'lomba' ? '🏆 Lomba' : loan.schedulePriority === 'tinggi' ? 'Tinggi' : 'Normal'}
                          </span>
                        )}
                        <CollateralStatusBadge collateral={loan.collateral} />
                      </div>
                      {loan.scheduleTitle && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic truncate max-w-[200px]">📅 {loan.scheduleTitle}</p>
                      )}
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
