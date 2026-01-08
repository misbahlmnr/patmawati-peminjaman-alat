import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RecentLoansTable } from '@/components/dashboard/RecentLoansTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { loansData } from '@/data/mockData';
import { LoanStatus } from '@/types';
import { Search, Filter, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Loans() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');

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

  const handleApprove = (id: string) => {
    console.log('Approve loan:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject loan:', id);
  };

  return (
    <div className="animate-fade-in">
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
        <RecentLoansTable 
          loans={filteredLoans}
          showActions={user?.role === 'admin'}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Tidak ada data peminjaman</p>
        </div>
      )}
    </div>
  );
}
