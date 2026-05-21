import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoanDetailModal } from '@/components/loans/LoanDetailModal';
import { Loan, formatDateTime } from '@/types';
import { Search, Clock, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';

export default function History() {
  const { user } = useAuth();
  const { loans } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'alat' | 'bahan'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [detail, setDetail] = useState<Loan | null>(null);

  const filtered = useMemo(() => {
    // Selesai = dikembalikan, ditolak, diambil (utk bahan)
    const finishedStatuses = ['dikembalikan', 'ditolak', 'diambil'];
    return loans
      .filter(l => finishedStatuses.includes(l.status))
      .filter(l => user?.role === 'siswa' ? l.borrowerId === user.id : true)
      .filter(l => typeFilter === 'all' || l.itemType === typeFilter)
      .filter(l => statusFilter === 'all' || l.status === statusFilter)
      .filter(l => {
        if (!fromDate && !toDate) return true;
        const d = l.requestDate;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      })
      .filter(l =>
        l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.equipmentName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.requestDate + b.requestTime).localeCompare(a.requestDate + a.requestTime));
  }, [loans, user, typeFilter, statusFilter, fromDate, toDate, searchQuery]);

  return (
    <div className="animate-fade-in">
      <LoanDetailModal loan={detail} onClose={() => setDetail(null)} />

      <div className="page-header">
        <div>
          <h1 className="section-title">Riwayat</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} data riwayat</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama / barang..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all'|'alat'|'bahan')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="alat">Alat</SelectItem>
            <SelectItem value="bahan">Bahan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
            <SelectItem value="diambil">Diambil</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <DateField value={fromDate} onChange={setFromDate} placeholder="Dari" />
          <DateField value={toDate} onChange={setToDate} placeholder="Sampai" min={fromDate} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Jenis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Barang</th>
                  {user?.role !== 'siswa' && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Peminjam</th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Guru</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(loan => (
                  <tr key={loan.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setDetail(loan)}>
                    <td className="px-4 py-3 text-sm">{formatDateTime(loan.requestDate, loan.requestTime)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        loan.itemType === 'bahan' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'}`}>
                        {loan.itemType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{loan.equipmentName}</p>
                      <p className="text-xs text-muted-foreground">{loan.quantity} unit</p>
                    </td>
                    {user?.role !== 'siswa' && (
                      <td className="px-4 py-3 text-sm">
                        <p>{loan.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">{loan.borrowerClass}</p>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-muted-foreground">{loan.teacherName ?? '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setDetail(loan); }}
                        className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20">
                        <Eye className="w-3 h-3 mr-1" /> Detail
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
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">Belum ada riwayat</p>
          <p className="text-muted-foreground text-sm">Riwayat akan muncul setelah peminjaman selesai</p>
        </div>
      )}
    </div>
  );
}
