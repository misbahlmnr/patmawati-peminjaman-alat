import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { loansData } from '@/data/mockData';
import { LoanStatus, formatDateTime } from '@/types';
import { Search, Download, FileText, Eye, Check, X, Calendar, Clock, User, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Loans() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [detailModal, setDetailModal] = useState<{ open: boolean; loanId: string | null }>({ open: false, loanId: null });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; loanId: string | null }>({ open: false, loanId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const filteredLoans = loansData.filter(loan => {
    const matchesSearch = 
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.equipmentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: loansData.length,
    diminta: loansData.filter(l => l.status === 'diminta').length,
    disetujui: loansData.filter(l => l.status === 'disetujui').length,
    dipinjam: loansData.filter(l => l.status === 'dipinjam').length,
    terlambat: loansData.filter(l => l.status === 'terlambat').length,
    dikembalikan: loansData.filter(l => l.status === 'dikembalikan').length,
  };

  const getLoan = (id: string) => loansData.find(l => l.id === id);

  const handleViewDetail = (loanId: string) => {
    setDetailModal({ open: true, loanId });
  };

  const handleApprove = (loanId: string) => {
    console.log('Approve loan:', loanId);
    setDetailModal({ open: false, loanId: null });
    setShowSuccess({ show: true, message: 'Peminjaman berhasil disetujui!' });
    setTimeout(() => setShowSuccess({ show: false, message: '' }), 3000);
  };

  const handleOpenReject = (loanId: string) => {
    setDetailModal({ open: false, loanId: null });
    setRejectModal({ open: true, loanId });
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    console.log('Reject loan:', rejectModal.loanId, 'Reason:', rejectReason);
    setRejectModal({ open: false, loanId: null });
    setRejectReason('');
    setShowSuccess({ show: true, message: 'Peminjaman ditolak.' });
    setTimeout(() => setShowSuccess({ show: false, message: '' }), 3000);
  };

  return (
    <div className="animate-fade-in">
      {/* Success Toast */}
      {showSuccess.show && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{showSuccess.message}</h3>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.loanId && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full animate-scale-in my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Detail Peminjaman</h3>
              <button 
                onClick={() => setDetailModal({ open: false, loanId: null })}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {(() => {
              const loan = getLoan(detailModal.loanId);
              if (!loan) return null;
              
              return (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <StatusBadge status={loan.status} />
                  </div>

                  {/* Equipment Info */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{loan.equipmentName}</p>
                        <p className="text-sm text-muted-foreground">Jumlah: {loan.quantity} unit</p>
                      </div>
                    </div>
                  </div>

                  {/* Borrower Info */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Informasi Peminjam</span>
                    </div>
                    <div className="ml-7 space-y-1">
                      <p className="text-sm"><span className="text-muted-foreground">Nama:</span> {loan.borrowerName}</p>
                      {loan.borrowerClass && (
                        <p className="text-sm"><span className="text-muted-foreground">Kelas:</span> {loan.borrowerClass}</p>
                      )}
                      {loan.teacherName && (
                        <p className="text-sm"><span className="text-muted-foreground">Guru Pembimbing:</span> {loan.teacherName}</p>
                      )}
                    </div>
                  </div>

                  {/* Date/Time Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Tanggal & Waktu Pinjam</span>
                      </div>
                      <p className="text-sm font-medium">
                        {loan.borrowDate && loan.borrowTime 
                          ? formatDateTime(loan.borrowDate, loan.borrowTime) 
                          : loan.requestDate && loan.requestTime 
                          ? formatDateTime(loan.requestDate, loan.requestTime)
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Batas Pengembalian</span>
                      </div>
                      <p className="text-sm font-medium">
                        {loan.dueDate && loan.dueTime 
                          ? formatDateTime(loan.dueDate, loan.dueTime) 
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {loan.notes && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Catatan / Keperluan</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{loan.notes}</p>
                    </div>
                  )}

                  {/* Actions for pending requests */}
                  {loan.status === 'diminta' && user?.role === 'admin' && (
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => handleOpenReject(loan.id)}
                        className="btn-outline flex-1 text-destructive border-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(loan.id)}
                        className="btn-primary flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Setujui
                      </button>
                    </div>
                  )}

                  {/* Close button for non-pending */}
                  {loan.status !== 'diminta' && (
                    <div className="pt-4 border-t border-border">
                      <button
                        onClick={() => setDetailModal({ open: false, loanId: null })}
                        className="btn-outline w-full"
                      >
                        Tutup
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.loanId && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Tolak Peminjaman</h3>
              <button 
                onClick={() => setRejectModal({ open: false, loanId: null })}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-destructive/10 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Anda akan menolak permintaan peminjaman dari <strong>{getLoan(rejectModal.loanId)?.borrowerName}</strong> untuk <strong>{getLoan(rejectModal.loanId)?.equipmentName}</strong>.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Alasan Penolakan <span className="text-destructive">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="form-input min-h-[100px] resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ open: false, loanId: null })}
                className="btn-outline flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="btn-primary flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-2" />
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">
            {user?.role === 'admin' ? 'Manajemen Peminjaman' : 'Peminjaman Siswa'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredLoans.length} data peminjaman
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-outline">
            <Download className="w-4 h-4 mr-2" />
            Export Laporan
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'diminta', 'disetujui', 'dipinjam', 'terlambat', 'dikembalikan'] as const).map((status) => (
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
            {status === 'all' ? 'Semua' : <StatusBadge status={status} />}
            <span className="ml-2">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari peminjam atau peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Loans Table */}
      {filteredLoans.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Peminjam</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Peralatan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tanggal & Waktu</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">{loan.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">{loan.borrowerClass}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">{loan.equipmentName}</p>
                        <p className="text-xs text-muted-foreground">{loan.quantity} unit</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-foreground">
                          {loan.borrowDate && loan.borrowTime 
                            ? formatDateTime(loan.borrowDate, loan.borrowTime)
                            : loan.requestDate && loan.requestTime
                            ? formatDateTime(loan.requestDate, loan.requestTime)
                            : '-'}
                        </p>
                        {loan.dueDate && loan.dueTime && (
                          <p className="text-xs text-muted-foreground">
                            s/d {formatDateTime(loan.dueDate, loan.dueTime)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetail(loan.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detail
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
